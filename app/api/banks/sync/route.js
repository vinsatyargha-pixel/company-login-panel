import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. KONEKSI SUPABASE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 2. FETCH CSV - PAKE URL PUBLISHED!
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    console.log('📡 Fetching CSV from:', csvUrl);
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `HTTP ${response.status}` 
      }, { status: 500 });
    }
    
    const csvText = await response.text();
    console.log(`✅ CSV fetched: ${csvText.length} bytes`);
    
    // 3. PARSE CSV SEDERHANA
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log(`📊 Total baris: ${lines.length}`);
    
    // 4. HAPUS DATA LAMA
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // 5. INSERT DATA BARU (CONTOH)
    const banks = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 3) {
        banks.push({
          bank: values[0]?.trim() || '',
          account_name: values[1]?.trim() || '',
          account_number: values[2]?.trim() || '',
          type: 'both',
          status: true,
          last_sync_at: new Date().toISOString()
        });
      }
    }
    
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