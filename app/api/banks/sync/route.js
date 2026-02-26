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
    console.log(`Total baris: ${lines.length}`);
    
    // 4. SKIP HEADER (baris pertama)
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      // CEK APAKAH INI DATA BANK VALID (minimal 4 kolom)
      if (values.length < 4) continue;
      
      const bankName = values[2]?.toUpperCase(); // Kolom C: Nama Bank
      const accountNumber = values[3]?.replace(/\s/g, ''); // Kolom D: No Rekening
      const accountName = values[4]; // Kolom E: Nama Pemilik
      const role = values[5]?.toLowerCase(); // Kolom F: Role (Deposit/Withdrawal)
      const typeBank = values[6]; // Kolom G: Type Bank
      const masaAktif = values[10]; // Kolom K: Masa Aktif
      const display = values[8]?.toLowerCase() === 'yes' ? true : false; // Kolom I: Display
      
      // VALIDASI: harus ada bank, nomor rekening, dan nama
      if (!bankName || !accountNumber || !accountName) continue;
      
      // VALIDASI: nomor rekening harus angka
      if (!/^\d+$/.test(accountNumber)) continue;
      
      // TENTUKAN TYPE
      let type = 'both';
      if (role?.includes('deposit')) type = 'deposit';
      else if (role?.includes('withdrawal')) type = 'withdrawal';
      
      // ===========================================
      // STATUS DARI KOLOM Z (index 25)
      // ===========================================
      let status = true; // default active
      if (values[25]?.toUpperCase() === 'TAKEDOWN') {
        status = false;
      }
      
      // ===========================================
      // USED - HANYA YES KALAU STATUS ACTIVE
      // ===========================================
      let used = false;
      if (status && values[9]?.toLowerCase() === 'yes') { // Kolom J: Used
        used = true;
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
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    
    // 5. HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // 6. INSERT DATA BARU
    if (banks.length > 0) {
      const { error } = await supabase
        .from('bank_accounts')
        .insert(banks);
      
      if (error) throw error;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync berhasil! ${banks.length} bank diupdate`,
      total: banks.length
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}