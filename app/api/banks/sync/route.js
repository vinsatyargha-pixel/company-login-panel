import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    // 1. Fetch CSV
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1484150508&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    // 2. Parse CSV
    const lines = csvText.split('\n');
    const banks = [];
    
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length < 30) continue;
      
      // Ambil kolom AD (index 29)
      const rawData = columns[29]?.replace(/"/g, '').trim();
      if (!rawData) continue;
      
      // Ambil kolom W (index 22) - tipe
      const rawType = columns[22]?.replace(/"/g, '').trim().toUpperCase();
      
      const parts = rawData.split(' - ').map(p => p.trim());
      if (parts.length >= 2) {
        const bank = parts[0];
        const accountName = parts[1] || '';
        const accountNumber = parts[2] || '';
        
        if (!bank || !accountNumber) continue;
        
        const isWithdrawal = rawType === 'WITHDRAW' || rawType === 'WITHDRAWAL';
        
        banks.push({
          bank,
          account_name: accountName,
          account_number: accountNumber,
          status: true,
          display: !isWithdrawal,
          used: isWithdrawal,
          type: isWithdrawal ? 'withdrawal' : 'deposit',
          source: 'google_sheets',
          last_sync_at: new Date()
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

    // 5. Hapus data lama & insert baru
    await supabase.from('bank_accounts').delete().eq('source', 'google_sheets');
    await supabase.from('bank_accounts').insert(uniqueBanks);

    // 6. Return SIMPLE (hanya success dan count)
    return NextResponse.json({ 
      success: true, 
      count: uniqueBanks.length 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gunakan POST method' });
}