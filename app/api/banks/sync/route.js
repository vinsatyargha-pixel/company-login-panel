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
    
    // 4. SKIP HEADER
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      if (values.length < 4) continue;
      
      const bankName = values[2]?.toUpperCase();
      const accountNumber = values[3]?.replace(/\s/g, '');
      const accountName = values[4];
      const role = values[5]?.toLowerCase();
      const typeBank = values[6];
      const masaAktif = values[10];
      
      if (!bankName || !accountNumber || !accountName) continue;
      if (!/^\d+$/.test(accountNumber)) continue;
      
      // TENTUKAN TYPE
      let type = 'both';
      if (role?.includes('deposit')) type = 'deposit';
      else if (role?.includes('withdrawal')) type = 'withdrawal';
      
      // TENTUKAN STATUS DARI KOLOM Z
      let status = true;
      if (values[25]?.toUpperCase() === 'TAKEDOWN') status = false;
      
      // AMBIL DISPLAY & USED
      let display = values[8]?.toLowerCase() === 'yes' ? true : false;
      let used = values[9]?.toLowerCase() === 'yes' ? true : false;
      
      // KALAU TAKEDOWN, RESET DISPLAY & USED
      if (!status) {
        display = false;
        used = false;
      }
      
      banks.push({
        bank: bankName,
        account_name: accountName,
        account_number: accountNumber,
        type: type,
        type_bank: typeBank || '',
        display: display,
        used: used,
        masa_aktif: masaAktif || null,
        status: status,
        last_sync_at: new Date().toISOString()
      });
    }
    
    // 5. HAPUS DATA LAMA & INSERT BARU
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    if (banks.length > 0) {
      const { error } = await supabase.from('bank_accounts').insert(banks);
      if (error) throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync berhasil! ${banks.length} bank diupdate`
    });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}