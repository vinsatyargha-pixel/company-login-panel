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
      if (!row || row.length === 0) continue;

      // Deteksi section DEPOSIT
      if (row[0]?.includes('DEPOSIT')) {
        currentSection = 'deposit';
        i += 2; // Skip header
        continue;
      }

      // Deteksi section WITHDRAW
      if (row[0]?.includes('WITHDRAW')) {
        currentSection = 'withdrawal';
        i += 2; // Skip header
        continue;
      }

      // Skip baris kosong
      if (!row[3] || row[3].trim() === '') continue;

      // Validasi: kolom B harus YES
      if (row[1]?.trim() !== 'YES') continue;

      // Bersihin newline
      const cleanRow = row.map(cell => cell?.replace(/\n/g, '').trim() || '');

      // Cek status AKTIF
      const isActive = cleanRow[26] === 'AKTIF' || cleanRow[27] === 'AKTIF' || cleanRow[28] === 'AKTIF';

      const bankData = {
        bank: cleanRow[3],
        account_name: cleanRow[4],
        account_number: cleanRow[5],
        status: isActive,
        source: 'google_sheets',
        last_sync_at: new Date()
      };

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

    // 4. Koneksi Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 5. Hapus data sheets lama
    await supabase
      .from('bank_accounts')
      .delete()
      .eq('source', 'google_sheets');

    // 6. Insert data baru
    const { error } = await supabase
      .from('bank_accounts')
      .insert(banks.map(b => ({
        ...b,
        first_seen_at: new Date(),
        updated_at: new Date()
      })));

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${banks.length} bank diproses`,
      banks: banks.map(b => b.bank)
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