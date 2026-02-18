'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// MAP WARNA BG SESUAI SPESIFIKASI LO
const shiftStyles = {
  'P': 'bg-blue-100 text-blue-800 font-bold',       // Pagi (terang)
  'M': 'bg-purple-900 text-white font-bold',        // Malam (gelap)
  'S': 'bg-green-300 text-green-900 font-bold',     // Siang (sedang)
  'OFF': 'bg-gray-900 text-white font-bold',        // Hitam
  'SAKIT': 'bg-yellow-300 text-yellow-900 font-bold', // Kuning
  'IZIN': 'bg-blue-300 text-blue-900 font-bold',    // Biru
  'ABSEN': 'bg-red-500 text-white font-bold',       // Merah
  'CUTI': 'bg-green-500 text-white font-bold',      // Hijau
  'SPECIAL': 'bg-pink-300 text-pink-900 font-bold', // Pink
  'UNPAID LEAVE': 'bg-cyan-300 text-cyan-900 font-bold', // Cyan
  'DIRUMAHKAN': 'bg-cyan-300 text-cyan-900 font-bold',    // Cyan
  'RESIGN': 'bg-red-700 text-white font-bold',      // Merah tua
  'TERMINATED': 'bg-red-900 text-white font-bold',  // Merah lebih tua
  'BELUM JOIN': 'bg-gray-100 text-gray-700 font-bold', // Putih
  'default': 'bg-white text-gray-300' // Untuk HOTEL/ALPHA/FOXTROT/LAUNDRY
};

// Kode shift valid (yang boleh tampil)
const validShifts = [
  'P', 'M', 'S', 'OFF', 'SAKIT', 'IZIN', 'ABSEN', 'CUTI', 
  'SPECIAL', 'UNPAID LEAVE', 'DIRUMAHKAN', 'RESIGN', 
  'TERMINATED', 'BELUM JOIN'
];

// Data officer dari RUNDOWN (sesuai urutan kolom E-J)
const officerNames = [
  'Sulaeman',
  'Goldie Mountana',
  'Achmad Naufal Zakiy',
  'Mushollina Nul Hakim',
  'Lie Fung Kien (Vini)',
  'Ronaldo Ichwan'
];

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [monthBefore, setMonthBefore] = useState('January');
  const [officerList, setOfficerList] = useState([]);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const years = ['2026', '2027', '2028', '2029', '2030', '2031', '2032'];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchScheduleData();
      fetchOfficersFromActive();
    }
  }, [mounted, selectedYear, selectedMonth]);

  useEffect(() => {
    const currentIndex = months.indexOf(selectedMonth);
    const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setMonthBefore(months[prevIndex]);
  }, [selectedMonth]);

  // Ambil officer dari Active Officers (department CS DP WD)
  // Ambil officer dari Active Officers (department CS DP WD)
