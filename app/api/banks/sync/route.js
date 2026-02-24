import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV sebagai text mentah
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
      
      // Deteksi section
      if (line.includes('DEPOSIT')) {
        currentSection = 'deposit';
        i += 2; // Skip header
        continue;
      }
      if (line.includes('WITHDRAW')) {
        currentSection = 'withdrawal';
        i += 2; // Skip header
        continue;
      }
      
      // Skip kalo belum masuk section
      if (!currentSection) continue;
      
      // Split CSV manual (handle kutip)
      const columns = [];
      let current = '';
      let inQuote = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          columns.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current); // Push kolom terakhir
      
      // Bersihin data
      const cleanCols = columns.map(c => 
        c.replace(/"/g, '').trim()
      );
      
      // Cek kolom B (index 1) harus YES
      if (cleanCols[1] !== 'YES') continue;
      
      // Ambil data penting
      const bank = cleanCols[3] || '';
      const accountName = cleanCols[4] || '';
      const accountNumber = cleanCols[5] || '';
      
      // Cek status (cari AKTIF di seluruh kolom)
      const isActive = cleanCols.some(col => col === 'AKTIF');
      
      // Validasi
      if (!bank || !accountNumber) continue;
      
      // Buat object bank
      const bankData = {
        bank,
        account_name: accountName,
        account_number: accountNumber,
        status: isActive,
        source: 'google_sheets',
        last_sync_at: new Date(),
        display: currentSection === 'deposit',
        used: currentSection === 'withdrawal',
        type: currentSection
      };
      
      banks.push(bankData);
    }

    // 3. Koneksi Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Hapus semua data lama dari sheets
    await supabase
      .from('bank_accounts')
      .delete()
      .eq('source', 'google_sheets');

    // 5. Insert data baru
    const { data, error } = await supabase
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
      banks: banks.map(b => `${b.bank} (${b.type})`),
      detail: banks
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