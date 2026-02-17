'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SchedulePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [monthBefore, setMonthBefore] = useState('January');
  
  // DATA LENGKAP dari screenshot lo
  const scheduleData = [
    {
      no: 1,
      nationality: '',
      joinDate: '01-May-2023',
      officerName: 'Lie Fung Kien (Vini)',
      prorate: 0,
      day: 26,
      shifts: {
        '21': 'P', '22': 'P', '23': 'P', '24': 'P', '25': 'P', '26': 'P', '27': 'P', '28': 'P', '29': 'P', '30': 'P', '31': 'P',
        '1': 'P', '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', '11': 'P', '12': 'P', '13': 'P', '14': 'P', '15': 'P', '16': 'P', '17': 'P', '18': 'P', '19': 'P', '20': 'P'
      },
      totals: { OFF: 4, SAKIT: 1, IZIN: 0, ABSEN: 0, CUTI: 6, SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0 }
    },
    {
      no: 2,
      nationality: '',
      joinDate: '01-Apr-2024',
      officerName: 'Ronaldo Ichwan',
      prorate: 0,
      day: 27,
      shifts: {
        '21': 'P', '22': 'P', '23': 'P', '24': 'P', '25': 'P', '26': 'P', '27': 'P', '28': 'P', '29': 'P', '30': 'P', '31': 'P',
        '1': 'P', '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', '11': 'P', '12': 'P', '13': 'P', '14': 'P', '15': 'P', '16': 'P', '17': 'P', '18': 'P', '19': 'P', '20': 'P'
      },
      totals: { OFF: 4, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0, SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0 }
    },
    {
      no: 3,
      nationality: '',
      joinDate: '28-Mar-2022',
      officerName: 'Mushollina Nul Hakim',
      prorate: 0,
      day: 27,
      shifts: {
        '21': 'P', '22': 'P', '23': 'P', '24': 'P', '25': 'P', '26': 'P', '27': 'P', '28': 'P', '29': 'P', '30': 'P', '31': 'P',
        '1': 'P', '2': 'P', '3': 'P', '4': 'P', '5': 'P', '6': 'P', '7': 'P', '8': 'P', '9': 'P', '10': 'P', '11': 'P', '12': 'P', '13': 'P', '14': 'P', '15': 'P', '16': 'P', '17': 'P', '18': 'P', '19': 'P', '20': 'P'
      },
      totals: { OFF: 4, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0, SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0 }
    },
    {
      no: 4,
      nationality: '',
      joinDate: '23-Mar-2021',
      officerName: 'Sulaeman',
      prorate: 0,
      day: 27,
      shifts: {
        '21': 'M', '22': 'M', '23': 'M', '24': 'M', '25': 'M', '26': 'M', '27': 'M', '28': 'M', '29': 'M', '30': 'M', '31': 'M',
        '1': 'M', '2': 'M', '3': 'M', '4': 'M', '5': 'M', '6': 'M', '7': 'M', '8': 'M', '9': 'M', '10': 'M', '11': 'M', '12': 'M', '13': 'M', '14': 'M', '15': 'M', '16': 'M', '17': 'M', '18': 'M', '19': 'M', '20': 'M'
      },
      totals: { OFF: 4, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0, SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0 }
    },
    {
      no: 5,
      nationality: '',
      joinDate: '13-May-2024',
      officerName: 'Goldie Mountana',
      prorate: 0,
      day: 27,
      shifts: {
        '21': 'M', '22': 'M', '23': 'M', '24': 'M', '25': 'M', '26': 'M', '27': 'M', '28': 'M', '29': 'M', '30': 'M', '31': 'M',
        '1': 'M', '2': 'M', '3': 'M', '4': 'M', '5': 'M', '6': 'M', '7': 'M', '8': 'M', '9': 'M', '10': 'M', '11': 'M', '12': 'M', '13': 'M', '14': 'M', '15': 'M', '16': 'M', '17': 'M', '18': 'M', '19': 'M', '20': 'M'
      },
      totals: { OFF: 4, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0, SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0 }
    },
    {
      no: 6,
      nationality: '',
      joinDate: '18-Sep-2022',
      officerName: 'Achmad Naufal Zakiy',
      prorate: 0,
      day: 27,
      shifts: {
        '21': 'M', '22': 'M', '23': 'M', '24': 'M', '25': 'M', '26': 'M', '27': 'M', '28': 'M', '29': 'M', '30': 'M', '31': 'M',
        '1': 'M', '2': 'M', '3': 'M', '4': 'M', '5': 'M', '6': 'M', '7': 'M', '8': 'M', '9': 'M', '10': 'M', '11': 'M', '12': 'M', '13': 'M', '14': 'M', '15': 'M', '16': 'M', '17': 'M', '18': 'M', '19': 'M', '20': 'M'
      },
      totals: { OFF: 4, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0, SPECIAL: 0, 'UNPAID LEAVE': 0, DIRUMAHKAN: 0, RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0 }
    }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  const dateColumns = getDateColumns();

  const totalColumns = [
    'OFF', 'SAKIT', 'IZIN', 'ABSEN', 'CUTI', 'SPECIAL',
    'UNPAID LEAVE', 'DIRUMAHKAN', 'RESIGN', 'TERMINATED', 'BELUM JOIN'
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      setLoading(false);
    }
  }, [mounted, authLoading]);

  useEffect(() => {
    const currentIndex = months.indexOf(selectedMonth);
    const prevIndex = currentIndex === 0 ? 11 : currentIndex - 1;
    setMonthBefore(months[prevIndex]);
  }, [selectedMonth]);

  const getShiftStyle = (shift) => {
    switch(shift) {
      case 'P': return 'bg-blue-100 text-blue-800 font-bold';
      case 'M': return 'bg-purple-100 text-purple-800 font-bold';
      case 'OFF': return 'bg-gray-200 text-gray-800';
      case 'SAKIT': return 'bg-red-100 text-red-800';
      case 'CUTI': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-white text-gray-700';
    }
  };

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
            {/* Header utama */}
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
            
            {/* Header tanggal */}
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
            {/* Data per officer */}
            {scheduleData.map((officer) => (
              <tr key={officer.no} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{officer.no}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-black">{officer.nationality}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-black">{officer.joinDate}</td>
                <td className="px-2 py-1 border-r border-gray-200 font-medium text-black">{officer.officerName}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{officer.prorate}</td>
                <td className="px-2 py-1 border-r border-gray-200 text-center text-black">{officer.day}</td>
                
                {/* Shift per tanggal */}
                {dateColumns.map((date, idx) => {
                  const shift = officer.shifts[date.day] || '-';
                  return (
                    <td key={idx} className={`px-1 py-1 border-r border-gray-200 text-center ${getShiftStyle(shift)} text-black`}>
                      {shift}
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
              <td colSpan="6" className="px-2 py-1 text-right text-black">TOTAL OFFICER PER DAY</td>
              <td colSpan={dateColumns.length} className="px-2 py-1"></td>
              <td colSpan={totalColumns.length} className="px-2 py-1"></td>
            </tr>
            
            {/* Hitung total PAGI per tanggal */}
            <tr>
              <td colSpan="6" className="px-2 py-1 text-right text-black">PAGI</td>
              {dateColumns.map((_, idx) => {
                const pagiCount = scheduleData.filter(officer => {
                  const shift = officer.shifts[dateColumns[idx].day];
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
            
            {/* Hitung total SIANG per tanggal */}
            <tr>
              <td colSpan="6" className="px-2 py-1 text-right text-black">SIANG</td>
              {dateColumns.map((_, idx) => {
                const siangCount = scheduleData.filter(officer => {
                  const shift = officer.shifts[dateColumns[idx].day];
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
            
            {/* Hitung total MALAM per tanggal */}
            <tr>
              <td colSpan="6" className="px-2 py-1 text-right text-black">MALAM</td>
              {dateColumns.map((_, idx) => {
                const malamCount = scheduleData.filter(officer => {
                  const shift = officer.shifts[dateColumns[idx].day];
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

      {/* LEGEND - CLEAN */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded text-xs">
        <div className="flex flex-wrap gap-4 text-black">
          <span><span className="inline-block w-3 h-3 bg-blue-100"></span> P = PAGI</span>
          <span><span className="inline-block w-3 h-3 bg-purple-100"></span> M = MALAM</span>
          <span><span className="inline-block w-3 h-3 bg-gray-200"></span> OFF</span>
          <span><span className="inline-block w-3 h-3 bg-red-100"></span> SAKIT</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-100"></span> CUTI</span>
        </div>
      </div>
    </div>
  );
}