const fetchOfficersFromActive = async () => {
  try {
    const response = await fetch('/api/officers?department=CS DP WD');
    const data = await response.json();
    if (data.success && data.officers.length > 0) {
      console.log('Officers dari API:', data.officers);
      setOfficerList(data.officers);
    } else {
      console.log('Gunakan dummy officers');
      // DUMMY OFFICER - pake data dari RUNDOWN
      setOfficerList([
        { full_name: 'Sulaeman', join_date: '23-Mar-2021' },
        { full_name: 'Goldie Mountana', join_date: '13-May-2024' },
        { full_name: 'Achmad Naufal Zakiy', join_date: '18-Sep-2022' },
        { full_name: 'Mushollina Nul Hakim', join_date: '28-Mar-2022' },
        { full_name: 'Lie Fung Kien (Vini)', join_date: '01-May-2023' },
        { full_name: 'Ronaldo Ichwan', join_date: '01-Apr-2024' }
      ]);
    }
  } catch (error) {
    console.error('Error fetching officers:', error);
    // Fallback ke dummy
    setOfficerList([
      { full_name: 'Sulaeman', join_date: '23-Mar-2021' },
      { full_name: 'Goldie Mountana', join_date: '13-May-2024' },
      { full_name: 'Achmad Naufal Zakiy', join_date: '18-Sep-2022' },
      { full_name: 'Mushollina Nul Hakim', join_date: '28-Mar-2022' },
      { full_name: 'Lie Fung Kien (Vini)', join_date: '01-May-2023' },
      { full_name: 'Ronaldo Ichwan', join_date: '01-Apr-2024' }
    ]);
  }
};

  const fetchScheduleData = async () => {
  setLoading(true);
  try {
    console.log('Fetching data untuk:', selectedYear, selectedMonth);
    const response = await fetch(`/api/schedule?year=${selectedYear}&month=${selectedMonth}`);
    const result = await response.json();
    
    console.log('API Response:', result); // <-- TAMBAH INI
    
    if (result.success) {
      console.log('Data mentah dari API:', result.data); // <-- TAMBAH INI
      console.log('Jumlah data:', result.data.length);
      
      // Transform data ke format tabel
      const transformed = transformScheduleData(result.data);
      console.log('Data setelah transform:', transformed); // <-- TAMBAH INI
      
      setScheduleData(transformed);
    } else {
      console.error('API error:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

  const transformScheduleData = (rawData) => {
  console.log('transformScheduleData dimulai dengan rawData:', rawData);
  console.log('officerList:', officerList);
  
  // Map per officer
  const officerMap = {};
  officerList.forEach((officer) => {
    officerMap[officer.full_name] = {
      joinDate: officer.join_date || '-',
      shifts: {}
    };
  });
  
  console.log('officerMap awal:', officerMap);

  // Isi shifts dari rawData
  rawData.forEach(row => {
    const date = row.DATE;
    if (!date) return;
    
    console.log('Processing row untuk tanggal:', date, row); // <-- TAMBAH INI
    
    Object.keys(officerMap).forEach(officerName => {
      const shiftCode = row[officerName];
      if (shiftCode) {
        console.log(`  - ${officerName}: ${shiftCode}`); // <-- TAMBAH INI
        officerMap[officerName].shifts[date] = shiftCode;
      }
    });
  });

  console.log('officerMap setelah diisi:', officerMap);

  // Convert ke array untuk tabel
  const result = officerList.map((officer, index) => ({
    no: index + 1,
    joinDate: officer.join_date || '-',
    officerName: officer.full_name,
    prorate: 0,
    day: 27,
    shifts: officerMap[officer.full_name]?.shifts || {},
    totals: calculateTotals(officerMap[officer.full_name]?.shifts || {})
  }));
  
  console.log('Hasil akhir transform:', result);
  return result;
};

  const getDateColumns = () => {
    const columns = [];
    // Tanggal 21-31 bulan sebelumnya
    for (let day = 21; day <= 31; day++) {
      columns.push({ day, month: monthBefore });
    }
    // Tanggal 1-20 bulan yang dipilih
    for (let day = 1; day <= 20; day++) {
      columns.push({ day, month: selectedMonth });
    }
    return columns;
  };

  const getShiftForDate = (shifts, day, month) => {
  // Map month dari "January" ke "Jan"
  const monthMap = {
    'January': 'Jan', 'February': 'Feb', 'March': 'Mar', 'April': 'Apr',
    'May': 'May', 'June': 'Jun', 'July': 'Jul', 'August': 'Aug',
    'September': 'Sep', 'October': 'Oct', 'November': 'Nov', 'December': 'Dec'
  };
  
  const monthShort = monthMap[month] || month.substring(0, 3);
  const dateKey = `${day}-${monthShort}`;
  
  return shifts[dateKey] || '-';
};

  const getShiftStyle = (shift) => {
    if (!shift || shift === '-' || !validShifts.includes(shift)) {
      return shiftStyles.default;
    }
    return shiftStyles[shift] || shiftStyles.default;
  };

  const dateColumns = getDateColumns();

  const totalColumns = [
    'OFF', 'SAKIT', 'IZIN', 'ABSEN', 'CUTI', 'SPECIAL',
    'UNPAID LEAVE', 'DIRUMAHKAN', 'RESIGN', 'TERMINATED', 'BELUM JOIN'
  ];

  if (!mounted || loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen bg-white">
      {/* BACK BUTTON */}
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← BACK TO DASHBOARD
        </Link>
      </div>

      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">X-GROUP SCHEDULE {selectedYear}</h1>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm bg-white text-black"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded flex flex-wrap items-center gap-4">
        <span className="font-medium text-black">Pilih Bulan:</span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black"
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        
        <div className="ml-auto text-sm text-black">
          <span className="mr-4">Month Before: <span className="font-medium">{monthBefore}</span></span>
          <span>Month Now: <span className="font-medium">{selectedMonth}</span></span>
        </div>
      </div>

      {/* SCHEDULE TABLE */}
      <div className="border border-gray-300 rounded overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">No</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">JOIN DATE</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">OFFICER NAME</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">PRORATE</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">DAY</th>
              <th className="px-2 py-1 text-center font-bold text-black border-r border-gray-300" colSpan={dateColumns.length}>DATES</th>
              <th className="px-2 py-1 text-center font-bold text-black" colSpan={totalColumns.length}>TOTAL</th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300">
              {dateColumns.map((date, idx) => (
                <th key={idx} className="px-1 py-1 text-center font-medium text-black border-r border-gray-300 min-w-[30px]">
                  {date.day}<br/>
                  <span className="text-[10px] text-gray-600">{date.month.substring(0,3)}</span>
                </th>
              ))}
              {totalColumns.map((col, idx) => (
                <th key={idx} className="px-1 py-1 text-left font-medium text-black border-r border-gray-300 min-w-[60px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {scheduleData.map((officer) => (
              <tr key={officer.no} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{officer.no}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-black">{officer.joinDate}</td>
                <td className="px-2 py-1 border-r border-gray-200 font-medium text-black">{officer.officerName}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{officer.prorate}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{officer.day}</td>
                
                {/* Shift per tanggal */}
                {dateColumns.map((date, idx) => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return (
                    <td 
                      key={idx} 
                      className={`px-1 py-1 border-r border-gray-200 text-center ${getShiftStyle(shift)}`}
                    >
                      {shift !== '-' && validShifts.includes(shift) ? shift : '-'}
                    </td>
                  );
                })}
                
                {/* Totals */}
                {totalColumns.map((col, idx) => (
                  <td key={idx} className="px-2 py-1 border-r border-gray-200 text-right font-medium text-black">
                    {officer.totals[col] || 0}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Baris Total PAGI/SIANG/MALAM */}
            <tr className="bg-gray-50 font-bold border-t border-gray-300">
              <td colSpan="5" className="px-2 py-1 text-right text-black">TOTAL OFFICER PER DAY</td>
              <td colSpan={dateColumns.length} className="px-2 py-1"></td>
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            {/* Hitung PAGI */}
            <tr>
              <td colSpan="5" className="px-2 py-1 text-right text-black">PAGI</td>
              {dateColumns.map((date, idx) => {
                const pagiCount = scheduleData.filter(officer => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return shift === 'P';
                }).length;
                return (
                  <td key={idx} className="px-1 py-1 text-center border-r border-gray-200 font-medium text-black">
                    {pagiCount}
                  </td>
                );
              })}
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            {/* Hitung SIANG */}
            <tr>
              <td colSpan="5" className="px-2 py-1 text-right text-black">SIANG</td>
              {dateColumns.map((date, idx) => {
                const siangCount = scheduleData.filter(officer => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return shift === 'S';
                }).length;
                return (
                  <td key={idx} className="px-1 py-1 text-center border-r border-gray-200 font-medium text-black">
                    {siangCount}
                  </td>
                );
              })}
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            {/* Hitung MALAM */}
            <tr>
              <td colSpan="5" className="px-2 py-1 text-right text-black">MALAM</td>
              {dateColumns.map((date, idx) => {
                const malamCount = scheduleData.filter(officer => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return shift === 'M';
                }).length;
                return (
                  <td key={idx} className="px-1 py-1 text-center border-r border-gray-200 font-medium text-black">
                    {malamCount}
                  </td>
                );
              })}
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* LEGEND */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded text-xs">
        <div className="flex flex-wrap gap-4 text-black">
          <span><span className="inline-block w-3 h-3 bg-blue-100"></span> P = PAGI</span>
          <span><span className="inline-block w-3 h-3 bg-purple-900"></span> M = MALAM</span>
          <span><span className="inline-block w-3 h-3 bg-green-300"></span> S = SIANG</span>
          <span><span className="inline-block w-3 h-3 bg-gray-900"></span> OFF</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-300"></span> SAKIT</span>
          <span><span className="inline-block w-3 h-3 bg-blue-300"></span> IZIN</span>
          <span><span className="inline-block w-3 h-3 bg-red-500"></span> ABSEN</span>
          <span><span className="inline-block w-3 h-3 bg-green-500"></span> CUTI</span>
        </div>
      </div>
    </div>
  );
}