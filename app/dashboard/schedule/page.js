'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// MAP WARNA BG SESUAI SPESIFIKASI
const shiftStyles = {
  'P': 'bg-blue-100 text-blue-800 font-bold',
  'M': 'bg-purple-900 text-white font-bold',
  'S': 'bg-green-300 text-green-900 font-bold',
  'OFF': 'bg-gray-900 text-white font-bold',
  'SAKIT': 'bg-yellow-300 text-yellow-900 font-bold',
  'IZIN': 'bg-blue-300 text-blue-900 font-bold',
  'ABSEN': 'bg-red-500 text-white font-bold',
  'CUTI': 'bg-green-500 text-white font-bold',
  'SPECIAL': 'bg-pink-300 text-pink-900 font-bold',
  'UNPAID LEAVE': 'bg-cyan-300 text-cyan-900 font-bold',
  'DIRUMAHKAN': 'bg-cyan-300 text-cyan-900 font-bold',
  'RESIGN': 'bg-red-700 text-white font-bold',
  'TERMINATED': 'bg-red-900 text-white font-bold',
  'BELUM JOIN': 'bg-gray-100 text-gray-700 font-bold',
  'default': 'bg-white text-gray-300'
};

// MAP WARNA UNTUK KOLOM TOTAL
const totalStyles = {
  'OFF': 'bg-gray-900 text-white font-bold',
  'SAKIT': 'bg-yellow-300 text-yellow-900 font-bold',
  'IZIN': 'bg-blue-300 text-blue-900 font-bold',
  'ABSEN': 'bg-red-500 text-white font-bold',
  'CUTI': 'bg-green-500 text-white font-bold',
  'SPECIAL': 'bg-pink-300 text-pink-900 font-bold',
  'UNPAID LEAVE': 'bg-cyan-300 text-cyan-900 font-bold',
  'DIRUMAHKAN': 'bg-cyan-300 text-cyan-900 font-bold',
  'RESIGN': 'bg-red-700 text-white font-bold',
  'TERMINATED': 'bg-red-900 text-white font-bold',
  'BELUM JOIN': 'bg-gray-100 text-gray-700 font-bold'
};

