import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. KONEKSI SUPABASE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 2. FETCH CSV
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // 3. PARSE CSV - JANGAN FILTER DULU
    const lines = csvText.split('\n');
    console.log(`Total baris: ${lines.length}`);
    
    // 4. MULAI DARI BARIS 3 (index 2) SAMPAI 8
    const banks = [];
    
    for (let i = 2; i <= 8; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // MAPPING YANG BENAR!
      const bankName = values[0]?.toUpperCase();      // Kolom A: BANK
      const accountName = values[1];                   // Kolom B: NAMA
      const accountNumber = values[2]?.replace(/\s/g, ''); // Kolom C: NO REK
      const role = values[19]?.toLowerCase();          // Kolom T: DEPOSIT/WITHDRAW
      const typeBank = values[23];                      // Kolom X: MOBILE/SOFTOKEN
      const masaAktif = values[21];                     // Kolom V: MASA AKTIF
      const statusKolom = values[24]?.toUpperCase();    // Kolom Y: STATUS BANK
      
      console.log(`Baris ${i}: ${bankName} - ${accountName} - ${accountNumber} - Status: ${statusKolom}`);
      
      // VALIDASI
      if (!bankName || !accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`   ⛔ Skip: data tidak valid`);
        continue;
      }
      
      // TENTUKAN TYPE
      let type = 'both';
      if (role?.includes('deposit')) type = 'deposit';
      else if (role?.includes('withdrawal')) type = 'withdrawal';
      
      // TENTUKAN STATUS
      const isActive = statusKolom !== 'TAKEDOWN';
      
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
    
    // 5. HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // 6. INSERT DATA BARU
    const { error } = await supabase
      .from('bank_accounts')
      .insert(banks);
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync berhasil! ${banks.length} bank diupdate`
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}