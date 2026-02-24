// app/api/banks/sync/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const csvUrl = '...'; // URL lo
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const lines = csvText.split('\n');
    const banks = [];

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',');
      if (columns.length < 30) continue;

      const rawData = columns[29]?.replace(/"/g, '').trim();
      if (!rawData) continue;

      const rawType = columns[22]?.replace(/"/g, '').trim().toUpperCase();
      const masaAktif = columns[23]?.replace(/"/g, '').trim() || '-';
      const typeBank = columns[24]?.replace(/"/g, '').trim() || '-';
      const statusKolom = columns[25]?.replace(/"/g, '').trim().toUpperCase();

      // LOGIN INFO - TANPA AGENT, PIN_TOKEN, HP, EMAIL
      const loginInfo = {
        user_id_1: columns[3]?.replace(/"/g, '').trim() || null,
        pin_1: columns[4]?.replace(/"/g, '').trim() || null,
        mybca_user: columns[5]?.replace(/"/g, '').trim() || null,
        user_id_2: columns[6]?.replace(/"/g, '').trim() || null,
        pass_1: columns[7]?.replace(/"/g, '').trim() || null,
        pin_2: columns[8]?.replace(/"/g, '').trim() || null,
        mbank_user: columns[9]?.replace(/"/g, '').trim() || null,
        user_id_3: columns[10]?.replace(/"/g, '').trim() || null,
        pass_2: columns[11]?.replace(/"/g, '').trim() || null,
        pin_3: columns[12]?.replace(/"/g, '').trim() || null,
        pin_transaksi: columns[13]?.replace(/"/g, '').trim() || null,
        pass_transaksi: columns[14]?.replace(/"/g, '').trim() || null,
        user_id_4: columns[15]?.replace(/"/g, '').trim() || null,
        pass_3: columns[16]?.replace(/"/g, '').trim() || null,
        pin_4: columns[17]?.replace(/"/g, '').trim() || null
        // ✅ AGENT, PIN_TOKEN, HP, EMAIL DIHAPUS
      };

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
          login_info: loginInfo,
          source: 'google_sheets',
          last_sync_at: new Date(),
          first_seen_at: new Date(),
          updated_at: new Date()
        });
      }
    }

    const uniqueBanks = [];
    const seen = new Set();
    for (const bank of banks) {
      const key = `${bank.bank}-${bank.account_number}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueBanks.push(bank);
      }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase.from('bank_accounts').delete().eq('source', 'google_sheets');
    const { error } = await supabase.from('bank_accounts').insert(uniqueBanks);
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gunakan POST method' });
}