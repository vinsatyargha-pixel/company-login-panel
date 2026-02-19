'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function FinancialPage() {
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [mealRates, setMealRates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDept, setSelectedDept] = useState('All');
  const [scheduleData, setScheduleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];
  const departments = ['All', 'AM', 'CAPTAIN', 'CS DP WD'];

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

  const filteredOfficers = officers
    .filter(o => selectedDept === 'All' || o.department === selectedDept)
    .filter(o => o.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((officer, index) => {
      const stats = calculateOfficerStats(officer.full_name, officer.department, officer.join_date);
      const { bank, rek } = formatBankAndRek(officer.bank_account);
      return {
        ...officer,
        ...stats,
        no: index + 1,
        bank_name: bank,
        rekening: rek
      };
    });

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
          <h1 className="text-3xl font-bold text-[#FFD700]">FINANCIAL SUMMARY</h1>
          <p className="text-[#A7D8FF] mt-1">Meal Allowance Calculation</p>
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
        >
          {departments.map(dept => (
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

      {/* Table */}
      <div className="overflow-x-auto border border-[#FFD700]/30 rounded-lg">
        <table className="min-w-full bg-[#0B1A33] text-sm">
          <thead>
            <tr className="bg-[#1A2F4A] text-[#FFD700] text-xs font-bold">
              <th className="p-2 border border-[#FFD700]/30">No.</th>
              <th className="p-2 border border-[#FFD700]/30">Nama</th>
              <th className="p-2 border border-[#FFD700]/30">Department</th>
              <th className="p-2 border border-[#FFD700]/30">Join</th>
              <th className="p-2 border border-[#FFD700]/30">UM POKOK</th>
              <th className="p-2 border border-[#FFD700]/30">PRORATE / DAY</th>
              <th className="p-2 border border-[#FFD700]/30">PRORATE HOLIDAY</th>
              <th className="p-2 border border-[#FFD700]/30">CUTI</th>
              <th className="p-2 border border-[#FFD700]/30">UNPAID</th>
              <th className="p-2 border border-[#FFD700]/30">SAKIT</th>
              <th className="p-2 border border-[#FFD700]/30">IZIN</th>
              <th className="p-2 border border-[#FFD700]/30">ALPHA</th>
              <th className="p-2 border border-[#FFD700]/30">Pro rate (+)</th>
              <th className="p-2 border border-[#FFD700]/30">Pro rate (-)</th>
              <th className="p-2 border border-[#FFD700]/30">UNPAID</th>
              <th className="p-2 border border-[#FFD700]/30">Skt</th>
              <th className="p-2 border border-[#FFD700]/30">I</th>
              <th className="p-2 border border-[#FFD700]/30">A</th>
              <th className="p-2 border border-[#FFD700]/30">KASBON</th>
              <th className="p-2 border border-[#FFD700]/30">U. M NET</th>
              <th className="p-2 border border-[#FFD700]/30">NAMA BANK</th>
              <th className="p-2 border border-[#FFD700]/30">NO REK / BARCODE</th>
            </tr>
          </thead>
          <tbody>
            {filteredOfficers.map((officer) => (
              <tr key={officer.id} className="text-white hover:bg-[#1A2F4A]">
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.no}</td>
                <td className="p-2 border border-[#FFD700]/30">{officer.full_name}</td>
                <td className="p-2 border border-[#FFD700]/30">{officer.department}</td>
                <td className="p-2 border border-[#FFD700]/30">
                  {new Date(officer.join_date).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: '2-digit' 
                  })}
                </td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.baseAmount)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.prorate)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">{Math.max(0, 4 - officer.offCount)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.cutiCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.unpaidCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.sakitCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.izinCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.alphaCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.proratePlus)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.prorateMinus)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.unpaidCount * officer.prorate)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.sakitCount * officer.prorate)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.izinCount * officer.prorate)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${Math.round(officer.alphaCount * 50)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">$0</td>
                <td className="p-2 border border-[#FFD700]/30 text-right font-bold text-[#FFD700]">${Math.round(officer.umNet)}</td>
                <td className="p-2 border border-[#FFD700]/30">{officer.bank_name}</td>
                <td className="p-2 border border-[#FFD700]/30">{officer.rekening}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Total */}
      <div className="mt-4 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg flex justify-between items-center">
        <span className="text-[#FFD700] font-bold">
          Total Officers: {filteredOfficers.length}
        </span>
        <span className="text-[#FFD700] font-bold">
          Total U.M NET: ${Math.round(filteredOfficers.reduce((sum, o) => sum + (o.umNet || 0), 0))}
        </span>
      </div>
    </div>
  );
}