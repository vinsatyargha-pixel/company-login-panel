import { NextResponse } from 'next/server';

export async function POST() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?output=csv';
  
  const response = await fetch(csvUrl);
  const csvText = await response.text();
  
  const lines = csvText.split('\n');
  
  // TAMPILKAN BARIS 1-10 LENGKAP DENGAN INDEX KOLOM
  for (let i = 0; i < 10; i++) {
    if (!lines[i]) continue;
    const values = lines[i].split(',');
    console.log(`\n📌 BARIS ${i}:`);
    values.forEach((val, idx) => {
      if (val.trim()) console.log(`   [${idx}] = "${val.trim()}"`);
    });
  }
  
  return NextResponse.json({ success: true });
}