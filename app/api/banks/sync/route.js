import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 DEBUG SYNC');
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    // TAMPILKAN 5 BARIS PERTAMA
    const lines = csvText.split('\n');
    console.log('📄 5 BARIS PERTAMA:');
    for (let i = 0; i < 5; i++) {
      if (lines[i]) {
        console.log(`Baris ${i}: ${lines[i].substring(0, 200)}`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cek log Vercel',
      totalBaris: lines.length
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}