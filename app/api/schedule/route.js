import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';
  const month = searchParams.get('month') || 'February';
  
  // Map bulan dari format "Feb" ke "February"
  const monthMap = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  };
  
  // Balikin mapping (February -> Feb)
  const reverseMonthMap = {
    'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
    'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
    'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
  };
  
  try {
    // Fetch dari Google Sheets CSV
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRy3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/pub?gid=0&single=true&output=csv');
    const csvText = await response.text();
    
    // Parse CSV pake PapaParse
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim() // Bersihin spasi
    });
    
    // Konversi month ke format 3 huruf
    const monthShort = reverseMonthMap[month] || month.substring(0, 3);
    
    // Filter data berdasarkan tahun dan bulan (format pendek)
    const filteredData = data.filter(row => {
      return row.YEARS === year && row.MONTH === monthShort;
    });
    
    console.log('Data ditemukan:', filteredData.length); // Debug
    
    return NextResponse.json({ 
      success: true, 
      data: filteredData,
      year, 
      month,
      monthShort,
      total: filteredData.length
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}