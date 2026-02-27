import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('🚀 SYNC API STARTED');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1689175827&single=true&output=csv';
    
    console.log('📡 Fetching CSV...');
    const response = await fetch(csvUrl, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Gagal fetch CSV`);
    }
    
    const csvText = await response.text();
    console.log(`📄 CSV length: ${csvText.length} characters`);
    
    const lines = csvText.split('\n');
    console.log(`📊 Total baris: ${lines.length}`);
    
    const banks = [];
    const credentials = [];
    let validRows = 0;
    let skippedRows = 0;
    
    for (let i = 2; i < lines.length; i++) {
      if (!lines[i]?.trim()) {
        skippedRows++;
        continue;
      }
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 10) {
        skippedRows++;
        continue;
      }
      
      const accountNumber = values[5]?.replace(/\s/g, '');
      const bankName = values[3]?.toUpperCase();
      const isNexusPay = bankName?.includes('NEXUS') || bankName?.includes('NEXUSPAY');
      
      // VALIDASI: KALO BUKAN NEXUSPAY, HARUS ADA NOMOR REKENING VALID
      if (!isNexusPay) {
        if (!accountNumber || !/^\d+$/.test(accountNumber)) {
          console.log(`⏭️ Skip baris ${i}: nomor rekening tidak valid - ${accountNumber}`);
          skippedRows++;
          continue;
        }
      }
      
      validRows++;
      
      banks.push({
        asset: values[0] || 'LUCK77',
        status: values[1]?.toUpperCase() || 'AKTIF',
        display_used: values[2]?.toUpperCase() || '',
        bank: values[3] || '',
        account_name: values[4] || '',
        account_number: isNexusPay ? '-' : accountNumber, // NEXUSPAY PAKE '-'
        role: values[6]?.toUpperCase() || 'BOTH',
        type_bank: values[7] || '',
        masa_aktif: values[8] || null,
        last_sync_at: new Date().toISOString()
      });
      
      credentials.push({
        account_number: isNexusPay ? '-' : accountNumber,
        user_id_1: values[11] || null,
        pin_1: values[12] || null,
        user_id_2: values[13] || null,
        pass_1: values[14] || null,
        pin_2: values[15] || null,
        user_id_3: values[16] || null,
        pass_2: values[17] || null,
        pin_3: values[18] || null,
        pass_transaksi: values[19] || null,
        agent: values[20] || null,
        pin_token: values[21] || null,
        hp: values[22] || null,
        email: values[23] || null,
        created_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data valid: ${validRows} bank, ${skippedRows} skipped`);
    
    if (banks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tidak ada data valid untuk disimpan' 
      }, { status: 400 });
    }
    
    // HAPUS DATA LAMA (URUTAN PENTING!)
    console.log('🗑️ Menghapus data credentials...');
    await supabase.from('bank_credentials').delete().neq('id', 0);
    
    console.log('🗑️ Menghapus data bank_accounts...');
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
    console.log(`💾 Inserting ${banks.length} banks...`);
    const { error: bankError } = await supabase
      .from('bank_accounts')
      .insert(banks);
      
    if (bankError) {
      console.error('❌ Gagal insert banks:', bankError);
      throw bankError;
    }
    
    if (credentials.length > 0) {
      console.log(`💾 Inserting ${credentials.length} credentials...`);
      const { error: credError } = await supabase
        .from('bank_credentials')
        .insert(credentials);
        
      if (credError) {
        console.error('❌ Gagal insert credentials:', credError);
        // JANGAN THROW, TETAP ANGGAP BERHASIL UNTUK BANK
      }
    }
    
    console.log('✅ SYNC BERHASIL');
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync ${banks.length} bank berhasil`,
      stats: {
        banks: banks.length,
        credentials: credentials.length,
        skipped: skippedRows
      }
    });
    
  } catch (error) {
    console.error('❌ SYNC ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}