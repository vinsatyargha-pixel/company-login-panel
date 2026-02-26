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
    
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const banks = [];
    
    // MULAI DARI BARIS 3 (INDEX 2) - 7 BANK
    for (let i = 2; i < 9; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const accountNumber = values[5]?.replace(/\s/g, '');
      if (!accountNumber || !/^\d+$/.test(accountNumber)) continue;
      
      // KOLOM C (index 2) = Display/Used (YES/NO/TAKEDOWN)
      const displayUsed = values[2]?.toUpperCase() || '';
      
      // KOLOM F (index 6) = Role (DEPOSIT/WITHDRAW)
      const role = values[6]?.toUpperCase() || 'BOTH';
      
      console.log(`🔍 ${values[3]} - ${values[4]} - Display/Used: ${displayUsed} - Role: ${role}`);
      
      banks.push({
        asset: values[0] || 'LUCK77',
        status: values[1]?.toUpperCase() || 'AKTIF',
        display_used: displayUsed,  // LANGSUNG DARI KOLOM C
        bank: values[3] || '',
        account_name: values[4] || '',
        account_number: accountNumber,
        role: role,
        type_bank: values[7] || '',
        masa_aktif: values[8] || null,
        last_sync_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    
    // HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
    if (banks.length > 0) {
      const { error } = await supabase.from('bank_accounts').insert(banks);
      if (error) throw error;
    }
    
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