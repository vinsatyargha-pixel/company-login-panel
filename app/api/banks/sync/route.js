import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  console.log('========== STEP 2: TEST SUPABASE ==========');
  
  try {
    // CEK ENV VARIABLES
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('URL:', supabaseUrl ? 'ADA' : 'TIDAK ADA');
    console.log('KEY:', supabaseKey ? 'ADA' : 'TIDAK ADA');
    
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
    
    // BUAT SUPABASE CLIENT
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created');
    
    // TEST QUERY SEDERHANA
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('count')
      .limit(1);
    
    console.log('📊 Query result:', { data, error });
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: `Query error: ${error.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Koneksi Supabase berhasil!',
      data: data
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}