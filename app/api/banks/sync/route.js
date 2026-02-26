import { NextResponse } from 'next/server';

export async function POST() {
  console.log('========== STEP 3: TEST FETCH CSV ==========');
  
  try {
    // 1. CEK SPREADSHEET ID
    const SPREADSHEET_ID = '2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw';
    const GID = '1484150508';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    
    console.log('📡 Fetching CSV from:', csvUrl);
    
    // 2. LAKUKAN FETCH DENGAN HEADER LENGKAP
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js/14)',
        'Accept': 'text/csv,application/json'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      // COBA BACA ERROR RESPONSE
      const errorText = await response.text().catch(() => 'Tidak bisa baca error response');
      console.error('❌ Response error:', errorText.substring(0, 200));
      
      return NextResponse.json({ 
        success: false, 
        error: `Gagal ambil CSV: HTTP ${response.status}`,
        status: response.status,
        statusText: response.statusText,
        errorPreview: errorText.substring(0, 200)
      }, { status: 500 });
    }
    
    const csvText = await response.text();
    console.log(`✅ CSV fetched: ${csvText.length} bytes`);
    
    // 3. CEK ISI CSV
    if (csvText.length < 10) {
      return NextResponse.json({ 
        success: false, 
        error: 'CSV terlalu pendek atau kosong',
        content: csvText
      }, { status: 500 });
    }
    
    // 4. PARSE SEDERHANA
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim());
    
    return NextResponse.json({ 
      success: true, 
      message: 'CSV berhasil diambil!',
      length: csvText.length,
      totalBaris: lines.length,
      headers: headers,
      preview: lines.slice(0, 3).map(line => line.substring(0, 100))
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}