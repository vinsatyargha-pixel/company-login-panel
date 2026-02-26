import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Admin (pake service role key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // PASTIKAN INI ADA DI .env.local!
);

export async function POST() {
  try {
    // 1. AMBIL DATA DARI GOOGLE SHEETS (PAKE FORMAT EXPORT CSV)
    const SPREADSHEET_ID = '2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw';
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=1484150508`;
    
    console.log('📡 Fetching CSV from:', csvUrl);
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('✅ CSV fetched, length:', csvText.length);
    
    // 2. PARSE CSV KE ARRAY
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // 3. KONVERSI KE FORMAT BANK ACCOUNTS
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // skip baris kosong
      
      const values = lines[i].split(',').map(v => v.trim());
      
      // SESUAIKAN DENGAN HEADER SPREADSHEET KAMU!
      // Contoh mapping: [bank, account_name, account_number, type, type_bank, display, used, masa_aktif, login_info]
      const bank = {
        bank: values[0] || '',
        account_name: values[1] || '',
        account_number: values[2] || '',
        type: (values[3] || 'both').toLowerCase(),
        type_bank: values[4] || '',
        display: values[5]?.toLowerCase() === 'yes' ? true : false,
        used: values[6]?.toLowerCase() === 'yes' ? true : false,
        masa_aktif: values[7] || null,
        login_info: values[8] ? JSON.parse(values[8]) : null,
        status: true, // default active
        last_sync_at: new Date().toISOString()
      };
      
      // Validasi minimal
      if (bank.bank && bank.account_number) {
        banks.push(bank);
      }
    }
    
    console.log(`📊 Parsed ${banks.length} bank records`);
    
    // 4. HAPUS SEMUA DATA LAMA (optional, atau pake upsert)
    const { error: deleteError } = await supabaseAdmin
      .from('bank_accounts')
      .delete()
      .neq('id', 0); // hapus semua
    
    if (deleteError) {
      console.error('Error deleting old data:', deleteError);
      throw deleteError;
    }
    
    // 5. INSERT DATA BARU
    const { data, error } = await supabaseAdmin
      .from('bank_accounts')
      .insert(banks)
      .select();
    
    if (error) {
      console.error('Error inserting banks:', error);
      throw error;
    }
    
    // 6. HITUNG STATISTIK
    const stats = {
      total: data.length,
      active: data.filter(b => b.status === true).length,
      takedown: data.filter(b => b.status === false).length,
      deposit: data.filter(b => b.type === 'deposit' || b.type === 'both').length,
      withdrawal: data.filter(b => b.type === 'withdrawal' || b.type === 'both').length
    };
    
    return NextResponse.json({ 
      success: true, 
      message: `Berhasil sync ${banks.length} bank`,
      ...stats
    });
    
  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}