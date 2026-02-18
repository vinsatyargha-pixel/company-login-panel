import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';
  const month = searchParams.get('month') || 'February';
  
  const monthMap = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  };
  
  const reverseMonthMap = {
    'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
    'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
    'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
  };
  
  try {
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRy3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/pub?gid=0&single=true&output=csv');
    const csvText = await response.text();
    
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });
    
    const monthShort = reverseMonthMap[month] || month.substring(0, 3);
    
    // FILTER: Ambil data dengan MONTH = "Feb" dan YEARS = "2026"
    const filteredData = data.filter(row => {
      return row.YEARS === year && row.MONTH === monthShort;
    });
    
    // DEBUG: Return juga sample data pertama
    const sampleData = data.slice(0, 5); // 5 baris pertama
    
    return NextResponse.json({ 
      success: true, 
      data: filteredData,
      sampleData, // Buat liat struktur data
      year, 
      month,
      monthShort,
      total: filteredData.length,
      totalAll: data.length
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}