import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    console.log('🚀 START SYNC');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // TAMPILKAN 3 BARIS PERTAMA CSV
    const lines = csvText.split('\n');
    console.log('📄 Preview CSV (3 baris pertama):');
    for (let i = 0; i < 3; i++) {
      if (lines[i]) console.log(`Baris ${i}:`, lines[i].substring(0, 100));
    }
    
    console.log(`📊 Total baris: ${lines.length}`);
    
    // CEK INDEX KOLOM DULU
    if (lines.length > 0) {
      const header = lines[0].split(',').map(h => h.trim());
      console.log('📋 Header kolom:', header);
      
      // CEK INDEX SETIAP KOLOM
      header.forEach((h, idx) => {
        if (h.toLowerCase().includes('bank')) console.log(`🧩 Kolom BANK mungkin index: ${idx}`);
        if (h.toLowerCase().includes('no')) console.log(`🧩 Kolom NO REK mungkin index: ${idx}`);
        if (h.toLowerCase().includes('nama')) console.log(`🧩 Kolom NAMA mungkin index: ${idx}`);
        if (h.toLowerCase().includes('status')) console.log(`🧩 Kolom STATUS mungkin index: ${idx}`);
      });
    }
    
    const banks = [];
    
    // PROSES SEMUA BARIS DULU UNTUK DEBUG
    for (let i = 1; i < Math.min(10, lines.length); i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      console.log(`\n🔍 Baris ${i}:`);
      console.log(`   Jumlah kolom: ${values.length}`);
      console.log(`   Kolom 0: "${values[0]}"`);
      console.log(`   Kolom 1: "${values[1]}"`);
      console.log(`   Kolom 2: "${values[2]}"`);
      console.log(`   Kolom 3: "${values[3]}"`);
      console.log(`   Kolom 4: "${values[4]}"`);
      console.log(`   Kolom 25: "${values[25]}" (jika ada)`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Debug mode - lihat console log',
      totalBaris: lines.length
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}