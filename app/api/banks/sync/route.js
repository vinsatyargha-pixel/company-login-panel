import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('========== SYNC API CALLED ==========');
  
  try {
    // CEK ENV VARIABLES
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ ADA' : '❌ TIDAK ADA');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? `✅ ADA (${supabaseKey.substring(0, 10)}...)` : '❌ TIDAK ADA');
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false, 
        error: 'Environment variables tidak lengkap',
        env: {
          url: !!supabaseUrl,
          key: !!supabaseKey
        }
      }, { status: 500 });
    }
    
    // TEST KONEKSI SUPABASE DULU
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Supabase error: ${error.message}` 
      }, { status: 500 });
    }
    
    console.log('Supabase connection OK');
    
    // AMBIL CSV
    const SPREADSHEET_ID = '2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw';
    const GID = '1484150508';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
    
    console.log('Fetching CSV from:', csvUrl);
    
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Next.js/14)'
      }
    });
    
    console.log('CSV response status:', response.status);
    
    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: `Gagal ambil CSV: HTTP ${response.status}` 
      }, { status: 500 });
    }
    
    const csvText = await response.text();
    console.log('CSV length:', csvText.length);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sync berhasil!',
      length: csvText.length,
      preview: csvText.substring(0, 200)
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}