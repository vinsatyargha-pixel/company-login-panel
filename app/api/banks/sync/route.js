import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('========== STEP 3: TEST FETCH CSV ==========');
  
  try {
    // 1. CEK SUPABASE (sama seperti step 2)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 2. TEST FETCH CSV
    const SPREADSHEET_ID = '2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw';
    const GID = '1484150508';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    
    console.log('📡 Fetching CSV...');
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log(`✅ CSV fetched: ${csvText.length} bytes`);
    
    // 3. TAMPILKAN PREVIEW
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
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}