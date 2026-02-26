import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    
    // HAPUS SEMUA DATA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    const banks = [];
    
    // MULAI DARI BARIS 2 (index 2) SAMPAI BARIS 8 (index 8)
    for (let i = 2; i <= 8; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // CEK DI CONSOLE
      console.log(`\n=== BARIS ${i} ===`);
      console.log(`BANK: ${values[0]}`);
      console.log(`NAMA: ${values[1]}`);
      console.log(`NO REK: ${values[2]}`);
      console.log(`STATUS: ${values[24]}`);
      
      // VALIDASI SEDERHANA - NOMOR REKENING HARUS ANGKA
      const accountNumber = values[2]?.replace(/\s/g, '');
      if (!accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`⛔ SKIP: nomor rekening tidak valid`);
        continue;
      }
      
      banks.push({
        bank: values[0] || '',
        account_name: values[1] || '',
        account_number: accountNumber,
        type: values[19]?.toLowerCase().includes('deposit') ? 'deposit' : 'withdrawal',
        type_bank: values[23] || '',
        display: false,
        used: false,
        masa_aktif: values[21] || null,
        status: values[24]?.toUpperCase() === 'AKTIF',
        last_sync_at: new Date().toISOString()
      });
    }
    
    console.log(`\n✅ TOTAL BANK: ${banks.length}`);
    
    if (banks.length > 0) {
      const { error } = await supabase.from('bank_accounts').insert(banks);
      if (error) throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync: ${banks.length} bank`
    });
    
  } catch (error) {
    console.error('❌ ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}