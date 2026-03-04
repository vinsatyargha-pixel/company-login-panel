'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LaundryAllowancePage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentStatus, setPaymentStatus] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];
  const LAUNDRY_RATE = 15;

  // ===========================================
  // AUTO-SELECT BULAN BERDASARKAN TANGGAL (CUTOFF 20)
  // ===========================================
  const getCurrentMonthByCutoff = () => {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (currentDate > 20) {
      // Bulan depan
      let nextMonthIndex = currentMonthIndex + 1;
      let nextYear = currentYear;
      
      if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear = currentYear + 1;
      }
      
      return {
        month: months[nextMonthIndex],
        year: nextYear.toString()
      };
    } else {
      // Bulan sekarang
      return {
        month: months[currentMonthIndex],
        year: currentYear.toString()
      };
    }
  };

  // ===========================================
  // GET PERIOD
  // ===========================================
  const getPeriod = (month, year) => {
    const monthIndex = months.indexOf(month);
    
    if (monthIndex === 0) {
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
  // INITIAL SETUP - SET BULAN DULU
  // ===========================================
  useEffect(() => {
    const { month, year } = getCurrentMonthByCutoff();
    setSelectedMonth(month);
    setSelectedYear(year);
    setInitialLoad(false);
  }, []);

  // ===========================================
  // FETCH OFFICERS & PAYMENT STATUS
  // ===========================================
  useEffect(() => {
    if (!initialLoad) {
      // Tambahkan delay kecil untuk memastikan state bulan sudah terset
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedMonth, selectedYear, initialLoad]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setDataLoaded(false);
      
      // Tambahkan artificial delay untuk memastikan loading terlihat
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const period = getPeriod(selectedMonth, selectedYear);
      
      // 1. Ambil officers REGULAR & TRAINING
      const { data: officersData, error: officersError } = await supabase
        .from('officers')
        .select('*')
        .in('status', ['REGULAR', 'TRAINING'])
        .order('full_name', { ascending: true });

      if (officersError) throw officersError;

      // 2. Ambil status pembayaran laundry
      const { data: paymentData, error: paymentError } = await supabase
        .from('laundry_payments')
        .select('*')
        .eq('bulan', `${selectedMonth} ${selectedYear}`);

      if (paymentError) throw paymentError;

      // 3. Map status ke officer
      const statusMap = {};
      paymentData?.forEach(p => {
        statusMap[p.officer_id] = p.is_paid;
      });

      setOfficers(officersData || []);
      setPaymentStatus(statusMap);
      setDataLoaded(true);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // TOGGLE PAYMENT STATUS (HANYA ADMIN)
  // ===========================================
  const togglePayment = async (officerId, officerName, currentStatus) => {
    if (!isAdmin) {
      alert('Hanya admin yang bisa mengubah status pembayaran');
      return;
    }

    try {
      const newStatus = !currentStatus;
      const bulan = `${selectedMonth} ${selectedYear}`;
      const period = getPeriod(selectedMonth, selectedYear);

      // Simpan ke tabel laundry_payments
      const { error } = await supabase
        .from('laundry_payments')
        .upsert({
          officer_id: officerId,
          officer_name: officerName,
          bulan: bulan,
          periode_start: period.start,
          periode_end: period.end,
          amount: LAUNDRY_RATE,
          is_paid: newStatus,
          paid_at: newStatus ? new Date().toISOString() : null,
          paid_by: newStatus ? user?.email : null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'officer_id, bulan' });

      if (error) throw error;

      // Simpan ke audit_logs untuk recent activity
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'laundry_payments',
          record_id: officerId,
          action: 'UPDATE',
          new_data: { 
            officer_name: officerName,
            bulan: bulan,
            is_paid: newStatus,
            amount: LAUNDRY_RATE
          },
          changed_by: user?.email,
          changed_at: new Date().toISOString()
        });

      // Update state
      setPaymentStatus(prev => ({
        ...prev,
        [officerId]: newStatus
      }));

    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Gagal mengupdate status pembayaran');
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
  // RENDER LOADING STATE
  // ===========================================
  if (loading || initialLoad) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD700] border-t-transparent mb-4"></div>
        <div className="text-[#FFD700] text-lg font-semibold animate-pulse">
          {initialLoad ? 'Initializing...' : 'Loading laundry data...'}
        </div>
        <div className="text-[#A7D8FF] text-sm mt-2">
          {selectedMonth} {selectedYear}
        </div>
        <div className="mt-4 flex gap-2">
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link 
          href="/dashboard/financial" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Financial</span>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#FFD700]">🧺 LAUNDRY ALLOWANCE</h1>
          <p className="text-[#A7D8FF] mt-1">
            {isAdmin ? '👑 Admin Mode (bisa edit status)' : '👤 Staff Mode (read only)'}
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => fetchData()}
          className="bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        
        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        
        <input
          type="text"
          placeholder="Search name..."
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Period Info */}
      <div className="mb-6 p-4 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 animate-fadeIn">
        <div className="flex items-center gap-2 text-[#FFD700]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">Periode: {period.label}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Officers</div>
          <div className="text-2xl font-bold text-[#FFD700]">{filteredOfficers.length}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Sudah Dibayar</div>
          <div className="text-2xl font-bold text-green-400">
            {Object.values(paymentStatus).filter(v => v === true).length}
          </div>
        </div>

        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Belum Dibayar</div>
          <div className="text-2xl font-bold text-red-400">
            {filteredOfficers.length - Object.values(paymentStatus).filter(v => v === true).length}
          </div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Amount</div>
          <div className="text-2xl font-bold text-[#FFD700]">
            ${filteredOfficers.length * LAUNDRY_RATE}
          </div>
        </div>
      </div>

      {/* Officers List with Payment Status */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#FFD700]">
            Eligible Officers (REGULAR / TRAINING)
          </h2>
          {dataLoaded && (
            <span className="text-xs text-[#A7D8FF]">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {filteredOfficers.length > 0 ? (
          <div className="divide-y divide-[#FFD700]/30">
            {filteredOfficers.map((officer, index) => {
              const isPaid = paymentStatus[officer.id] || false;
              
              return (
                <div 
                  key={officer.id} 
                  className="p-4 hover:bg-[#0B1A33]/50 transition-all duration-300 animate-slideIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-[#FFD700]">{officer.full_name}</div>
                      <div className="text-sm text-[#A7D8FF] mt-1">
                        {officer.department} • {officer.status}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      {/* Amount */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-400">${LAUNDRY_RATE}</div>
                        <div className="text-xs text-[#A7D8FF]">{selectedMonth} {selectedYear}</div>
                      </div>

                      {/* Status Badge */}
                      <div className="w-24 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-medium border border-red-500/30">
                            <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                            UNPAID
                          </span>
                        )}
                      </div>

                      {/* Toggle Button (Admin Only) */}
                      {isAdmin && (
                        <button
                          onClick={() => togglePayment(officer.id, officer.full_name, isPaid)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                            isPaid 
                              ? 'bg-green-500 text-white shadow-[0_0_20px_#10b981] border-2 border-green-400 hover:bg-green-600 hover:scale-105' 
                              : 'bg-gray-600 text-gray-300 hover:bg-gray-700 border-2 border-transparent hover:scale-105'
                          }`}
                        >
                          {isPaid ? 'PAID ✓' : 'Mark Paid'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-[#A7D8FF] animate-fadeIn">
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
        <div className="flex gap-4">
          <span className="text-green-400 font-bold">
            Paid: ${Object.values(paymentStatus).filter(v => v).length * LAUNDRY_RATE}
          </span>
          <span className="text-red-400 font-bold">
            Unpaid: ${(filteredOfficers.length - Object.values(paymentStatus).filter(v => v).length) * LAUNDRY_RATE}
          </span>
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}