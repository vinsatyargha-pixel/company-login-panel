import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 START SYNC - DEBUG MODE');
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // TAMPILKAN RAW CSV
    console.log('📄 RAW CSV (500 chars pertama):');
    console.log(csvText.substring(0, 500));
    
    const lines = csvText.split('\n').filter(line => line.trim());
    console.log(`📊 Total baris: ${lines.length}`);
    
    // TAMPILKAN 5 BARIS PERTAMA DENGAN DETAIL KOLOM
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      console.log(`\n=== BARIS ${i} ===`);
      console.log(`RAW: "${lines[i]}"`);
      
      const values = lines[i].split(',').map(v => v.trim());
      console.log(`Jumlah kolom: ${values.length}`);
      
      values.forEach((val, idx) => {
        console.log(`  [${idx}] = "${val}"`);
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'CEK LOG VERCELL',
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