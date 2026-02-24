import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV dari sheet DATABASE bank
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1484150508&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // 2. Split per baris
    const lines = csvText.split('\n');
    
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header (baris 0)
      const columns = lines[i].split(',');
      
      // Ambil kolom AD (index 29) - ini hasil TEXT JOIN
      const rawData = columns[29]?.replace(/"/g, '').trim();
      if (!rawData) continue;
      
      // Format selalu: "JENIS BANK - NAMA - NO REK"
      // Contoh: "BCA - AHMAD GHOZALI - 7600565065"
      
      // Split berdasarkan " - " (spasi-strip-spasi)
      const parts = rawData.split(' - ').map(p => p.trim());
      
      if (parts.length >= 2) {
        const bank = parts[0]; // BCA, BNI, dll
        const accountName = parts[1] || '';
        const accountNumber = parts[2] || '';
        
        // Tentukan tipe berdasarkan nama (bisa diatur manual nanti)
        // Asumsi: Yang punya nomor rekening > 10 digit adalah deposit?
        // Tapi lebih baik masukin semua dulu, nanti diatur di dashboard
        
        banks.push({
          bank,
          account_name: accountName,
          account_number: accountNumber,
          status: true,
          display: true,  // Default tampil di deposit
          used: false,     // Default tidak di withdrawal
          type: 'deposit', // Default deposit
          source: 'google_sheets',
          last_sync_at: new Date(),
          first_seen_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // 3. Hapus duplikat berdasarkan bank + norek (kalau ada)
    const uniqueBanks = [];
    const seen = new Set();
    
    for (const bank of banks) {
      const key = `${bank.bank}-${bank.account_number}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBanks.push(bank);
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

    // 6. Insert data unik
    const { error } = await supabase
      .from('bank_accounts')
      .insert(uniqueBanks);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${uniqueBanks.length} bank dari kolom AD`,
      banks: uniqueBanks.map(b => `${b.bank} - ${b.account_name} - ${b.account_number}`)
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}