import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV dari sheet DATABASE bank
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1484150508&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // 2. Split per baris
    const lines = csvText.split('\n');
    
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) { // Skip header
      const columns = lines[i].split(',');
      if (columns.length < 30) continue;
      
      // Data dasar dari kolom yang udah kita pake
      const rawData = columns[29]?.replace(/"/g, '').trim(); // Kolom AD
      if (!rawData) continue;
      
      const rawType = columns[22]?.replace(/"/g, '').trim().toUpperCase(); // Kolom W
      const masaAktif = columns[23]?.replace(/"/g, '').trim() || '-'; // Kolom X
      const typeBank = columns[24]?.replace(/"/g, '').trim() || '-'; // Kolom Y
      const statusKolom = columns[25]?.replace(/"/g, '').trim().toUpperCase(); // Kolom Z
      
      // ===========================================
      // DATA LOGIN DARI KOLOM A - R
      // ===========================================
      const loginData = {
        // Kolom A (0): BANK - udah ada di bank
        // Kolom B (1): NAMA - udah ada di account_name
        // Kolom C (2): NO REK - udah ada di account_number
        
        // Login utama
        user_id_1: columns[3]?.replace(/"/g, '').trim() || null,      // Kolom D
        pin_1: columns[4]?.replace(/"/g, '').trim() || null,          // Kolom E
        
        // MYBCA
        mybca_user: columns[5]?.replace(/"/g, '').trim() || null,      // Kolom F
        user_id_2: columns[6]?.replace(/"/g, '').trim() || null,       // Kolom G
        pass_1: columns[7]?.replace(/"/g, '').trim() || null,          // Kolom H
        pin_2: columns[8]?.replace(/"/g, '').trim() || null,           // Kolom I
        
        // MBANK
        mbank_user: columns[9]?.replace(/"/g, '').trim() || null,       // Kolom J
        user_id_3: columns[10]?.replace(/"/g, '').trim() || null,      // Kolom K
        pass_2: columns[11]?.replace(/"/g, '').trim() || null,         // Kolom L
        pin_3: columns[12]?.replace(/"/g, '').trim() || null,          // Kolom M
        
        // Transaksi
        pin_transaksi: columns[13]?.replace(/"/g, '').trim() || null,  // Kolom N
        pass_transaksi: columns[14]?.replace(/"/g, '').trim() || null, // Kolom O
        
        // Alternatif
        user_id_4: columns[15]?.replace(/"/g, '').trim() || null,      // Kolom P
        pass_3: columns[16]?.replace(/"/g, '').trim() || null,         // Kolom Q
        pin_4: columns[17]?.replace(/"/g, '').trim() || null,          // Kolom R
        
        // Tambahan
        agent: columns[18]?.replace(/"/g, '').trim() || null,          // Kolom S
        pin_token: columns[19]?.replace(/"/g, '').trim() || null,      // Kolom T
        hp: columns[20]?.replace(/"/g, '').trim() || null,             // Kolom U
        email: columns[21]?.replace(/"/g, '').trim() || null,          // Kolom V
      };
      
      // Parse kolom AD: "JENIS BANK - NAMA - NO REK"
      const parts = rawData.split(' - ').map(p => p.trim());
      
      if (parts.length >= 2) {
        const bank = parts[0];
        const accountName = parts[1] || '';
        const accountNumber = parts[2] || '';
        
        if (!bank || !accountNumber) continue;
        
        const isWithdrawal = rawType === 'WITHDRAW' || rawType === 'WITHDRAWAL';
        const isActive = statusKolom === 'AKTIF';
        
        banks.push({
          bank,
          account_name: accountName,
          account_number: accountNumber,
          status: isActive,
          display: !isWithdrawal,
          used: isWithdrawal,
          type: isWithdrawal ? 'withdrawal' : 'deposit',
          masa_aktif: masaAktif,
          type_bank: typeBank,
          login_info: loginData, // ⬅️ SEMUA DATA LOGIN DISIMPAN DI SINI
          source: 'google_sheets',
          last_sync_at: new Date(),
          first_seen_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // 3. Hapus duplikat
    const uniqueBanks = [];
    const seen = new Set();
    
    for (const bank of banks) {
      const key = `${bank.bank}-${bank.account_number}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBanks.push(bank);
      }
    }

    // 4. Koneksi Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 5. Hapus data sheets lama
    await supabase
      .from('bank_accounts')
      .delete()
      .eq('source', 'google_sheets');

    // 6. Insert data baru (login_info otomatis tersimpan sebagai JSON)
    const { error } = await supabase
      .from('bank_accounts')
      .insert(uniqueBanks);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${uniqueBanks.length} bank`,
      deposit: uniqueBanks.filter(b => b.type === 'deposit').length,
      withdrawal: uniqueBanks.filter(b => b.type === 'withdrawal').length,
      active: uniqueBanks.filter(b => b.status === true).length,
      takedown: uniqueBanks.filter(b => b.status === false).length
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gunakan POST method' });
}