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
  const [officers, setOfficers] = useState([
    { key: 'sulaeman', name: 'Sulaeman' },
    { key: 'goldie', name: 'Goldie' },
    { key: 'zakiy', name: 'Zakiy' },
    { key: 'hakim', name: 'Hakim' },
    { key: 'vini', name: 'Vini' },
    { key: 'ronaldo', name: 'Ronaldo' }
  ]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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
      } else {
        console.error('Failed to fetch:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getShiftColor = (shift) => {
    const s = (shift || '').toUpperCase();
    switch(s) {
      case 'HOTEL': return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
      case 'ALPHA': return 'bg-green-100 text-green-800 border-l-4 border-green-500';
      case 'OFF': return 'bg-gray-100 text-gray-800 border-l-4 border-gray-400';
      case 'CUTI': return 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500';
      case 'SAKIT': return 'bg-red-100 text-red-800 border-l-4 border-red-500';
      case 'FOXTROT': return 'bg-purple-100 text-purple-800 border-l-4 border-purple-500';
      case 'LAUNDRY': return 'bg-orange-100 text-orange-800 border-l-4 border-orange-500';
      case 'M': return 'bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500';
      case 'P': return 'bg-pink-100 text-pink-800 border-l-4 border-pink-500';
      default: return 'bg-gray-50 text-gray-600 border-l-4 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
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

  const filteredSchedules = schedules.filter(s => {
    if (!s.dateRundown) return false;
    const month = s.monthRundown || '';
    return month.toLowerCase() === selectedMonth.toLowerCase();
  });

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
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-2xl font-bold text-black">SCHEDULE GROUP X 2026</h1>
        <p className="text-gray-600 text-sm mt-1">
          {isAdmin ? 'Admin dapat mengelola jadwal (edit via Google Sheets)' : 'Staff hanya dapat melihat jadwal'}
        </p>
      </div>

      {/* MONTH SELECTOR */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
          {months.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                selectedMonth === month 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* ADMIN BUTTON */}
      {isAdmin && (
        <div className="mb-4">
          <a
            href="https://docs.google.com/spreadsheets/d/1Ry3CioVKz96SqTPH3ZntSMp9wcTRDnx47AoUclojCuIFkhclspY93Pa9Jmoki4DDBJzk3ThjDnu10M/edit"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Jadwal di Google Sheets
          </a>
        </div>
      )}

      {/* SCHEDULE TABLE */}
      <div className="border border-gray-300 rounded-lg overflow-x-auto bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-black">Tanggal</th>
              <th className="px-4 py-3 text-left font-bold text-black">Hari</th>
              {officers.map(officer => (
                <th key={officer.key} className="px-4 py-3 text-left font-bold text-black">
                  {officer.name}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-bold text-black">Catatan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSchedules.length > 0 ? (
              filteredSchedules.map((schedule, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-black">
                    {formatDate(schedule.dateRundown)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-black">
                    {getDayName(schedule.dateRundown)}
                  </td>
                  
                  {officers.map(officer => (
                    <td key={officer.key} className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium block ${getShiftColor(schedule.officers[officer.key])}`}>
                        {schedule.officers[officer.key] || '-'}
                      </span>
                    </td>
                  ))}
                  
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                    {schedule.notes || '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2 + officers.length + 1} className="px-4 py-8 text-center text-black">
                  No schedule found for {selectedMonth}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* LEGEND */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
        <h3 className="font-bold text-black mb-3">Keterangan Shift:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium border-l-4 border-blue-500">HOTEL</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium border-l-4 border-green-500">ALPHA</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium border-l-4 border-gray-400">OFF</span>
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium border-l-4 border-yellow-500">CUTI</span>
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium border-l-4 border-red-500">SAKIT</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium border-l-4 border-purple-500">FOXTROT</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium border-l-4 border-orange-500">LAUNDRY</span>
          <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium border-l-4 border-indigo-500">M</span>
          <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded text-xs font-medium border-l-4 border-pink-500">P</span>
        </div>
      </div>
    </div>
  );
}