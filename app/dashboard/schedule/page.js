'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SchedulePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [monthBefore, setMonthBefore] = useState('January');
  const [dashboardData, setDashboardData] = useState([]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const officers = [
    { name: 'Sulaeman', key: 'sulaeman' },
    { name: 'Goldie Mountana', key: 'goldie' },
    { name: 'Achmad Naufal Zakiy', key: 'zakiy' },
    { name: 'Mushollina Nul Hakim', key: 'hakim' },
    { name: 'Lie Fung Kien (Vini)', key: 'vini' },
    { name: 'Ronaldo Ichwan', key: 'ronaldo' }
  ];

  const getDateColumns = () => {
    const columns = [];
    for (let day = 21; day <= 31; day++) {
      columns.push({ day, month: monthBefore, type: 'prev' });
    }
    for (let day = 1; day <= 20; day++) {
      columns.push({ day, month: selectedMonth, type: 'current' });
    }
    return columns;
  };

  const dateColumns = getDateColumns();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      fetchSchedules();
    }
  }, [mounted, authLoading]);

  useEffect(() => {
    const currentIndex = months.indexOf(selectedMonth);
    const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setMonthBefore(months[prevIndex]);
  }, [selectedMonth]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/schedules');
      const data = await res.json();
      
      if (data.success) {
        setSchedules(data.data);
        processDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processDashboardData = (rawData) => {
    const filteredData = rawData.filter(item => {
      const itemMonth = item.monthRundown;
      return itemMonth === selectedMonth || itemMonth === monthBefore;
    });

    const officerMap = {};
    officers.forEach(officer => {
      officerMap[officer.name] = {
        name: officer.name,
        shifts: {},
        joinDate: '',
        nationality: '',
        prorate: 0
      };
    });

    filteredData.forEach(item => {
      const date = new Date(item.dateRundown);
      const day = date.getDate();
      const month = item.monthRundown;
      const dateKey = `${month}-${day}`;
      
      officers.forEach(officer => {
        const shift = item.officers[officer.key];
        if (shift && officerMap[officer.name]) {
          officerMap[officer.name].shifts[dateKey] = shift;
        }
      });
    });

    const dashboard = Object.values(officerMap).map(officer => {
      const totals = {
        OFF: 0, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0,
        SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0,
        RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0
      };

      dateColumns.forEach(col => {
        const dateKey = `${col.month}-${col.day}`;
        const shift = officer.shifts[dateKey] || '';
        
        if (shift === 'OFF') totals.OFF++;
        else if (shift === 'SAKIT') totals.SAKIT++;
        else if (shift === 'IZIN') totals.IZIN++;
        else if (shift === 'ABSEN') totals.ABSEN++;
        else if (shift === 'CUTI') totals.CUTI++;
        else if (shift === 'SPECIAL') totals.SPECIAL++;
        else if (shift === 'UNPAID LEAVE') totals['UNPAID LEAVE']++;
        else if (shift === 'DIRUMAHKAN') totals.DIRUMAHKAN++;
        else if (shift === 'RESIGN') totals.RESIGN++;
        else if (shift === 'TERMINATED') totals.TERMINATED++;
        else if (shift === 'BELUM JOIN') totals['BELUM JOIN']++;
      });

      return {
        ...officer,
        totals
      };
    });

    setDashboardData(dashboard);
  };

  const getShiftForDate = (officerName, dateCol) => {
    const dateKey = `${dateCol.month}-${dateCol.day}`;
    const officer = dashboardData.find(o => o.name === officerName);
    return officer?.shifts[dateKey] || '';
  };

  const getShiftStyle = (shift) => {
    switch(shift) {
      case 'P': return 'bg-blue-100 text-blue-800 font-bold';
      case 'M': return 'bg-purple-100 text-purple-800 font-bold';
      case 'OFF': return 'bg-gray-200 text-gray-800';
      case 'SAKIT': return 'bg-red-100 text-red-800';
      case 'CUTI': return 'bg-yellow-100 text-yellow-800';
      case 'HOTEL': return 'bg-green-100 text-green-800';
      case 'ALPHA': return 'bg-indigo-100 text-indigo-800';
      case 'FOXTROT': return 'bg-pink-100 text-pink-800';
      default: return 'bg-white text-gray-700';
    }
  };

  const totalColumns = [
    'OFF', 'SAKIT', 'IZIN', 'ABSEN', 'CUTI', 'SPECIAL',
    'UNPAID LEAVE', 'DIRUMAHKAN', 'RESIGN', 'TERMINATED', 'BELUM JOIN'
  ];

  if (!mounted || authLoading || loading) {
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

      {/* HEADER TITLE */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-black">X-GROUP SCHEDULE 2026</h1>
        <div className="text-sm text-gray-600">Years: 2026</div>
      </div>

      {/* MONTH SELECTOR */}
      <div className="mb-4 p-3 bg-gray-50 border border-gray-300 rounded flex items-center gap-4">
        <span className="font-medium text-black">Pilih Bulan (AB6):</span>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm bg-white text-black"
        >
          {months.map(month => (
            <option key={month} value={month} className="text-black">{month}</option>
          ))}
        </select>
        <div className="ml-auto text-sm text-black">
          <span className="mr-4">Month Before (J6): <span className="font-medium">{monthBefore}</span></span>
          <span>Month Now (AB6): <span className="font-medium">{selectedMonth}</span></span>
        </div>
        {isAdmin && (
          <a
            href="https://docs.google.com/spreadsheets/d/1kwG6M-Va4TDxYCzfdya2ELVQQfk6QoD-1SPJUdIdIkA/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
          >
            Edit
          </a>
        )}
      </div>

      {/* DASHBOARD TABLE */}
      <div className="border border-gray-300 rounded overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-xs border-collapse">
          <thead>
            {/* Header utama - TAMBAH TEXT-BLACK */}
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">No</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">NATIONALITY</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">JOIN DATE</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">OFFICER NAME</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">PRORATE</th>
              <th className="px-2 py-1 text-left font-bold text-black border-r border-gray-300" rowSpan="2">DAY</th>
              <th className="px-2 py-1 text-center font-bold text-black border-r border-gray-300" colSpan={dateColumns.length}>DATES</th>
              <th className="px-2 py-1 text-center font-bold text-black" colSpan={totalColumns.length}>TOTAL</th>
            </tr>
            
            {/* Header tanggal - TAMBAH TEXT-BLACK */}
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
            {/* Data per officer - TAMBAH TEXT-BLACK */}
            {officers.map((officer, rowIdx) => {
              const officerData = dashboardData.find(d => d.name === officer.name) || { totals: {} };
              
              return (
                <tr key={rowIdx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{rowIdx + 1}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-black">-</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-black">-</td>
                  <td className="px-2 py-1 border-r border-gray-200 font-medium text-black">{officer.name}</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center text-black">0</td>
                  <td className="px-2 py-1 border-r border-gray-200 text-center text-black">-</td>
                  
                  {/* Shift per tanggal - text-black sudah include di getShiftStyle */}
                  {dateColumns.map((date, idx) => {
                    const shift = getShiftForDate(officer.name, date);
                    return (
                      <td key={idx} className={`px-1 py-1 border-r border-gray-200 text-center ${getShiftStyle(shift)}`}>
                        {shift || '-'}
                      </td>
                    );
                  })}
                  
                  {/* Totals - TAMBAH TEXT-BLACK */}
                  {totalColumns.map((col, idx) => (
                    <td key={idx} className="px-2 py-1 border-r border-gray-200 text-right font-medium text-black">
                      {officerData.totals?.[col] || 0}
                    </td>
                  ))}
                </tr>
              );
            })}
            
            {/* Baris Total PAGI/SIANG/MALAM - TAMBAH TEXT-BLACK */}
            <tr className="bg-gray-50 font-bold border-t border-gray-300">
              <td colSpan="6" className="px-2 py-1 text-right text-black">TOTAL OFFICER PER DAY</td>
              <td colSpan={dateColumns.length} className="px-2 py-1"></td>
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            {/* Hitung total PAGI per tanggal - TAMBAH TEXT-BLACK */}
            <tr>
              <td colSpan="6" className="px-2 py-1 text-right text-black">PAGI</td>
              {dateColumns.map((_, idx) => {
                const pagiCount = officers.filter(officer => {
                  const shift = getShiftForDate(officer.name, dateColumns[idx]);
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
            
            {/* Hitung total SIANG per tanggal - TAMBAH TEXT-BLACK */}
            <tr>
              <td colSpan="6" className="px-2 py-1 text-right text-black">SIANG</td>
              {dateColumns.map((_, idx) => {
                const siangCount = officers.filter(officer => {
                  const shift = getShiftForDate(officer.name, dateColumns[idx]);
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
            
            {/* Hitung total MALAM per tanggal - TAMBAH TEXT-BLACK */}
            <tr>
              <td colSpan="6" className="px-2 py-1 text-right text-black">MALAM</td>
              {dateColumns.map((_, idx) => {
                const malamCount = officers.filter(officer => {
                  const shift = getShiftForDate(officer.name, dateColumns[idx]);
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

      {/* LEGEND - TAMBAH TEXT-BLACK */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded text-xs">
        <div className="flex flex-wrap gap-4 text-black">
          <span><span className="inline-block w-3 h-3 bg-blue-100"></span> P = PAGI</span>
          <span><span className="inline-block w-3 h-3 bg-purple-100"></span> M = MALAM</span>
          <span><span className="inline-block w-3 h-3 bg-gray-200"></span> OFF</span>
          <span><span className="inline-block w-3 h-3 bg-red-100"></span> SAKIT</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-100"></span> CUTI</span>
          <span><span className="inline-block w-3 h-3 bg-green-100"></span> HOTEL</span>
          <span><span className="inline-block w-3 h-3 bg-indigo-100"></span> ALPHA</span>
          <span><span className="inline-block w-3 h-3 bg-pink-100"></span> FOXTROT</span>
        </div>
      </div>
    </div>
  );
}