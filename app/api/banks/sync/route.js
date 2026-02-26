import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1689175827&single=true&output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim() && !line.startsWith('Asset,Status,Display/Used'));
    console.log('Total baris:', lines.length);
    
    const banks = [];
    
    // MULAI DARI BARIS 2 (INDEX 1) KARENA HEADER UDAH DI-FILTER
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 5) continue;
      
      const accountNumber = values[4]?.replace(/\s/g, ''); // Account Number di index 4
      if (!accountNumber || !/^\d+$/.test(accountNumber)) continue;
      
      banks.push({
        asset: values[0] || 'LUCK77',
        status: values[1]?.toUpperCase() || 'AKTIF',
        display_used: values[2]?.toUpperCase() || '',
        bank: values[3] || '',
        account_name: values[4] || '',
        account_number: accountNumber,
        role: values[5]?.toUpperCase() || 'BOTH',
        type_bank: values[6] || '',
        masa_aktif: values[7] || null,
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
    
    // HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
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