// Kode shift valid
const validShifts = [
  'P', 'M', 'S', 'OFF', 'SAKIT', 'IZIN', 'ABSEN', 'CUTI', 
  'SPECIAL', 'UNPAID LEAVE', 'DIRUMAHKAN', 'RESIGN', 
  'TERMINATED', 'BELUM JOIN'
];

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [monthBefore, setMonthBefore] = useState('January');
  
  // HARDCODE OFFICER LIST
  const [officerList] = useState([
    { full_name: 'Sulaeman', join_date: '23-Mar-2021' },
    { full_name: 'Goldie Mountana', join_date: '13-May-2024' },
    { full_name: 'Achmad Naufal Zakiy', join_date: '18-Sep-2022' },
    { full_name: 'Mushollina Nul Hakim', join_date: '28-Mar-2022' },
    { full_name: 'Lie Fung Kien (Vini)', join_date: '01-May-2023' },
    { full_name: 'Ronaldo Ichwan', join_date: '01-Apr-2024' }
  ]);
  
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
    }
  }, [mounted, selectedYear, selectedMonth]);

  useEffect(() => {
    const currentIndex = months.indexOf(selectedMonth);
    const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setMonthBefore(months[prevIndex]);
  }, [selectedMonth]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/schedule?year=${selectedYear}&month=${selectedMonth}`);
      const result = await response.json();
      
      if (result.success) {
        const transformed = transformScheduleData(result.data);
        setScheduleData(transformed);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (shifts) => {
    const totals = {
      OFF: 0, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0, SPECIAL: 0,
      'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0
    };
    
    Object.values(shifts).forEach(shift => {
      if (validShifts.includes(shift) && totals.hasOwnProperty(shift)) {
        totals[shift] = (totals[shift] || 0) + 1;
      }
    });
    
    return totals;
  };

  const transformScheduleData = (rawData) => {
    const officerMap = {};
    officerList.forEach((officer) => {
      officerMap[officer.full_name] = {
        joinDate: officer.join_date || '-',
        shifts: {}
      };
    });

    rawData.forEach(row => {
      const date = row.DATE;
      if (!date) return;
      
      Object.keys(officerMap).forEach(officerName => {
        const shiftCode = row[officerName];
        if (shiftCode && shiftCode.trim() !== '') {
          officerMap[officerName].shifts[date] = shiftCode;
        }
      });
    });

    return officerList.map((officer, index) => {
      const shifts = officerMap[officer.full_name]?.shifts || {};
      const totals = calculateTotals(shifts);
      
      // Hitung PRORATE = 4 - total OFF
      const prorate = Math.max(0, 4 - (totals.OFF || 0));
      
      // Hitung DAY = total hari kerja (tanpa OFF, SAKIT, IZIN, ABSEN, DIRUMAHKAN, UNPAID LEAVE)
      const totalDays = Object.keys(shifts).length;
      const nonWorkingDays = (totals.OFF || 0) + (totals.SAKIT || 0) + (totals.IZIN || 0) + 
                             (totals.ABSEN || 0) + (totals.DIRUMAHKAN || 0) + (totals.UNPAID LEAVE || 0);
      const day = totalDays - nonWorkingDays;
      
      return {
        no: index + 1,
        joinDate: officer.join_date || '-',
        officerName: officer.full_name,
        prorate: prorate,
        day: day,
        shifts: shifts,
        totals: totals
      };
    });
  };

  const getDateColumns = () => {
    const columns = [];
    
    const prevMonthDate = new Date(`${monthBefore} 1, ${selectedYear}`);
    const prevMonthDays = new Date(selectedYear, prevMonthDate.getMonth() + 1, 0).getDate();
    const currentMonthDays = new Date(selectedYear, months.indexOf(selectedMonth) + 1, 0).getDate();
    
    for (let day = 21; day <= prevMonthDays; day++) {
      columns.push({ day, month: monthBefore });
    }
    
    const maxDay = Math.min(20, currentMonthDays);
    for (let day = 1; day <= maxDay; day++) {
      columns.push({ day, month: selectedMonth });
    }
    
    return columns;
  };

  const getShiftForDate = (shifts, day, month) => {
    return shifts[day.toString()] || '-';
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
      <div className="mb-4">
        <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
          ← BACK TO DASHBOARD
        </Link>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">X-GROUP SCHEDULE {selectedYear}</h1>
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

      {/* MONTH SELECTOR */}
      <div className="mb-2 flex items-end justify-between">
        <div className="flex items-center gap-4">
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
        </div>
        
        <div className="text-sm text-black mb-1">
          <span className="mr-6">Month Before: <span className="font-bold">{monthBefore}</span></span>
          <span>Month Now: <span className="font-bold">{selectedMonth}</span></span>
        </div>
      </div>

      {/* TABLE SCHEDULE - DENGAN STICKY COLUMNS */}
      <div className="border border-gray-300 rounded overflow-x-auto bg-white shadow-sm" style={{ maxWidth: '100%', overflowX: 'auto' }}>
        <table className="w-full text-xs border-collapse" style={{ minWidth: '2000px' }}>
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              {/* STICKY COLUMNS - No, JOIN DATE, OFFICER NAME, PRORATE, DAY */}
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300 sticky left-0 bg-gray-100 z-20" rowSpan="2" style={{ left: 0, minWidth: '50px' }}>No</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300 sticky left-0 bg-gray-100 z-20" rowSpan="2" style={{ left: '50px', minWidth: '100px' }}>JOIN DATE</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300 sticky left-0 bg-gray-100 z-20" rowSpan="2" style={{ left: '150px', minWidth: '150px' }}>OFFICER NAME</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300 sticky left-0 bg-gray-100 z-20" rowSpan="2" style={{ left: '300px', minWidth: '60px' }}>PRORATE</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300 sticky left-0 bg-gray-100 z-20" rowSpan="2" style={{ left: '360px', minWidth: '50px' }}>DAY</th>
              
              {/* DATES - Normal (tidak sticky) */}
              <th className="px-2 py-1 text-center font-bold text-black border-r border-gray-300 relative" colSpan={dateColumns.length}>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs font-normal text-gray-600">
                  Month Before: {monthBefore}
                </div>
                DATES
              </th>
              
              {/* TOTAL - Normal */}
              <th className="px-2 py-1 text-center font-bold text-black" colSpan={totalColumns.length}>TOTAL</th>
            </tr>
            
            <tr className="bg-gray-50 border-b border-gray-300">
              {/* Kolom tanggal - normal */}
              {dateColumns.map((date, idx) => (
                <th key={idx} className="px-1 py-1 text-center font-medium text-black border-r border-gray-300 min-w-[30px]">
                  {date.day}<br/>
                  <span className="text-[10px] text-gray-600">{date.month.substring(0,3)}</span>
                </th>
              ))}
              {/* Kolom total - normal */}
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
                {/* STICKY COLUMNS - Data officer */}
                <td className="px-2 py-1 border-r border-gray-200 text-center sticky left-0 bg-white z-10 font-bold text-black" style={{ left: 0 }}>{officer.no}</td>
                <td className="px-2 py-1 border-r border-gray-200 sticky left-0 bg-white z-10 font-bold text-black" style={{ left: '50px' }}>{officer.joinDate}</td>
                <td className="px-2 py-1 border-r border-gray-200 font-bold sticky left-0 bg-white z-10 font-bold text-black" style={{ left: '150px' }}>{officer.officerName}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-center sticky left-0 bg-white z-10 font-bold text-black" style={{ left: '300px' }}>{officer.prorate}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-center sticky left-0 bg-white z-10 font-bold text-black" style={{ left: '360px' }}>{officer.day}</td>
                
                {/* Shift per tanggal - normal */}
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
                
                {/* Totals - normal dengan warna */}
                {totalColumns.map((col, idx) => (
                  <td key={idx} className={`px-2 py-1 border-r border-gray-200 text-right font-bold ${totalStyles[col] || 'text-black'}`}>
                    {officer.totals[col] || 0}
                  </td>
                ))}
              </tr>
            ))}
            
            {/* STICKY untuk baris total */}
            <tr className="bg-gray-50 font-bold border-t border-gray-300">
              <td colSpan="5" className="px-2 py-1 text-right sticky left-0 bg-gray-50 z-10 font-bold text-black" style={{ left: 0 }}>TOTAL OFFICER PER DAY</td>
              <td colSpan={dateColumns.length} className="px-2 py-1"></td>
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            <tr>
              <td colSpan="5" className="px-2 py-1 text-right font-bold sticky left-0 bg-white z-10 font-bold text-black" style={{ left: 0 }}>PAGI</td>
              {dateColumns.map((date, idx) => {
                const pagiCount = scheduleData.filter(officer => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return shift === 'P';
                }).length;
                return (
                  <td key={idx} className="px-1 py-1 text-center border-r border-gray-200 font-bold text-black">
                    {pagiCount}
                  </td>
                );
              })}
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            <tr>
              <td colSpan="5" className="px-2 py-1 text-right font-bold sticky left-0 bg-white z-10 font-bold text-black" style={{ left: 0 }}>SIANG</td>
              {dateColumns.map((date, idx) => {
                const siangCount = scheduleData.filter(officer => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return shift === 'S';
                }).length;
                return (
                  <td key={idx} className="px-1 py-1 text-center border-r border-gray-200 font-bold text-black">
                    {siangCount}
                  </td>
                );
              })}
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            <tr>
              <td colSpan="5" className="px-2 py-1 text-right font-bold sticky left-0 bg-white z-10 font-bold text-black" style={{ left: 0 }}>MALAM</td>
              {dateColumns.map((date, idx) => {
                const malamCount = scheduleData.filter(officer => {
                  const shift = getShiftForDate(officer.shifts, date.day, date.month);
                  return shift === 'M';
                }).length;
                return (
                  <td key={idx} className="px-1 py-1 text-center border-r border-gray-200 font-bold text-black">
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