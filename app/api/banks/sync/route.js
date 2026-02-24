import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

export async function POST() {
  try {
    // 1. Fetch CSV dari Google Sheets
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1435714791&single=true&output=csv';
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Gagal fetch CSV: ${response.status}`);
    }
    
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
      if (!row || row.length === 0) continue;

      // Deteksi section DEPOSIT
      if (row[0]?.includes('DEPOSIT')) {
        currentSection = 'deposit';
        i += 2; // Skip 2 baris header
        continue;
      }

      // Deteksi section WITHDRAW
      if (row[0]?.includes('WITHDRAW')) {
        currentSection = 'withdrawal';
        i += 2; // Skip 2 baris header
        continue;
      }

      // Skip baris kosong
      if (!row[3] || row[3].trim() === '') continue;

      // Bersihin semua newline dari setiap cell
      const cleanRow = row.map(cell => cell?.replace(/\n/g, '').trim() || '');

      // Cek apakah ini data yang valid (kolom B = YES)
      const isValid = cleanRow[1] === 'YES';
      if (!isValid) continue;

      // Cari status AKTIF (bisa di index 26, 27, atau 28)
      const isActive = cleanRow[26] === 'AKTIF' || cleanRow[27] === 'AKTIF' || cleanRow[28] === 'AKTIF';

      // Buat object bank
      const bankData = {
        bank: cleanRow[3], // JENIS BANK
        account_name: cleanRow[4], // NAMA BANK (udah bersih)
        account_number: cleanRow[5], // NO REK
        status: isActive,
        source: 'google_sheets',
        last_sync_at: new Date()
      };

      // Tambahin type dan flag sesuai section
      if (currentSection === 'deposit') {
        banks.push({
          ...bankData,
          display: true,
          used: false,
          type: 'deposit'
        });
      } else if (currentSection === 'withdrawal') {
        banks.push({
          ...bankData,
          display: false,
          used: true,
          type: 'withdrawal'
        });
      }
    }

    // 4. Koneksi ke Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 5. Ambil data existing
    const { data: existingBanks } = await supabase
      .from('bank_accounts')
      .select('*');

    // 6. Logic sync
    const results = { new: [], updated: [], unchanged: [], manual_only: [] };

    for (const sheetBank of banks) {
      const existing = existingBanks?.find(
        b => b.bank === sheetBank.bank && 
             b.account_number === sheetBank.account_number
      );

      if (!existing) {
        const { data } = await supabase
          .from('bank_accounts')
          .insert([{ ...sheetBank, first_seen_at: new Date() }])
          .select();
        if (data) results.new.push(data[0]);
      } else {
        const hasChanges = 
          existing.account_name !== sheetBank.account_name ||
          existing.status !== sheetBank.status ||
          existing.display !== sheetBank.display ||
          existing.used !== sheetBank.used;

        if (hasChanges) {
          const { data } = await supabase
            .from('bank_accounts')
            .update({
              ...sheetBank,
              updated_at: new Date()
            })
            .eq('id', existing.id)
            .select();
          if (data) results.updated.push(data[0]);
        } else {
          await supabase
            .from('bank_accounts')
            .update({ last_sync_at: new Date() })
            .eq('id', existing.id);
          results.unchanged.push(existing);
        }
      }
    }

    // 7. Tandai manual only
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
      banks: banks // buat debug
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gunakan POST method untuk sync' });
}