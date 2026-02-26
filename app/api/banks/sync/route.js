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
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // 4. DAFTAR BANK YANG VALID
    const VALID_BANKS = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'DANA', 'OVO', 'GOPAY', 'LINKAJA', 'SHOPEEPAY'];
    
    const banks = [];
    
    // Mulai dari baris ke-2 (skip header)
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // CEK APAKAH INI DATA BANK VALID
      const bankName = values[0]?.toUpperCase();
      
      // SKIP KALO BUKAN BANK YANG DIKENAL
      if (!VALID_BANKS.includes(bankName)) {
        console.log('⏭️ Skip:', bankName, '- bukan data bank');
        continue;
      }
      
      // CEK APAKAH NOMOR REKENING VALID (ANGKA)
      const accountNumber = values[2]?.replace(/\s/g, '');
      if (!accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log('⏭️ Skip:', bankName, '- nomor rekening tidak valid');
        continue;
      }
      
      // CEK APAKAH NAMA PEMILIK VALID (TIDAK KOSONG)
      const accountName = values[1];
      if (!accountName || accountName.length < 3) {
        console.log('⏭️ Skip:', bankName, '- nama pemilik tidak valid');
        continue;
      }
      
      // TENTUKAN TYPE
      let type = 'both';
      if (values[3]?.toLowerCase().includes('deposit')) {
        type = 'deposit';
      } else if (values[3]?.toLowerCase().includes('withdrawal')) {
        type = 'withdrawal';
      }
      
      // BUAT OBJECT BANK
      const bank = {
        bank: values[0] || '',
        account_name: values[1] || '',
        account_number: values[2] || '',
        type: type,
        type_bank: values[4] || '',
        display: values[5]?.toLowerCase() === 'display' ? true : false,
        used: values[6]?.toLowerCase() === 'used' ? true : false,
        masa_aktif: values[7] || null,
        status: true,
        last_sync_at: new Date().toISOString()
      };
      
      banks.push(bank);
    }
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    
    // 5. HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // 6. INSERT DATA BARU
    if (banks.length > 0) {
      const { error } = await supabase
        .from('bank_accounts')
        .insert(banks);
      
      if (error) throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync berhasil! ${banks.length} bank diupdate`,
      total: banks.length,
      skipped: lines.length - 1 - banks.length
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}