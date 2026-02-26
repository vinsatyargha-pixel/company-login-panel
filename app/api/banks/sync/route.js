import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('========== SYNC BANK ACCOUNTS ==========');
  
  try {
    // 1. INIT SUPABASE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');

    // 2. AMBIL CSV DARI GOOGLE SHEETS
    const SPREADSHEET_ID = '2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw';
    const GID = '1484150508';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    
    console.log('📡 Fetching CSV...');
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Gagal ambil CSV: HTTP ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log(`✅ CSV fetched: ${csvText.length} bytes`);

    // 3. PARSE CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log(`📊 Total baris: ${lines.length}`);

    if (lines.length < 2) {
      throw new Error('CSV tidak memiliki data');
    }

    // 4. MAPPING HEADER (SESUAIKAN DENGAN SPREADSHEET KAMU!)
    const headers = lines[0].split(',').map(h => h.trim());
    console.log('📋 Headers:', headers);

    // 5. KONVERSI KE ARRAY OF OBJECTS
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // SKIP BARIS KOSONG
      if (values.length < 3 || !values[0]) continue;

      // 🔴 SESUAIKAN URUTAN KOLOM DENGAN SPREADSHEET ASLI!
      const bank = {
        bank: values[0] || '',                    // Kolom A: Nama Bank
        account_name: values[1] || '',             // Kolom B: Nama Pemilik
        account_number: values[2] || '',           // Kolom C: No Rekening
        type: (values[3] || 'both').toLowerCase(), // Kolom D: deposit/withdrawal/both
        type_bank: values[4] || '',                 // Kolom E: personal/bisnis
        display: values[5]?.toLowerCase() === 'yes' ? true : false,  // Kolom F: YES/NO
        used: values[6]?.toLowerCase() === 'yes' ? true : false,      // Kolom G: YES/NO
        masa_aktif: values[7] || null,               // Kolom H: Masa Aktif
        login_info: values[8] ? values[8] : null,     // Kolom I: JSON atau teks biasa
        status: true,                                 // Default active
        last_sync_at: new Date().toISOString()
      };

      // VALIDASI MINIMAL
      if (bank.bank && bank.account_number) {
        banks.push(bank);
      }
    }

    console.log(`✅ Siap insert: ${banks.length} bank`);
    console.log('📝 Sample data:', banks[0]); // Tampilkan sample pertama

    // 6. HAPUS DATA LAMA (OPTIONAL)
    console.log('🗑️ Menghapus data lama...');
    const { error: deleteError } = await supabase
      .from('bank_accounts')
      .delete()
      .neq('id', 0);

    if (deleteError) {
      console.warn('⚠️ Gagal hapus data lama:', deleteError);
    }

    // 7. INSERT DATA BARU
    console.log('💾 Menyimpan data baru...');
    
    let successCount = 0;
    const batchSize = 50;
    
    for (let i = 0; i < banks.length; i += batchSize) {
      const batch = banks.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('bank_accounts')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Gagal insert batch ${i}:`, insertError);
      } else {
        successCount += batch.length;
        console.log(`✅ Batch ${i} berhasil: ${batch.length} data`);
      }
    }

    console.log(`🎉 Total tersimpan: ${successCount} bank`);

    // 8. HITUNG STATISTIK
    const stats = {
      total: successCount,
      active: banks.filter(b => b.status).length,
      deposit: banks.filter(b => b.type === 'deposit' || b.type === 'both').length,
      withdrawal: banks.filter(b => b.type === 'withdrawal' || b.type === 'both').length
    };

    // 9. RETURN RESPON
    return NextResponse.json({ 
      success: true, 
      message: `Sync berhasil! ${successCount} bank diupdate`,
      ...stats
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}