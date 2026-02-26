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
      
      const bankName = values[2]?.toUpperCase(); // Kolom C
      const accountNumber = values[3]?.replace(/\s/g, ''); // Kolom D
      const accountName = values[4]; // Kolom E
      const role = values[5]?.toLowerCase(); // Kolom F
      const typeBank = values[6]; // Kolom G
      const masaAktif = values[10]; // Kolom K
      const display = values[8]?.toLowerCase() === 'yes' ? true : false; // Kolom I
      const used = values[9]?.toLowerCase() === 'yes' ? true : false; // Kolom J
      const statusKolom = values[25]?.toUpperCase(); // Kolom Z
      
      // VALIDASI
      if (!bankName || !accountNumber || !accountName) continue;
      if (!/^\d+$/.test(accountNumber)) continue;
      
      // TENTUKAN TYPE
      let type = 'both';
      if (role?.includes('deposit')) type = 'deposit';
      else if (role?.includes('withdrawal')) type = 'withdrawal';
      
      // TENTUKAN STATUS
      const isActive = statusKolom !== 'TAKEDOWN';
      
      banks.push({
        bank: bankName,
        account_name: accountName,
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