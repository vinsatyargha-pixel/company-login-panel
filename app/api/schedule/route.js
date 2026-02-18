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
    
    // Split per baris
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    // Ambil header (baris pertama) - bersihin dari koma di awal
    let headerLine = lines[0];
    // Hapus koma di awal kalo ada
    if (headerLine.startsWith(',')) {
      headerLine = headerLine.substring(1);
    }
    const headers = headerLine.split(',').map(h => h.trim());
    
    console.log('Headers:', headers); // Debug
    
    // Parse data baris per baris (mulai dari baris ke-2)
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      let line = lines[i];
      // Hapus koma di awal kalo ada
      if (line.startsWith(',')) {
        line = line.substring(1);
      }
      
      const values = line.split(',');
      const row = {};
      
      // Map values ke headers
      headers.forEach((header, index) => {
        if (header && header !== '') {
          row[header] = values[index] || '';
        }
      });
      
      // Hanya tambah kalo row punya data
      if (Object.keys(row).length > 0) {
        data.push(row);
      }
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
      sampleRow: filteredData[0] || null,
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
      error: error.message 
    }, { status: 500 });
  }
}