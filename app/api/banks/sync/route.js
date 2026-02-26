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
    
    const lines = csvText.split('\n').filter(line => line.trim());
    
    const banks = [];
    const credentials = [];
    
    // MULAI DARI BARIS 3 (index 2)
    for (let i = 2; i < lines.length; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 9) continue;
      
      const accountNumber = values[5]?.replace(/\s/g, '');
      if (!accountNumber || !/^\d+$/.test(accountNumber)) continue;
      
      // DATA BANK (TABLE 1)
      banks.push({
        asset: values[0],
        status: values[1],
        display_used: values[2],
        bank: values[3],
        account_name: values[4],
        account_number: accountNumber,
        role: values[6],
        type_bank: values[7],
        masa_aktif: values[8],
        last_sync_at: new Date().toISOString()
      });
      
      // CREDENTIALS (TABLE 2) - SESUAIKAN INDEX DENGAN SHEET LO
      credentials.push({
        account_number: accountNumber,
        user_id_1: values[9] || null,    // USER ID (IBANK)
        pin_1: values[10] || null,        // PIN (IBANK)
        user_id_2: values[11] || null,    // USER ID (MYBCA)
        pass_1: values[12] || null,       // PASS (MYBCA)
        pin_2: values[13] || null,        // PIN (MYBCA)
        user_id_3: values[14] || null,    // USER ID (MBANK)
        pass_2: values[15] || null,       // PASS (MBANK)
        pin_3: values[16] || null,        // PIN (MBANK)
        pass_transaksi: values[17] || null, // PASS TRANSAKSI
        agent: values[18] || null,        // AGENT
        pin_token: values[19] || null,    // PIN TOKEN
        hp: values[20] || null,           // HP
        email: values[21] || null         // EMAIL
      });
    }
    
    // HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    await supabase.from('bank_credentials').delete().neq('id', 0);
    
    // INSERT DATA BARU
    if (banks.length > 0) {
      const { error: bankError } = await supabase.from('bank_accounts').insert(banks);
      if (bankError) throw bankError;
    }
    
    if (credentials.length > 0) {
      const { error: credError } = await supabase.from('bank_credentials').insert(credentials);
      if (credError) throw credError;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync ${banks.length} bank & ${credentials.length} credentials`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}