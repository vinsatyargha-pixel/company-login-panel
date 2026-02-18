import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';
  const month = searchParams.get('month') || 'February';
  
  const reverseMonthMap = {
    'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
    'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
    'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
  };
  
  try {
    // Fetch CSV
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRy3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/pub?gid=0&single=true&output=csv');
    const csvText = await response.text();
    
    // Split per baris dan hapus baris kosong
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    // AMBIL HEADER (baris pertama) - pake regex buat split CSV yang bener
    const headerMatch = lines[0].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const headers = headerMatch.map(h => h.replace(/^"|"$/g, '').trim());
    
    console.log('Headers:', headers);
    
    // Parse data
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Split pake regex yang handle quoted fields
      const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
      const values = matches.map(v => v.replace(/^"|"$/g, '').trim());
      
      const row = {};
      headers.forEach((header, idx) => {
        if (header && header !== '') {
          row[header] = values[idx] || '';
        }
      });
      
      data.push(row);
    }
    
    // Filter berdasarkan tahun dan bulan
    const monthShort = reverseMonthMap[month] || month.substring(0, 3);
    const filteredData = data.filter(row => {
      return row.YEARS === year && row.MONTH === monthShort;
    });
    
    return NextResponse.json({ 
      success: true, 
      data: filteredData,
      headers,
      sampleRaw: lines[0].substring(0, 100), // Preview raw header
      year, 
      month,
      monthShort,
      total: filteredData.length,
      totalAll: data.length
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}