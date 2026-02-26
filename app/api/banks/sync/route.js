import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // INSERT MANUAL 7 BANK
    const banks = [
      { bank: 'BNI', account_name: 'ILHAM AL GHIFARI', account_number: '1927737217', type: 'deposit', type_bank: 'MOBILE', masa_aktif: '26-Sep-2026', status: true },
      { bank: 'BRI', account_name: 'NATHANAEL GEISBERT GERALD', account_number: '114301014315507', type: 'deposit', type_bank: 'MOBILE', masa_aktif: '09-Okt-2026', status: true },
      { bank: 'BCA', account_name: 'NINING PRIATIN', account_number: '7840462239', type: 'withdrawal', type_bank: 'SOFTOKEN', masa_aktif: '23-Des-2026', status: true },
      { bank: 'BNI', account_name: 'YUDA AMDANI', account_number: '1984380733', type: 'withdrawal', type_bank: 'MOBILE', masa_aktif: '24-Jan-2027', status: false },
      { bank: 'BCA', account_name: 'AHMAD GHOZALI', account_number: '7600565065', type: 'deposit', type_bank: 'MOBILE', masa_aktif: '24-Jan-2027', status: true },
      { bank: 'MANDIRI', account_name: 'RIYAN BASTIAN', account_number: '1630014471844', type: 'deposit', type_bank: 'MOBILE', masa_aktif: '29-Apr-2027', status: true },
      { bank: 'BNI', account_name: 'HENDRI MAULANA SAPUTRA', account_number: '1909646467', type: 'withdrawal', type_bank: 'MOBILE', masa_aktif: null, status: true }
    ];
    
    const { error } = await supabase.from('bank_accounts').insert(banks);
    if (error) throw error;
    
    return NextResponse.json({ success: true, message: 'Manual insert berhasil' });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}