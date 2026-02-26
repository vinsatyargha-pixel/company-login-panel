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
    
    const lines = csvText.split('\n');
    console.log(`📊 Total baris: ${lines.length}`);
    
    const banks = [];
    
    // MULAI DARI BARIS 2 SAMPAI 8 (data bank)
    for (let i = 2; i <= 8; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const bankName = values[0]?.toUpperCase();      // Kolom A: BANK
      const accountName = values[1];                   // Kolom B: NAMA
      const accountNumber = values[2]?.replace(/\s/g, ''); // Kolom C: NO REK
      const divisi = values[19]?.toUpperCase();        // Kolom T: DEPOSIT/WITHDRAW
      const masaAktif = values[21];                     // Kolom V: MASA AKTIF
      const typeBank = values[23];                      // Kolom X: MOBILE/SOFTOKEN
      const statusKolom = values[24]?.toUpperCase();    // Kolom Y: STATUS BANK
      
      console.log(`🔍 Baris ${i}: ${bankName} - ${accountName} - No: ${accountNumber} - Status: ${statusKolom}`);
      
      // VALIDASI
      if (!bankName || !accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`   ⛔ Skip: data tidak valid`);
        continue;
      }
      
      // TENTUKAN TYPE
      let type = 'both';
      if (divisi?.includes('DEPOSIT')) type = 'deposit';
      else if (divisi?.includes('WITHDRAW')) type = 'withdrawal';
      
      // TENTUKAN STATUS (AKTIF = true, TAKEDOWN = false)
      const isActive = statusKolom === 'AKTIF';
      
      banks.push({
        bank: bankName,
        account_name: accountName || '',
        account_number: accountNumber,
        type: type,
        type_bank: typeBank || '',
        display: false,
        used: false,
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
    const { error } = await supabase.from('bank_accounts').insert(banks);
    
    if (error) {
      console.error('❌ Insert error:', error);
      throw error;
    }
    
    console.log(`✅ Inserted: ${banks.length} banks`);
    
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