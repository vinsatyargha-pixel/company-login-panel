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
    const lines = csvText.split('\n');
    
    const banks = [];
    const credentials = [];
    
    for (let i = 2; i < lines.length; i++) {
      if (!lines[i]?.trim()) continue;
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 10) continue;
      
      const accountNumber = values[5]?.replace(/\s/g, '');
      if (!accountNumber || !/^\d+$/.test(accountNumber)) continue;
      
      banks.push({
        asset: values[0] || 'LUCK77',
        status: values[1]?.toUpperCase() || 'AKTIF',
        display_used: values[2]?.toUpperCase() || '',
        bank: values[3] || '',
        account_name: values[4] || '',
        account_number: accountNumber,
        role: values[6]?.toUpperCase() || 'BOTH',
        type_bank: values[7] || '',
        masa_aktif: values[8] || null,
        last_sync_at: new Date().toISOString()
      });
      
      credentials.push({
        account_number: accountNumber,
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
    
    await supabase.from('bank_credentials').delete().neq('id', 0);
    await supabase.from('bank_accounts').delete().neq('id', 0);
    await supabase.from('bank_accounts').insert(banks);
    if (credentials.length) await supabase.from('bank_credentials').insert(credentials);
    
    return NextResponse.json({ success: true, message: `Sync ${banks.length} bank` });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}