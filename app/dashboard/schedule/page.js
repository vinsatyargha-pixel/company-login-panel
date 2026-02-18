// app/dashboard/schedule/page.js
'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// MAP WARNA BG SESUAI PERMINTAAN LO
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
  'default': 'bg-white text-gray-300' // Untuk HOTEL/ALPHA/FOXTROT/LAUNDRY (disembunyikan)
};

// Filter kode valid (yang boleh tampil)
const validShifts = ['P', 'M', 'S', 'OFF', 'SAKIT', 'IZIN', 'ABSEN', 'CUTI', 
                     'SPECIAL', 'UNPAID LEAVE', 'DIRUMAHKAN', 'RESIGN', 
                     'TERMINATED', 'BELUM JOIN'];

const getShiftStyle = (shift) => {
  if (!shift || shift.trim() === '' || !validShifts.includes(shift)) {
    return shiftStyles.default; // Kode ga valid jadi kosong
  }
  return shiftStyles[shift] || shiftStyles.default;
};

export default function SchedulePage() {
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [monthBefore, setMonthBefore] = useState('January');
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2026', '2027', '2028', '2029', '2030']; // Bisa ditambah

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
        // Transform data dari API ke format tabel
        const transformedData = transformScheduleData(result.data);
        setScheduleData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const transformScheduleData = (rawData) => {
    // Ini fungsi buat nge-transform data dari RUNDOWN
    // ke format yang sama dengan DASHBOARD SCHEDULE
    // (nanti gue bikin lengkap)
    return [];
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

      {/* SCHEDULE TABLE (STRUCTURE SAMA DENGAN DASHBOARD SCHEDULE) */}
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
            {/* DATA OFFICER AKAN MUNCUL DISINI */}
            {/* PASTIKAN OFFICER DENGAN DEPARTMENT CS DP WD SAJA */}
          </tbody>
        </table>
      </div>
    </div>
  );
}