// app/api/banks/sync/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

export async function POST() {
  try {
    // 1. Fetch CSV dari Google Sheets
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1435714791&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // 2. Parse CSV
    const records = parse(csvText, {
      skip_empty_lines: true,
      trim: true
    });

    // 3. Deteksi bagian DEPOSIT dan WITHDRAW
    let currentSection = null;
    const banks = [];
    
    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      
      // Deteksi section DEPOSIT
      if (row[0] === 'DEPOSIT') {
        currentSection = 'deposit';
        i += 2; // Skip header rows
        continue;
      }
      
      // Deteksi section WITHDRAW
      if (row[0] === 'WITHDRAW') {
        currentSection = 'withdrawal';
        i += 2; // Skip header rows
        continue;
      }
      
      // Proses data berdasarkan section
      if (currentSection === 'deposit' && row[1] === 'YES') {
        banks.push({
          bank: row[3], // JENIS BANK
          account_name: row[4]?.replace(/\n/g, '').trim(), // NAMA BANK
          account_number: row[5]?.toString().trim(), // NO REK
          status: row[27] === 'AKTIF', // STATUS BANK
          display: true,
          used: false,
          type: 'deposit',
          source: 'google_sheets',
          last_sync_at: new Date()
        });
      }
      
      if (currentSection === 'withdrawal' && row[1] === 'YES') {
        banks.push({
          bank: row[3], // JENIS BANK
          account_name: row[4]?.replace(/\n/g, '').trim(), // NAMA BANK
          account_number: row[5]?.toString().trim(), // NO REK
          status: row[27] === 'AKTIF', // STATUS BANK
          display: false,
          used: true,
          type: 'withdrawal',
          source: 'google_sheets',
          last_sync_at: new Date()
        });
      }
    }

    // 4. Koneksi ke Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 5. Ambil semua data bank yang ada di database
    const { data: existingBanks } = await supabase
      .from('bank_accounts')
      .select('*');

    // 6. Logic sync pintar
    const results = {
      new: [],
      updated: [],
      unchanged: [],
      manual_only: []
    };

    for (const sheetBank of banks) {
      // Cari apakah bank ini udah ada di database
      const existing = existingBanks?.find(
        b => b.bank === sheetBank.bank && 
             b.account_number === sheetBank.account_number
      );

      if (!existing) {
        // BANK BARU! Tambahin
        const { data } = await supabase
          .from('bank_accounts')
          .insert(sheetBank)
          .select();
        results.new.push(data[0]);
        
      } else {
        // Bank udah ada, cek apakah ada perubahan
        const hasChanges = 
          existing.account_name !== sheetBank.account_name ||
          existing.status !== sheetBank.status ||
          existing.display !== sheetBank.display ||
          existing.used !== sheetBank.used;

        if (hasChanges) {
          // Update data
          const { data } = await supabase
            .from('bank_accounts')
            .update({
              ...sheetBank,
              updated_at: new Date()
            })
            .eq('id', existing.id)
            .select();
          results.updated.push(data[0]);
        } else {
          results.unchanged.push(existing);
        }
      }
    }

    // 7. Tandai bank yang cuma ada di database (manual input)
    const sheetKeys = banks.map(b => `${b.bank}-${b.account_number}`);
    results.manual_only = existingBanks?.filter(b => 
      !sheetKeys.includes(`${b.bank}-${b.account_number}`) &&
      b.source === 'manual'
    ) || [];

    return NextResponse.json({
      success: true,
      summary: {
        total_from_sheet: banks.length,
        new_banks: results.new.length,
        updated_banks: results.updated.length,
        unchanged_banks: results.unchanged.length,
        manual_banks: results.manual_only.length
      },
      details: results
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}