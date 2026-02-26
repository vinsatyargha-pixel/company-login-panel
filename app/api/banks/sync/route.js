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
    
    // HAPUS SEMUA DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    const banks = [];
    
    // MULAI DARI BARIS 3 (INDEX 2) - 7 BANK
    for (let i = 2; i < 9; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const accountNumber = values[5]?.replace(/\s/g, '');
      if (!accountNumber || !/^\d+$/.test(accountNumber)) continue;
      
      // AMBIL DATA MENTAH DARI SHEET
      const statusSheet = values[1]?.toUpperCase() || 'AKTIF';        // Kolom B
      const displayUsedSheet = values[2]?.toUpperCase() || '';       // Kolom C
      const bankName = values[3] || '';                               // Kolom D
      const accountName = values[4] || '';                            // Kolom E
      const roleSheet = values[6]?.toUpperCase() || 'BOTH';          // Kolom F
      const typeBankSheet = values[7] || '';                          // Kolom G
      const masaAktifSheet = values[8] || null;                       // Kolom H
      
      console.log(`🔍 Baris ${i}:`, {
        bank: bankName,
        nama: accountName,
        noRek: accountNumber,
        status: statusSheet,
        displayUsed: displayUsedSheet,
        role: roleSheet
      });
      
      banks.push({
        asset: 'LUCK77',
        status: statusSheet,                    // AKTIF / TAKEDOWN
        display_used: displayUsedSheet,         // YES / NO / TAKEDOWN
        bank: bankName,
        account_name: accountName,
        account_number: accountNumber,
        role: roleSheet,                         // DEPOSIT / WITHDRAW / BOTH
        type_bank: typeBankSheet,
        masa_aktif: masaAktifSheet,
        last_sync_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data valid: ${banks.length} bank`);
    
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