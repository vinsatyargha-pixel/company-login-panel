import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🚀 START SYNC');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log(`📊 Total baris: ${lines.length}`);
    
    const banks = [];
    
    // SKIP HEADER (baris 1), PROSES BARIS 2-8
    for (let i = 1; i <= 8; i++) {
      if (i >= lines.length) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 4) continue;
      
      // MAPPING ULANG BERDASARKAN STRUKTUR ASLI
      const accountNumber = values[0]?.replace(/\s/g, ''); // Kolom A: NO REK
      const bankName = values[1]?.toUpperCase(); // Kolom B: PIN/NAGA/BNI/dll
      const accountName = values[2]; // Kolom C: USERID/NAMA
      const role = values[3]?.toLowerCase(); // Kolom D: BOTH/DEPOSIT/WITHDRAWAL
      const typeBank = values[4]; // Kolom E: MOBILE/SOFTOKEN
      const masaAktif = values[5]; // Kolom F: MASA AKTIF
      
      console.log(`🔍 Baris ${i}: Rek: ${accountNumber}, Bank: ${bankName}, Nama: ${accountName}`);
      
      // VALIDASI: nomor rekening harus angka dan minimal 5 digit
      if (!accountNumber || !/^\d+$/.test(accountNumber) || accountNumber.length < 5) {
        console.log(`   ⛔ Skip: nomor rekening tidak valid`);
        continue;
      }
      
      // TENTUKAN TYPE
      let type = 'both';
      if (role?.includes('deposit')) type = 'deposit';
      else if (role?.includes('withdrawal')) type = 'withdrawal';
      
      // STATUS (default true / ACTIVE)
      // KALAU ADA KOLOM STATUS, TAMBAHKAN DI SINI
      const isActive = true; // SEMUA ACTIVE DULU
      
      banks.push({
        bank: bankName || '',
        account_name: accountName || '',
        account_number: accountNumber,
        type: type,
        type_bank: typeBank || '',
        display: false, // DEFAULT
        used: false,    // DEFAULT
        masa_aktif: masaAktif || null,
        status: isActive,
        last_sync_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    
    if (banks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tidak ada data valid'
      }, { status: 400 });
    }
    
    // HAPUS DATA LAMA
    console.log('🗑️ Menghapus data lama...');
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
    console.log('💾 Inserting banks...');
    const { data, error } = await supabase.from('bank_accounts').insert(banks).select();
    
    if (error) throw error;
    
    console.log(`✅ Inserted: ${data?.length || 0} banks`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync berhasil! ${banks.length} bank diupdate`
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}