'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SchedulePage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('January');
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const officers = [
    { key: 'sulaeman', name: 'Sulaeman' },
    { key: 'goldie', name: 'Goldie' },
    { key: 'zakiy', name: 'Zakiy' },
    { key: 'hakim', name: 'Hakim' },
    { key: 'vini', name: 'Vini' },
    { key: 'ronaldo', name: 'Ronaldo' }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading) {
      fetchSchedules();
    }
  }, [mounted, authLoading]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/schedules');
      const data = await res.json();
      
      if (data.success) {
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter berdasarkan bulan yang dipilih
  const filteredSchedules = schedules.filter(s => {
    if (!s.dateRundown) return false;
    const month = s.monthRundown || '';
    return month.toLowerCase() === selectedMonth.toLowerCase();
  }).sort((a, b) => {
    // Urutkan berdasarkan tanggal
    return new Date(a.dateRundown) - new Date(b.dateRundown);
  });

  const getShiftStyle = (shift) => {
    const s = (shift || '').toUpperCase();
    switch(s) {
      case 'HOTEL': return 'background-color: #DBEAFE; color: #1E40AF;'; // blue
      case 'ALPHA': return 'background-color: #DCFCE7; color: #166534;'; // green
      case 'OFF': return 'background-color: #F3F4F6; color: #1F2937;'; // gray
      case 'CUTI': return 'background-color: #FEF9C3; color: #854D0E;'; // yellow
      case 'SAKIT': return 'background-color: #FEE2E2; color: #991B1B;'; // red
      case 'FOXTROT': return 'background-color: #F3E8FF; color: #6B21A8;'; // purple
      case 'LAUNDRY': return 'background-color: #FFEDD5; color: #9A3412;'; // orange
      case 'M': return 'background-color: #E0E7FF; color: #3730A3;'; // indigo
      case 'P': return 'background-color: #FCE7F3; color: #9D174D;'; // pink
      default: return 'background-color: #F9FAFB; color: #4B5563;';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const getDayName = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { weekday: 'long' });
    } catch {
      return '';
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
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← BACK TO DASHBOARD
        </Link>
      </div>

      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-black">SCHEDULE GROUP X 2026</h1>
          <p className="text-xs text-gray-500">
            {isAdmin ? 'Klik "Edit" untuk ubah jadwal di Google Sheets' : 'Staff view only'}
          </p>
        </div>
        
        {/* MONTH SELECTOR - DIPINDAH KE ATAS */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Bulan:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm font-medium bg-white"
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
          
          {isAdmin && (
            <a
              href="https://docs.google.com/spreadsheets/d/1Ry3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm font-medium"
            >
              Edit
            </a>
          )}
        </div>
      </div>

      {/* SCHEDULE TABLE - SEPERTI EXCEL */}
      <div className="border border-gray-300 rounded overflow-x-auto bg-white">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-3 py-2 text-left font-bold text-black border-r border-gray-300" rowSpan="2">Tanggal</th>
              <th className="px-3 py-2 text-left font-bold text-black border-r border-gray-300" rowSpan="2">Hari</th>
              <th className="px-3 py-2 text-center font-bold text-black border-r border-gray-300" colSpan={officers.length}>Officers</th>
              <th className="px-3 py-2 text-left font-bold text-black" rowSpan="2">Catatan</th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300">
              {officers.map(officer => (
                <th key={officer.key} className="px-3 py-2 text-left font-medium text-black border-r border-gray-300">
                  {officer.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((schedule, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-3 py-2 border-r border-gray-200 text-black">
                    {formatDate(schedule.dateRundown)}
                  </td>
                  <td className="px-3 py-2 border-r border-gray-200 text-black">
                    {getDayName(schedule.dateRundown)}
                  </td>
                  
                  {officers.map(officer => (
                    <td key={officer.key} className="px-3 py-2 border-r border-gray-200">
                      <div 
                        className="px-2 py-1 rounded text-xs font-medium text-center"
                        style={{ backgroundColor: getShiftStyle(schedule.officers[officer.key]).match(/background-color: ([^;]+)/)?.[1] }}
                      >
                        {schedule.officers[officer.key] || '-'}
                      </div>
                    </td>
                  ))}
                  
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {schedule.notes || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3 + officers.length} className="px-3 py-8 text-center text-black">
                  Tidak ada jadwal untuk bulan {selectedMonth}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LEGEND - DI BAWAH */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-300 rounded text-xs">
        <div className="flex flex-wrap gap-3">
          <span><span className="inline-block w-3 h-3 bg-blue-100 rounded"></span> HOTEL</span>
          <span><span className="inline-block w-3 h-3 bg-green-100 rounded"></span> ALPHA</span>
          <span><span className="inline-block w-3 h-3 bg-gray-200 rounded"></span> OFF</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-100 rounded"></span> CUTI</span>
          <span><span className="inline-block w-3 h-3 bg-red-100 rounded"></span> SAKIT</span>
          <span><span className="inline-block w-3 h-3 bg-purple-100 rounded"></span> FOXTROT</span>
          <span><span className="inline-block w-3 h-3 bg-orange-100 rounded"></span> LAUNDRY</span>
          <span><span className="inline-block w-3 h-3 bg-indigo-100 rounded"></span> M</span>
          <span><span className="inline-block w-3 h-3 bg-pink-100 rounded"></span> P</span>
        </div>
      </div>
    </div>
  );
}