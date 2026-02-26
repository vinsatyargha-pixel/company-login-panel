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
    
    for (let i = 1; i <= 8; i++) {
      if (i >= lines.length) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 4) continue;
      
      const bankName = values[2]?.toUpperCase();
      const accountNumber = values[3]?.replace(/\s/g, '');
      const accountName = values[4];
      const role = values[5]?.toLowerCase();
      const typeBank = values[6];
      const masaAktif = values[10];
      const display = values[8]?.toLowerCase() === 'yes';
      const used = values[9]?.toLowerCase() === 'yes';
      const statusKolom = values[25]?.toUpperCase();
      
      console.log(`🔍 Baris ${i}: ${bankName} - ${accountName} - No: ${accountNumber}`);
      
      if (!accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`   ⛔ Skip: nomor rekening tidak valid`);
        continue;
      }
      
      let type = 'both';
      if (role?.includes('deposit')) type = 'deposit';
      else if (role?.includes('withdrawal')) type = 'withdrawal';
      
      const isActive = statusKolom !== 'TAKEDOWN';
      
      banks.push({
        bank: bankName || '',
        account_name: accountName || '',
        account_number: accountNumber,
        type: type,
        type_bank: typeBank || '',
        display: isActive ? display : false,
        used: isActive ? used : false,
        masa_aktif: masaAktif || null,
        status: isActive,
        last_sync_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    console.log('📦 Sample bank:', banks[0]);
    
    // HAPUS DATA LAMA
    console.log('🗑️ Menghapus data lama...');
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
    if (banks.length > 0) {
      console.log('💾 Inserting banks...');
      const { data, error } = await supabase.from('bank_accounts').insert(banks).select();
      
      if (error) {
        console.error('❌ Insert error:', error);
        throw error;
      }
      
      console.log(`✅ Inserted: ${data?.length || 0} banks`);
    } else {
      console.log('⚠️ Tidak ada data valid untuk diinsert');
      return NextResponse.json({ 
        success: false, 
        message: 'Tidak ada data valid'
      }, { status: 400 });
    }
    
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