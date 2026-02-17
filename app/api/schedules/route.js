import { NextResponse } from 'next/server';
import Papa from 'papaparse';

export async function GET() {
  try {
    // Ambil CSV dari Google Sheets
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRy3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/pub?gid=0&single=true&output=csv');
    const csvText = await response.text();
    
    // Parse CSV dengan PapaParse
    const result = Papa.parse(csvText, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim()
    });
    
    // Filter data yang valid (punya DATE RUNDOWN)
    const validData = result.data.filter(row => 
      row['DATE RUNDOWN'] && row['DATE RUNDOWN'].trim() !== ''
    );
    
    // Transform ke format yang lebih konsisten
    const schedules = validData.map(row => ({
      monthRundown: row['MONTH RUNDOWN'] || '',
      dateRundown: row['DATE RUNDOWN'] || '',
      date: row['DATE'] || '',
      month: row['MONTH'] || '',
      officers: {
        sulaeman: row['Sulaeman'] || '',
        goldie: row['Goldie Mountana'] || '',
        zakiy: row['Achmad Naufal Zakiy'] || '',
        hakim: row['Mushollina Nul Hakim'] || '',
        vini: row['Lie Fung Kien (Vini)'] || '',
        ronaldo: row['Ronaldo Ichwan'] || ''
      },
      notes: row['NOTE/CATATAN LAIN2'] || '',
      helper: row['HELPER'] || '',
      years: row['YEARS'] || ''
    }));
    
    return NextResponse.json({ 
      success: true, 
      total: schedules.length,
      data: schedules 
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}