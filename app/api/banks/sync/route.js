import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV dari sheet DATABASE bank (bukan DATA BANK ACTIVE)
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1484150508&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // 2. Split per baris dan ambil kolom AD (index 29)
    const lines = csvText.split('\n');
    
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header baris 0
      const columns = lines[i].split(',');
      
      // Ambil kolom AD (index 29)
      const rawData = columns[29]?.replace(/"/g, '').trim();
      if (!rawData) continue;
      
      // Format: "Jenis Bank - Nama Bank - No Rek"
      // Contoh: "BCA - AHMAD GHOZALI - 7600565065"
      const parts = rawData.split('-').map(p => p.trim());
      
      if (parts.length >= 2) {
        const bank = parts[0]; // BCA, BNI, BRI, MANDIRI
        const accountName = parts[1] || '';
        const accountNumber = parts[2] || '';
        
        // Tentukan tipe dari kolom lain? Atau pake logika sederhana
        // Karena di sheet ini mungkin gak ada info deposit/withdrawal,
        // kita bisa masukin semua sebagai deposit dulu, nanti diatur manual
        
        banks.push({
          bank,
          account_name: accountName,
          account_number: accountNumber,
          status: true, // Asumsikan aktif
          display: true, // Tampil di deposit
          used: false,   // Tidak untuk withdrawal
          type: 'deposit',
          source: 'google_sheets',
          last_sync_at: new Date(),
          first_seen_at: new Date(),
          updated_at: new Date()
        });
      }
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
      .insert(banks);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${banks.length} bank dari sheet DATABASE`,
      banks: banks.map(b => `${b.bank} - ${b.account_name}`)
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