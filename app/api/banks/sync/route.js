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
    
    // 3. PARSE CSV
    const lines = csvText.split('\n');
    
    // 4. AMBIL DATA DARI BARIS 2 SAMPAI 8
    const banks = [];
    
    for (let i = 2; i <= 8; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // MAPPING PALING GAMPANG
      const bankName = values[0];        // BNI, BRI, BCA, MANDIRI
      const accountName = values[1];      // NAMA LENGKAP
      const accountNumber = values[2];    // NO REK
      const divisi = values[19];          // DEPOSIT/WITHDRAW
      const masaAktif = values[21];        // TANGGAL
      const typeBank = values[23];         // MOBILE/SOFTOKEN
      const statusBank = values[24];       // AKTIF/TAKEDOWN
      
      console.log(`🔍 ${bankName} - ${accountName} - ${accountNumber} - ${statusBank}`);
      
      // VALIDASI NOMOR REKENING (HARUS ANGKA)
      if (!accountNumber || !/^\d+$/.test(accountNumber.replace(/\s/g, ''))) {
        console.log(`⛔ Skip: nomor rekening tidak valid`);
        continue;
      }
      
      // TENTUKAN TYPE
      let type = 'both';
      if (divisi?.toUpperCase().includes('DEPOSIT')) type = 'deposit';
      else if (divisi?.toUpperCase().includes('WITHDRAW')) type = 'withdrawal';
      
      banks.push({
        bank: bankName || '',
        account_name: accountName || '',
        account_number: accountNumber.replace(/\s/g, ''),
        type: type,
        type_bank: typeBank || '',
        display: false,
        used: false,
        masa_aktif: masaAktif || null,
        status: statusBank?.toUpperCase() === 'AKTIF',
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
    
    // 5. HAPUS TEST BANK
    await supabase
      .from('bank_accounts')
      .delete()
      .eq('bank', 'TEST BANK');
    
    // 6. INSERT DATA ASLI
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