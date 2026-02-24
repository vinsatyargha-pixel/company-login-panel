import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';

export async function POST() {
  try {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRtDCwpVJmPZVjpHmpmcW6QTjYfw8Zrout-IHEYqlXP_xyuY-pVbJSWW9PGDMNWJwOAUMzh3oK_Jaw/pub?gid=1435714791&single=true&output=csv';
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    const records = parse(csvText, { skip_empty_lines: true, trim: true });
    
    let currentSection = null;
    const banks = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      if (!row || row.length === 0) continue;

      if (row[0]?.includes('DEPOSIT')) {
        currentSection = 'deposit';
        i += 2;
        continue;
      }
      if (row[0]?.includes('WITHDRAW')) {
        currentSection = 'withdrawal';
        i += 2;
        continue;
      }

      if (!row[3] || row[1] !== 'YES') continue;

      const cleanRow = row.map(cell => cell?.replace(/\n/g, '').trim() || '');
      const isActive = cleanRow[26] === 'AKTIF' || cleanRow[27] === 'AKTIF';

      banks.push({
        bank: cleanRow[3],
        account_name: cleanRow[4],
        account_number: cleanRow[5],
        status: isActive,
        display: currentSection === 'deposit',
        used: currentSection === 'withdrawal',
        type: currentSection,
        source: 'google_sheets',
        last_sync_at: new Date(),
        first_seen_at: new Date(),
        updated_at: new Date()
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase.from('bank_accounts').delete().eq('source', 'google_sheets');
    
    const { error } = await supabase.from('bank_accounts').insert(banks);
    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Sync: ${banks.length} bank` 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Gunakan POST method' });
}