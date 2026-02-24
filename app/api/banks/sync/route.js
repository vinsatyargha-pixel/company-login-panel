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
    
    for (let i = 1; i < lines.length; i++) { // Skip header (baris 0)
      const columns = lines[i].split(',');
      if (columns.length < 30) continue; // Pastikan ada kolom cukup
      
      // Ambil kolom AD (index 29) - text join bank - nama - norek
      const rawData = columns[29]?.replace(/"/g, '').trim();
      if (!rawData) continue;
      
      // Ambil kolom W (index 22) - tipe (DEPOSIT / WITHDRAW)
      const rawType = columns[22]?.replace(/"/g, '').trim().toUpperCase();
      
      // Format kolom AD: "JENIS BANK - NAMA - NO REK"
      const parts = rawData.split(' - ').map(p => p.trim());
      
      if (parts.length >= 2) {
        const bank = parts[0];
        const accountName = parts[1] || '';
        const accountNumber = parts[2] || '';
        
        if (!bank || !accountNumber) continue;
        
        // Tentukan tipe dari kolom W
        const isWithdrawal = rawType === 'WITHDRAW' || rawType === 'WITHDRAWAL';
        const isDeposit = rawType === 'DEPOSIT';
        
        // Kalau kolom W gak ada, default deposit
        const type = isWithdrawal ? 'withdrawal' : 'deposit';
        
        banks.push({
          bank,
          account_name: accountName,
          account_number: accountNumber,
          status: true,
          display: !isWithdrawal, // Deposit = display true
          used: isWithdrawal,      // Withdrawal = used true
          type: type,
          source: 'google_sheets',
          last_sync_at: new Date(),
          first_seen_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    // 3. Hapus duplikat (kalau ada)
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

    // 6. Insert data baru
    const { error } = await supabase
      .from('bank_accounts')
      .insert(uniqueBanks);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Sync berhasil: ${uniqueBanks.length} bank`,
      deposit: uniqueBanks.filter(b => b.type === 'deposit').length,
      withdrawal: uniqueBanks.filter(b => b.type === 'withdrawal').length,
      details: uniqueBanks.map(b => ({
        bank: b.bank,
        name: b.account_name,
        type: b.type
      }))
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