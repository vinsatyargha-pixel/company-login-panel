'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LaundryAllowancePage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];
  const LAUNDRY_RATE = 15; // Fixed $15 per month

  // ===========================================
  // FUNGSI GET PERIOD (21 PREV MONTH - 20 CURRENT MONTH)
  // ===========================================
  const getPeriod = (month, year) => {
    const monthIndex = months.indexOf(month);
    
    if (monthIndex === 0) { // January
      return {
        start: `${parseInt(year) - 1}-12-21`,
        end: `${year}-01-20`,
        label: `21 December ${parseInt(year) - 1} - 20 January ${year}`
      };
    } else {
      return {
        start: `${year}-${String(monthIndex).padStart(2, '0')}-21`,
        end: `${year}-${String(monthIndex + 1).padStart(2, '0')}-20`,
        label: `21 ${months[monthIndex - 1]} ${year} - 20 ${month} ${year}`
      };
    }
  };

  // ===========================================
  // FETCH OFFICERS
  // ===========================================
  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .in('status', ['REGULAR', 'TRAINING']) // Hanya REGULAR & TRAINING
        .order('full_name', { ascending: true });

      if (error) throw error;

      setOfficers(data || []);
    } catch (error) {
      console.error('Error fetching officers:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // FILTER & SEARCH
  // ===========================================
  const filteredOfficers = officers.filter(officer => 
    officer.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const period = getPeriod(selectedMonth, selectedYear);

  // ===========================================
  // RENDER
  // ===========================================
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      {/* Header with Back button */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link 
          href="/dashboard/financial" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Financial</span>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#FFD700]">🧺 LAUNDRY ALLOWANCE</h1>
          <p className="text-[#A7D8FF] mt-1">
            {isAdmin ? '👑 Admin Mode' : '👤 Staff Mode'} - Fixed $15 per month
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        
        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        
        <input
          type="text"
          placeholder="Search name..."
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1 min-w-[200px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Period Info */}
      <div className="mb-6 p-4 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30">
        <div className="flex items-center gap-2 text-[#FFD700]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">Periode: {period.label}</span>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Officers</div>
          <div className="text-2xl font-bold text-[#FFD700]">{filteredOfficers.length}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Rate per Officer</div>
          <div className="text-2xl font-bold text-green-400">${LAUNDRY_RATE}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Amount</div>
          <div className="text-2xl font-bold text-[#FFD700]">
            ${filteredOfficers.length * LAUNDRY_RATE}
          </div>
        </div>
      </div>

      {/* Officers List */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30">
          <h2 className="text-xl font-bold text-[#FFD700]">
            Eligible Officers (REGULAR / TRAINING)
          </h2>
        </div>
        
        {filteredOfficers.length > 0 ? (
          <div className="divide-y divide-[#FFD700]/30">
            {filteredOfficers.map((officer) => (
              <div key={officer.id} className="p-4 hover:bg-[#0B1A33]/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#FFD700]">{officer.full_name}</div>
                    <div className="text-sm text-[#A7D8FF] mt-1">
                      {officer.department} • {officer.status}
                    </div>
                    {officer.join_date && (
                      <div className="text-xs text-[#A7D8FF] mt-1">
                        Join: {new Date(officer.join_date).toLocaleDateString('id-ID')}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">${LAUNDRY_RATE}</div>
                    <div className="text-xs text-[#A7D8FF] mt-1">
                      {selectedMonth} {selectedYear}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#A7D8FF]">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-lg">Tidak ada officer dengan status REGULAR atau TRAINING</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg flex justify-between items-center">
        <span className="text-[#FFD700] font-bold">
          Total Officers: {filteredOfficers.length}
        </span>
        <span className="text-[#FFD700] font-bold">
          Total Laundry: ${filteredOfficers.length * LAUNDRY_RATE}
        </span>
      </div>
    </div>
  );
}