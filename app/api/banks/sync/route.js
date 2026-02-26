import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST() {
  try {
    console.log('🚀 Sync dimulai...');
    
    // 1. TEST CONNECTION KE SPREADSHEET
    const SPREADSHEET_ID = '2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1484150508`;
    
    console.log('📡 Fetching CSV...');
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - Gagal ambil spreadsheet`);
    }
    
    const csvText = await response.text();
    console.log('✅ CSV fetched, length:', csvText.length);
    
    // 2. INSERT DATA SAMPLE KE SUPABASE (TEST)
    const testData = [{
      bank: 'TEST BANK',
      account_name: 'Test Account',
      account_number: '1234567890',
      type: 'both',
      status: true,
      last_sync_at: new Date().toISOString()
    }];
    
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert(testData)
      .select();
    
    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }
    
    console.log('✅ Data inserted:', data);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sync berhasil!',
      length: csvText.length
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}