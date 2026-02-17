export async function GET() {
  try {
    // Ambil CSV dari Google Sheets
    const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vRy3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/pub?gid=0&single=true&output=csv');
    const csvText = await response.text();

    // Parse CSV manual
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const schedules = lines.slice(1)
      .filter(line => line.trim() !== '')
      .map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

    return Response.json({
      success: true,
      total: schedules.length,
      data: schedules.slice(0, 5)
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}