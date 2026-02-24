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
      let line = lines[i].trim();
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
      
      // HANDLE KHUSUS: BCA punya enter di tengah
      // Gabungin baris berikutnya kalo baris ini diawali kutip dan gak diakhiri kutip
      if (line.startsWith('"') && !line.endsWith('"')) {
        // Ini baris yang terpotong, gabung dengan baris berikutnya
        line = line + lines[i + 1].trim();
        i++; // Skip baris berikutnya
      }
      
      // Split CSV sederhana (koma)
      const columns = line.split(',').map(col => 
        col.replace(/^"|"$/g, '').trim() // Hapus kutip di awal/akhir
      );
      
      // Cek kolom B (index 1) harus YES
      if (columns[1] !== 'YES') continue;
      
      // Ambil data
      const bank = columns[3] || '';
      const accountName = columns[4] || '';
      const accountNumber = columns[5] || '';
      
      // Cek status AKTIF di kolom manapun
      const isActive = columns.some(col => col === 'AKTIF');
      
      if (!bank || !accountNumber) continue;
      
      banks.push({
        bank,
        account_name: accountName,
        account_number: accountNumber,
        status: isActive,
        source: 'google_sheets',
        last_sync_at: new Date(),
        display: currentSection === 'deposit',
        used: currentSection === 'withdrawal',
        type: currentSection
      });
    }

    // 3. Koneksi Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. Hapus data sheets lama
    await supabase
      .from('bank_accounts')
      .delete()
      .eq('source', 'google_sheets');

    // 5. Insert data baru
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
      banks: banks.map(b => b.bank),
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