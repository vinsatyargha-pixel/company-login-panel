import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year') || '2026';
  const month = searchParams.get('month') || 'February';
  
  try {
    // Fetch dari Google Sheets CSV
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRy3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/pub?gid=0&single=true&output=csv');
    const csvText = await response.text();
    
    // Parse CSV pake PapaParse
    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    
    // Filter data berdasarkan tahun dan bulan
    const filteredData = data.filter(row => {
      return row.YEARS === year && row.MONTH === month;
    });
    
    console.log('Data ditemukan:', filteredData.length); // Buat debugging
    
    return NextResponse.json({ 
      success: true, 
      data: filteredData,
      year, 
      month 
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}