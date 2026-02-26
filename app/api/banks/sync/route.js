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
    
    // SPLIT PER BARIS
    const lines = csvText.split('\n');
    console.log('Total baris:', lines.length);
    
    const banks = [];
    
    // MULAI DARI BARIS 2 (index 1) KARENA BARIS 1 HEADER
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // SPLIT CSV
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 5) continue;
      
      // AMBIL DATA SESUAI KOLOM (A = index 0, B = index 1, dst)
      const asset = values[0] || 'LUCK77';                 // Kolom A
      const status = values[1]?.toUpperCase() || 'AKTIF';  // Kolom B
      const displayUsed = values[2]?.toUpperCase() || '';  // Kolom C
      const bank = values[3] || '';                         // Kolom D
      const accountName = values[4] || '';                  // Kolom E
      let accountNumber = values[5]?.replace(/\s/g, '');    // Kolom F
      const role = values[6]?.toUpperCase() || 'BOTH';      // Kolom G
      const typeBank = values[7] || '';                      // Kolom H
      const masaAktif = values[8] || null;                   // Kolom I
      
      // VALIDASI NOMOR REKENING
      if (!accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`⛔ Skip baris ${i}: nomor rekening tidak valid - ${accountNumber}`);
        continue;
      }
      
      console.log(`✅ Baris ${i}: ${bank} - ${accountName} - ${accountNumber} - ${role}`);
      
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