import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1435714791&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // 2. Split per baris
    const lines = csvText.split('\n');
    
    let banks = [];
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Deteksi section DEPOSIT
      if (line.includes('DEPOSIT')) {
        currentSection = 'deposit';
        i += 2; // Skip header
        continue;
      }
      
      // Deteksi section WITHDRAW
      if (line.includes('WITHDRAW')) {
        currentSection = 'withdrawal';
        i += 2; // Skip header
        continue;
      }
      
      // Skip kalo belum masuk section
      if (!currentSection) continue;
      
      // Ambil data dengan split sederhana
      const columns = line.split(',');
      
      // Kolom B harus YES
      if (columns[1] !== 'YES') continue;
      
      const bank = columns[3]?.replace(/"/g, '') || '';
      const accountName = columns[4]?.replace(/"/g, '').replace(/\n/g, '') || '';
      const accountNumber = columns[5]?.replace(/"/g, '') || '';
      
      if (!bank || !accountNumber) continue;
      
      banks.push({
        bank,
        account_name: accountName,
        account_number: accountNumber,
        status: true,
        display: currentSection === 'deposit',
        used: currentSection === 'withdrawal',
        type: currentSection, // <-- INI PENTING!
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

    // 4. Hapus data lama
    await supabase.from('bank_accounts').delete().eq('source', 'google_sheets');

    // 5. Insert data baru
    const { error } = await supabase.from('bank_accounts').insert(banks);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${banks.length} bank`,
      deposit: banks.filter(b => b.type === 'deposit').length,
      withdrawal: banks.filter(b => b.type === 'withdrawal').length
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