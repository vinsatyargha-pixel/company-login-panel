'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MealAllowancePage() {
  const { user, userJobRole, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [mealRates, setMealRates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDept, setSelectedDept] = useState('All');
  const [scheduleData, setScheduleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDepartments, setAvailableDepartments] = useState(['All', 'AM', 'CAPTAIN', 'CS DP WD']);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

  // Set department filter based on user role
  useEffect(() => {
    if (!isAdmin) {
      // Staff: only CS DP WD
      setAvailableDepartments(['CS DP WD']);
      setSelectedDept('CS DP WD');
    } else {
      // Admin: all departments
      setAvailableDepartments(['All', 'AM', 'CAPTAIN', 'CS DP WD']);
      setSelectedDept('All');
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      const { data: ratesData } = await supabase
        .from('meal_allowance')
        .select('*');
      
      const scheduleResponse = await fetch(
        `/api/schedule?year=${selectedYear}&month=${selectedMonth}`
      );
      const scheduleResult = await scheduleResponse.json();
      
      setOfficers(officersData || []);
      setMealRates(ratesData || []);
      setScheduleData(scheduleResult.data || []);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthsOfWork = (joinDate) => {
    const join = new Date(joinDate);
    const end = new Date(`${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, '0')}-20`);
    const years = end.getFullYear() - join.getFullYear();
    return (years * 12) + (end.getMonth() - join.getMonth());
  };

  const getMealRate = (department, joinDate) => {
    const monthsWorked = getMonthsOfWork(joinDate);
    
    if (department === 'AM' || department === 'CAPTAIN') {
      return mealRates.find(r => r.department === department);
    }
    
    if (department === 'CS DP WD') {
      if (monthsWorked >= 36) {
        return mealRates.find(r => r.department === department && r.years_of_service === 'genap 3 tahun keatas');
      } else if (monthsWorked >= 24) {
        return mealRates.find(r => r.department === department && r.years_of_service === 'genap 2 tahun keatas');
      } else {
        return mealRates.find(r => r.department === department && r.years_of_service === '1 tahun kebawah');
      }
    }
    return null;
  };

  const calculateOfficerStats = (officerName, department, joinDate) => {
    const targetMonth = months.indexOf(selectedMonth);
    
    const periodData = scheduleData.filter(day => {
      const dateStr = day['DATE RUNDOWN'];
      if (!dateStr) return false;
      
      const [dayNum, monthStr, yearStr] = dateStr.split('-');
      const date = new Date(`${monthStr} ${dayNum}, ${yearStr}`);
      const month = date.getMonth();
      const dateDay = date.getDate();
      
      if (targetMonth === 1) {
        if (month === 0 && dateDay >= 21) return true;
        if (month === 1 && dateDay <= 20) return true;
      }
      return false;
    });

    let offCount = 0, sakitCount = 0, cutiCount = 0, izinCount = 0;
    let unpaidCount = 0, alphaCount = 0;

    periodData.forEach(day => {
      const status = day[officerName];
      if (!status) return;
      
      switch(status) {
        case 'OFF': offCount++; break;
        case 'SAKIT': sakitCount++; break;
        case 'CUTI': cutiCount++; break;
        case 'IZIN': izinCount++; break;
        case 'UNPAID LEAVE': unpaidCount++; break;
        case 'ABSEN': alphaCount++; break;
      }
    });

    const rate = getMealRate(department, joinDate);
    const baseAmount = rate?.base_amount || 0;
    const prorate = rate?.prorate_per_day || 0;

    const offNotTaken = Math.max(0, 4 - offCount);
    const proratePlus = offNotTaken * prorate;
    const totalPotongan = (sakitCount + cutiCount + izinCount + unpaidCount) * prorate;
    const dendaAlpha = alphaCount * 50;
    const prorateMinus = totalPotongan + dendaAlpha;
    
    const umNet = Math.max(0, Math.round(baseAmount + proratePlus - prorateMinus));

    return {
      baseAmount,
      prorate,
      offCount,
      sakitCount,
      cutiCount,
      izinCount,
      unpaidCount,
      alphaCount,
      proratePlus,
      prorateMinus,
      umNet
    };
  };

  const formatBankAndRek = (bankAccount) => {
    if (!bankAccount) return { bank: '', rek: '' };
    
    let bank = '';
    let rek = bankAccount;
    
    if (bankAccount.includes('ABA')) {
      bank = 'ABA';
      rek = bankAccount.replace('ABA', '').trim();
    } else if (bankAccount.includes('ACLEDA')) {
      bank = 'ACLEDA';
      rek = bankAccount.replace('ACLEDA', '').trim();
    } else if (bankAccount.includes('WING BANK')) {
      bank = 'WING BANK';
      rek = bankAccount.replace('WING BANK', '').trim();
    } else if (bankAccount.includes('WING')) {
      bank = 'WING BANK';
      rek = bankAccount.replace('WING', '').trim();
    } else {
      const parts = bankAccount.split(' ');
      bank = parts[0] || '';
      rek = parts.slice(1).join(' ') || '';
    }
    
    return { bank, rek };
  };

  // Filter officers based on role and selected department
  const officersWithStats = officers
    .filter(o => {
      // Staff: only CS DP WD
      if (!isAdmin) {
        return o.department === 'CS DP WD';
      }
      // Admin: filter by selected department
      return selectedDept === 'All' || o.department === selectedDept;
    })
    .filter(o => o.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((officer) => {
      const stats = calculateOfficerStats(officer.full_name, officer.department, officer.join_date);
      const { bank, rek } = formatBankAndRek(officer.bank_account);
      return {
        ...officer,
        ...stats,
        bank_name: bank,
        rekening: rek
      };
    });

  const groupedOfficers = {
    'CS DP WD': officersWithStats.filter(o => o.department === 'CS DP WD'),
    'CAPTAIN': officersWithStats.filter(o => o.department === 'CAPTAIN'),
    'AM': officersWithStats.filter(o => o.department === 'AM')
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      {/* Header dengan Tombol Back */}
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700]">MEAL ALLOWANCE</h1>
          <p className="text-[#A7D8FF] mt-1">
            {isAdmin ? 'Admin View' : 'Staff View'} - {selectedMonth} {selectedYear}
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>

        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          disabled={!isAdmin}
        >
          {availableDepartments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search name..."
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1 min-w-[200px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* CS DP WD Section - Always show for staff, conditional for admin */}
      {groupedOfficers['CS DP WD'].length > 0 && (
        <div className="mb-8">
          <div className="bg-[#1A2F4A] p-3 rounded-t-lg border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700]">CS DP WD ({groupedOfficers['CS DP WD'].length})</h2>
          </div>
          <div className="border-x border-b border-[#FFD700]/30 rounded-b-lg overflow-hidden">
            {groupedOfficers['CS DP WD'].map((officer) => (
              <div key={officer.id} className="p-4 border-b border-[#FFD700]/30 last:border-b-0 hover:bg-[#1A2F4A]/50">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-full md:w-1/4">
                    <div className="font-bold text-[#FFD700]">{officer.full_name}</div>
                    <div className="text-xs text-[#A7D8FF]">Join: {new Date(officer.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Pokok:</span>
                      <div className="font-medium">${Math.round(officer.baseAmount)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Rate:</span>
                      <div className="font-medium">${Math.round(officer.prorate)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Holiday:</span>
                      <div className="font-medium">{Math.max(0, 4 - officer.offCount)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">C/U/S/I/A:</span>
                      <div className="font-medium">
                        {officer.cutiCount}/{officer.unpaidCount}/{officer.sakitCount}/{officer.izinCount}/{officer.alphaCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">NET:</span>
                      <div className="font-bold text-[#FFD700]">${Math.round(officer.umNet)}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/4 text-right">
                    <div className="text-[#A7D8FF] text-xs">{officer.bank_name}</div>
                    <div className="text-xs break-all">{officer.rekening}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CAPTAIN Section - Only for admin */}
      {isAdmin && groupedOfficers['CAPTAIN'].length > 0 && (
        <div className="mb-8">
          <div className="bg-[#1A2F4A] p-3 rounded-t-lg border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700]">CAPTAIN ({groupedOfficers['CAPTAIN'].length})</h2>
          </div>
          <div className="border-x border-b border-[#FFD700]/30 rounded-b-lg overflow-hidden">
            {groupedOfficers['CAPTAIN'].map((officer) => (
              <div key={officer.id} className="p-4 border-b border-[#FFD700]/30 last:border-b-0 hover:bg-[#1A2F4A]/50">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-full md:w-1/4">
                    <div className="font-bold text-[#FFD700]">{officer.full_name}</div>
                    <div className="text-xs text-[#A7D8FF]">Join: {new Date(officer.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Pokok:</span>
                      <div className="font-medium">${Math.round(officer.baseAmount)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Rate:</span>
                      <div className="font-medium">${Math.round(officer.prorate)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Holiday:</span>
                      <div className="font-medium">{Math.max(0, 4 - officer.offCount)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">C/U/S/I/A:</span>
                      <div className="font-medium">
                        {officer.cutiCount}/{officer.unpaidCount}/{officer.sakitCount}/{officer.izinCount}/{officer.alphaCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">NET:</span>
                      <div className="font-bold text-[#FFD700]">${Math.round(officer.umNet)}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/4 text-right">
                    <div className="text-[#A7D8FF] text-xs">{officer.bank_name}</div>
                    <div className="text-xs break-all">{officer.rekening}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AM Section - Only for admin */}
      {isAdmin && groupedOfficers['AM'].length > 0 && (
        <div className="mb-8">
          <div className="bg-[#1A2F4A] p-3 rounded-t-lg border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700]">AM ({groupedOfficers['AM'].length})</h2>
          </div>
          <div className="border-x border-b border-[#FFD700]/30 rounded-b-lg overflow-hidden">
            {groupedOfficers['AM'].map((officer) => (
              <div key={officer.id} className="p-4 border-b border-[#FFD700]/30 last:border-b-0 hover:bg-[#1A2F4A]/50">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-full md:w-1/4">
                    <div className="font-bold text-[#FFD700]">{officer.full_name}</div>
                    <div className="text-xs text-[#A7D8FF]">Join: {new Date(officer.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Pokok:</span>
                      <div className="font-medium">${Math.round(officer.baseAmount)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Rate:</span>
                      <div className="font-medium">${Math.round(officer.prorate)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">Holiday:</span>
                      <div className="font-medium">{Math.max(0, 4 - officer.offCount)}</div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">C/U/S/I/A:</span>
                      <div className="font-medium">
                        {officer.cutiCount}/{officer.unpaidCount}/{officer.sakitCount}/{officer.izinCount}/{officer.alphaCount}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#A7D8FF] text-xs">NET:</span>
                      <div className="font-bold text-[#FFD700]">${Math.round(officer.umNet)}</div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-1/4 text-right">
                    <div className="text-[#A7D8FF] text-xs">{officer.bank_name}</div>
                    <div className="text-xs break-all">{officer.rekening}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Total */}
      <div className="mt-6 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg flex justify-between items-center">
        <span className="text-[#FFD700] font-bold">
          Total Officers: {officersWithStats.length}
        </span>
        <span className="text-[#FFD700] font-bold">
          Total NET: ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.umNet || 0), 0))}
        </span>
      </div>
    </div>
  );
}