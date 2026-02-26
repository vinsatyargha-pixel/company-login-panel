import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1689175827&single=true&output=csv';
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    const lines = csvText.split('\n');
    
    const banks = [];
    const credentials = [];
    
    // MULAI DARI BARIS 2 (index 1)
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]?.trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.length < 10) continue;
      
      // ===========================================
      // DATA BANK (Kolom A - I)
      // ===========================================
      const asset = values[0] || 'LUCK77';
      const status = values[1]?.toUpperCase() || 'AKTIF';
      const displayUsed = values[2]?.toUpperCase() || '';
      const bank = values[3] || '';
      const accountName = values[4] || '';
      const accountNumber = values[5]?.replace(/\s/g, '');
      const role = values[6]?.toUpperCase() || 'BOTH';
      const typeBank = values[7] || '';
      const masaAktif = values[8] || null;
      
      if (!accountNumber || !/^\d+$/.test(accountNumber)) {
        console.log(`⛔ Skip baris ${i}: nomor rekening tidak valid - ${accountNumber}`);
        continue;
      }
      
      banks.push({
        asset,
        status,
        display_used: displayUsed,
        bank,
        account_name: accountName,
        account_number: accountNumber,
        role,
        type_bank: typeBank,
        masa_aktif: masaAktif,
        last_sync_at: new Date().toISOString()
      });
      
      // ===========================================
      // DATA CREDENTIALS (Kolom L - X)
      // ===========================================
      // Index: L=11, M=12, N=13, O=14, P=15, Q=16, R=17, S=18, T=19, U=20, V=21, W=22, X=23
      credentials.push({
        account_number: accountNumber,
        user_id_1: values[11] || null,   // Kolom L
        pin_1: values[12] || null,        // Kolom M
        user_id_2: values[13] || null,    // Kolom N
        pass_1: values[14] || null,       // Kolom O
        pin_2: values[15] || null,        // Kolom P
        user_id_3: values[16] || null,    // Kolom Q
        pass_2: values[17] || null,       // Kolom R
        pin_3: values[18] || null,        // Kolom S
        pass_transaksi: values[19] || null, // Kolom T
        agent: values[20] || null,        // Kolom U
        pin_token: values[21] || null,    // Kolom V
        hp: values[22] || null,           // Kolom W
        email: values[23] || null,        // Kolom X
        created_at: new Date().toISOString()
      });
    }
    
    console.log(`✅ Data bank: ${banks.length}, Data credentials: ${credentials.length}`);
    
    if (banks.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Tidak ada data valid' 
      });
    }
    
    // HAPUS DATA LAMA (URUTAN PENTING!)
    console.log('🗑️ Menghapus data credentials...');
    await supabase.from('bank_credentials').delete().neq('id', 0);
    
    console.log('🗑️ Menghapus data bank_accounts...');
    await supabase.from('bank_accounts').delete().neq('id', 0);
    
    // INSERT DATA BARU
    console.log('💾 Inserting banks...');
    const { error: bankError } = await supabase.from('bank_accounts').insert(banks);
    if (bankError) throw bankError;
    
    if (credentials.length > 0) {
      console.log('💾 Inserting credentials...');
      const { error: credError } = await supabase.from('bank_credentials').insert(credentials);
      if (credError) throw credError;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Sync ${banks.length} bank & ${credentials.length} credentials`
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}