import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // AMBIL CSV DARI SHEET "DATABASE TO VERCEL"
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1689175827&single=true&output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    
    const banks = [];
    
    // MULAI DARI BARIS 2 (index 1)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 5) continue;
      
      const asset = values[0] || 'LUCK77';
      const status = values[1]?.toUpperCase() || 'AKTIF';
      const displayUsed = values[2]?.toUpperCase() || '';
      const bank = values[3] || '';
      const accountName = values[4] || '';
      let accountNumber = values[5]?.replace(/\s/g, '');
      const role = values[6]?.toUpperCase() || 'BOTH';
      const typeBank = values[7] || '';
      const masaAktif = values[8] || null;
      
      if (!accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`⛔ Skip baris ${i}: nomor rekening tidak valid - ${accountNumber}`);
        continue;
      }
      
      banks.push({
        asset,
        status,
        display_used: displayUsed,
        bank,
        account_name: accountName,
        account_number: accountNumber,
        role,
        type_bank: typeBank,
        masa_aktif: masaAktif,
        last_sync_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    
    if (banks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tidak ada data valid' 
      });
    }
    
    // HAPUS DULU DATA DI bank_credentials (KARENA FOREIGN KEY)
    console.log('🗑️ Menghapus data bank_credentials...');
    await supabase.from('bank_credentials').delete().neq('id', 0);
    
    // BARU HAPUS bank_accounts
    console.log('🗑️ Menghapus data bank_accounts...');
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
    console.log('💾 Inserting banks...');
    const { error } = await supabase.from('bank_accounts').insert(banks);
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync ${banks.length} bank`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}