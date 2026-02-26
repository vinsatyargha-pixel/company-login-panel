import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // KONEKSI SUPABASE
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // TEST INSERT 1 DATA
    const testData = [{
      bank: 'TEST BANK',
      account_name: 'Test Account',
      account_number: '1234567890',
      type: 'both',
      status: true,
      last_sync_at: new Date().toISOString()
    }];
    
    const { error } = await supabase
      .from('bank_accounts')
      .insert(testData);
    
    if (error) throw error;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Insert test berhasil'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}