'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function FinancialPage() {
  const [loading, setLoading] = useState(true);
  const [officers, setOfficers] = useState([]);
  const [mealRates, setMealRates] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDept, setSelectedDept] = useState('All');
  const [scheduleData, setScheduleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();

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
      
      // 1. Fetch officers dari Supabase
      const { data: officersData, error: officersError } = await supabase
        .from('officers')
        .select('*')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      if (officersError) throw officersError;
      
      // 2. Fetch meal allowance rates
      const { data: ratesData, error: ratesError } = await supabase
        .from('meal_allowance')
        .select('*');
      
      if (ratesError) throw ratesError;
      
      // 3. Fetch schedule dari API
      const scheduleResponse = await fetch(
        `/api/schedule?year=${selectedYear}&month=${selectedMonth}`
      );
      const scheduleResult = await scheduleResponse.json();
      
      setOfficers(officersData || []);
      setMealRates(ratesData || []);
      setScheduleData(scheduleResult.data || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hitung masa kerja dalam bulan
  const getMonthsOfWork = (joinDate, endDate = '2026-02-20') => {
    const join = new Date(joinDate);
    const end = new Date(endDate);
    const years = end.getFullYear() - join.getFullYear();
    const months = (years * 12) + (end.getMonth() - join.getMonth());
    return months;
  };

  // Dapatkan rate berdasarkan department dan masa kerja
  const getMealRate = (department, joinDate) => {
    const monthsWorked = getMonthsOfWork(joinDate);
    
    if (department === 'AM' || department === 'CAPTAIN') {
      return mealRates.find(r => r.department === department && r.years_of_service === 'tidak terikat');
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

  // Hitung statistik per officer dari schedule
  const calculateOfficerStats = (officerName, department, joinDate) => {
    // Filter schedule untuk periode 21 Jan - 20 Feb
    const periodData = scheduleData.filter(day => {
      const date = new Date(day['DATE RUNDOWN']);
      const month = date.getMonth();
      const dayOfMonth = date.getDate();
      
      // Periode: 21 Jan - 20 Feb
      if (selectedMonth === 'February') {
        if (month === 0 && dayOfMonth >= 21) return true; // Jan 21-31
        if (month === 1 && dayOfMonth <= 20) return true; // Feb 1-20
      }
      return false;
    });

    // Inisialisasi counter
    let offCount = 0;
    let sakitCount = 0;
    let cutiCount = 0;
    let izinCount = 0;
    let unpaidCount = 0;
    let alphaCount = 0;
    let specialCount = 0;
    let totalHadir = 0;

    // Hitung status per hari
    periodData.forEach(day => {
      const status = day[officerName];
      if (!status) return;
      
      switch(status) {
        case 'OFF':
          offCount++;
          totalHadir++;
          break;
        case 'SPECIAL':
          specialCount++;
          totalHadir++;
          break;
        case 'P':
        case 'M':
        case 'S':
          totalHadir++;
          break;
        case 'SAKIT':
          sakitCount++;
          break;
        case 'CUTI':
          cutiCount++;
          break;
        case 'IZIN':
          izinCount++;
          break;
        case 'UNPAID LEAVE':
          unpaidCount++;
          break;
        case 'ABSEN':
          alphaCount++;
          break;
      }
    });

    // Dapatkan rate
    const rate = getMealRate(department, joinDate);
    const baseAmount = rate?.base_amount || 0;
    const prorate = rate?.prorate_per_day || 0;

    // Hitung bonus off tidak diambil
    const offNotTaken = Math.max(0, 4 - offCount);
    const proratePlus = offNotTaken * prorate;

    // Hitung potongan
    const totalPotongan = (sakitCount + cutiCount + izinCount + unpaidCount) * prorate;
    const dendaAlpha = alphaCount * 50;
    const prorateMinus = totalPotongan + dendaAlpha;

    // Hitung total UM
    const umSebelumPotongan = baseAmount + proratePlus;
    const umNet = Math.max(0, Math.round(umSebelumPotongan - prorateMinus));

    return {
      baseAmount,
      prorate,
      offCount,
      sakitCount,
      cutiCount,
      izinCount,
      unpaidCount,
      alphaCount,
      specialCount,
      totalHadir,
      proratePlus,
      prorateMinus,
      umSebelumPotongan,
      umNet
    };
  };

  // Filter officers berdasarkan department dan search
  const filteredOfficers = officers
    .filter(o => selectedDept === 'All' || o.department === selectedDept)
    .filter(o => o.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((officer, index) => {
      const stats = calculateOfficerStats(officer.full_name, officer.department, officer.join_date);
      return {
        ...officer,
        ...stats,
        no: index + 1
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#FFD700]">FINANCIAL SUMMARY</h1>
        <p className="text-[#A7D8FF] mt-2">Meal Allowance Calculation</p>
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
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1"
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
              <th className="p-2 border border-[#FFD700]/30">Uang Makan</th>
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
              <th className="p-2 border border-[#FFD700]/30">SAKIT</th>
              <th className="p-2 border border-[#FFD700]/30">IZIN</th>
              <th className="p-2 border border-[#FFD700]/30">ALPHA</th>
              <th className="p-2 border border-[#FFD700]/30">KASBON</th>
              <th className="p-2 border border-[#FFD700]/30">UM</th>
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
                <td className="p-2 border border-[#FFD700]/30">{new Date(officer.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${officer.baseAmount?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${officer.prorate?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">{Math.max(0, 4 - officer.offCount)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.cutiCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.unpaidCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.sakitCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.izinCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-center">{officer.alphaCount || ''}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${officer.proratePlus?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${officer.prorateMinus?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${(officer.unpaidCount * officer.prorate)?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${(officer.sakitCount * officer.prorate)?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${(officer.izinCount * officer.prorate)?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${(officer.alphaCount * 50)?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">$0.00</td>
                <td className="p-2 border border-[#FFD700]/30 text-right">${officer.umSebelumPotongan?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30 text-right font-bold text-[#FFD700]">${officer.umNet?.toFixed(2)}</td>
                <td className="p-2 border border-[#FFD700]/30">{officer.bank_account?.split(' ')[0] || ''}</td>
                <td className="p-2 border border-[#FFD700]/30">{officer.bank_account?.split(' ').slice(1).join(' ') || officer.bank_account || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Row */}
      <div className="mt-4 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg flex justify-between items-center">
        <span className="text-[#FFD700] font-bold">Total Officers: {filteredOfficers.length}</span>
        <span className="text-[#FFD700] font-bold">
          Total U.M NET: ${filteredOfficers.reduce((sum, o) => sum + (o.umNet || 0), 0).toFixed(2)}
        </span>
      </div>
    </div>
  );
}