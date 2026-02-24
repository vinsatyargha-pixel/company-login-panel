import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1435714791&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // 2. Split per baris dan filter
    const lines = csvText.split('\n').filter(line => line.includes('YES'));
    
    const banks = [];
    
    for (const line of lines) {
      // Skip header
      if (line.includes('DISPLAY') || line.includes('USED')) continue;
      
      // Split sederhana
      const parts = line.split(',');
      
      // Cari yang ada BCA, BNI, BRI, MANDIRI
      const bankName = parts[3]?.replace(/"/g, '') || '';
      if (!['BCA', 'BNI', 'BRI', 'MANDIRI'].includes(bankName)) continue;
      
      const accountName = parts[4]?.replace(/"/g, '').replace(/\n/g, '') || '';
      const accountNumber = parts[5]?.replace(/"/g, '') || '';
      
      // Tentukan tipe dari baris (apakah ada kata DEPOSIT atau WITHDRAW di atasnya)
      const isDeposit = csvText.substring(0, csvText.indexOf(line)).includes('DEPOSIT');
      
      banks.push({
        bank: bankName,
        account_name: accountName,
        account_number: accountNumber,
        status: true, // Paksa true dulu
        display: isDeposit,
        used: !isDeposit,
        type: isDeposit ? 'deposit' : 'withdrawal',
        source: 'google_sheets',
        last_sync_at: new Date(),
        first_seen_at: new Date(),
        updated_at: new Date()
      });
    }

    // 3. Koneksi Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Hapus dan insert ulang
    await supabase.from('bank_accounts').delete().eq('source', 'google_sheets');
    
    const { error } = await supabase.from('bank_accounts').insert(banks);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${banks.length} bank`,
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
  return NextResponse.json({ message: 'Gunakan POST method' });
}