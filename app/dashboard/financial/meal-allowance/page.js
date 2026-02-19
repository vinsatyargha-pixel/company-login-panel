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
  const [isLocked, setIsLocked] = useState(false);
  const [locking, setLocking] = useState(false);
  const [snapshotData, setSnapshotData] = useState([]);
  const [usingSnapshot, setUsingSnapshot] = useState(false);
  
  // State untuk edit
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({
    kasbon: 0,
    etc: 0,
    etc_operator: '+',
    etc_note: ''
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

  // Helper functions untuk periode
  const getPeriodeStart = (month, year) => {
    const monthIndex = months.indexOf(month);
    if (month === 'February') {
      return `${parseInt(year) - 1}-12-21`;
    }
    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 2;
    const prevMonthYear = monthIndex <= 1 ? parseInt(year) - 1 : parseInt(year);
    return `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-21`;
  };

  const getPeriodeEnd = (month, year) => {
    const monthIndex = months.indexOf(month);
    if (month === 'February') {
      return `${year}-01-20`;
    }
    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
    return `${year}-${String(prevMonth + 1).padStart(2, '0')}-20`;
  };

  // Format bank dan rekening
  const formatBankAndRek = (bankAccount) => {
    if (!bankAccount) return { bank: 'ABA', rek: '-', link: '' };
    
    let bank = '';
    let rek = bankAccount;
    let link = '';
    
    // Pisahin link dari teks
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = bankAccount.match(urlRegex);
    if (links && links.length > 0) {
      link = links[0];
      rek = bankAccount.replace(link, '').trim();
    }
    
    // Deteksi bank
    if (rek.includes('ABA')) {
      bank = 'ABA';
      rek = rek.replace('ABA', '').trim();
    } else if (rek.includes('ACLEDA')) {
      bank = 'ACLEDA';
      rek = rek.replace('ACLEDA', '').trim();
    } else if (rek.includes('WING BANK')) {
      bank = 'WING BANK';
      rek = rek.replace('WING BANK', '').trim();
    } else if (rek.includes('WING')) {
      bank = 'WING BANK';
      rek = rek.replace('WING', '').trim();
    } else {
      const parts = rek.split(' ');
      bank = parts[0] || 'ABA';
      rek = parts.slice(1).join(' ') || '';
    }
    
    return { bank, rek: rek.trim(), link };
  };

  // Set department filter based on user role
  useEffect(() => {
    if (!isAdmin) {
      setAvailableDepartments(['CS DP WD']);
      setSelectedDept('CS DP WD');
    } else {
      setAvailableDepartments(['All', 'AM', 'CAPTAIN', 'CS DP WD']);
      setSelectedDept('All');
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Fetch data dari snapshot atau hitung manual
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      
      const { data: lockCheck } = await supabase
        .from('meal_allowance_snapshot')
        .select('is_locked')
        .eq('bulan', bulan)
        .maybeSingle();
      
      setIsLocked(lockCheck?.is_locked || false);
      
      if (lockCheck?.is_locked) {
        const { data: snapData } = await supabase
          .from('meal_allowance_snapshot')
          .select('*')
          .eq('bulan', bulan)
          .order('officer_name');
        
        if (snapData) {
  setSnapshotData(snapData);
  setUsingSnapshot(true);
  
  const formattedOfficers = snapData.map(item => ({
    id: item.officer_id,
    full_name: item.officer_name,
    department: item.department,
    join_date: item.join_date,
    baseAmount: item.base_amount,
    prorate: item.prorate,
    offCount: item.off_count,
    sakitCount: item.sakit_count,
    cutiCount: item.cuti_count,
    izinCount: item.izin_count,
    unpaidCount: item.unpaid_count,
    alphaCount: item.alpha_count,
    umNet: item.um_net,
    // 🔥 INI PENTING - KASBON & ETC
    kasbon: item.kasbon || 0,
    etc: item.etc || 0,
    etc_operator: item.etc_operator || '+',
    etc_note: item.etc_note || '',
    bank_account: item.bank_account || ''
  }));
  
  setOfficers(formattedOfficers);
}
      } else {
        setUsingSnapshot(false);
        await fetchManualData();
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data manual
  const fetchManualData = async () => {
    try {
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
      console.error('Error in manual fetch:', error);
    }
  };

  // Handle lock period
  const handleLockPeriod = async () => {
    if (!isAdmin) return;
    
    setLocking(true);
    try {
      const bulan = `${selectedMonth} ${selectedYear}`;
      const periodeStart = getPeriodeStart(selectedMonth, selectedYear);
      const periodeEnd = getPeriodeEnd(selectedMonth, selectedYear);
      
      const { error } = await supabase.rpc('lock_meal_allowance', {
        target_bulan: bulan,
        start_date: periodeStart,
        end_date: periodeEnd
      });
      
      if (error) throw error;
      
      const { error: calcError } = await supabase.rpc('calculate_and_update_snapshot', {
        target_bulan: bulan
      });
      
      if (calcError) throw calcError;
      
      setIsLocked(true);
      alert('✅ Periode berhasil dikunci!');
      fetchData();
      
    } catch (error) {
      console.error('Error locking period:', error);
      alert('❌ Gagal mengunci periode');
    } finally {
      setLocking(false);
    }
  };

  // Handle edit
  const handleEditClick = (officer) => {
    setEditingOfficer(officer);
    setEditForm({
      kasbon: officer.kasbon || 0,
      etc: officer.etc || 0,
      etc_operator: officer.etc_operator || '+',
      etc_note: officer.etc_note || ''
    });
  };

  const handleEditSave = async () => {
  try {
    const { error } = await supabase
      .from('meal_allowance_snapshot')
      .update({
        kasbon: editForm.kasbon,
        etc: editForm.etc,
        etc_operator: editForm.etc_operator,
        etc_note: editForm.etc_note
      })
      .eq('officer_id', editingOfficer.id)
      .eq('bulan', `${selectedMonth} ${selectedYear}`);
    
    if (error) throw error;
    
    alert('✅ Data berhasil diupdate');
    fetchData(); // Refresh data
    setEditingOfficer(null);
    
  } catch (error) {
    console.error('Error updating:', error);
    alert('❌ Gagal update data');
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

  // Filter officers
  const officersWithStats = officers
    .filter(o => {
      if (!isAdmin) {
        return o.department === 'CS DP WD';
      }
      return selectedDept === 'All' || o.department === selectedDept;
    })
    .filter(o => o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((officer) => {
      if (usingSnapshot) {
  // Hitung final NET dengan kasbon dan etc
  const baseNet = officer.umNet || 0;
  const kasbon = Math.abs(officer.kasbon || 0);
  const etc = officer.etc || 0;
  const etcOp = officer.etc_operator === '+' ? 1 : -1;
  const finalNet = baseNet - kasbon + (etcOp * etc);
  
  return {
    ...officer,
    finalNet: Math.max(0, finalNet)
  };
}
        const stats = calculateOfficerStats(officer.full_name, officer.department, officer.join_date);
        return {
          ...officer,
          ...stats,
          finalNet: stats.umNet
        };
      }
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
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link 
          href="/dashboard/financial" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Financial</span>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#FFD700]">MEAL ALLOWANCE</h1>
          <p className="text-[#A7D8FF] mt-1 flex items-center gap-2">
            {isAdmin ? '👑 Admin View' : '👤 Staff View'} - {selectedMonth} {selectedYear}
            {usingSnapshot && <span className="text-[#32CD32] text-sm">📦 (from snapshot)</span>}
            {isLocked && <span className="text-[#32CD32] text-sm">🔒 Locked</span>}
          </p>
        </div>
        
        {/* Tombol Lock */}
        {isAdmin && !isLocked && (
          <button
            onClick={handleLockPeriod}
            disabled={locking}
            className="flex items-center gap-2 bg-[#FFD700] hover:bg-[#FFD700]/80 text-black px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 font-medium"
          >
            {locking ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                <span>Locking...</span>
              </>
            ) : (
              <>
                <span>🔒</span>
                <span>Lock Period</span>
              </>
            )}
          </button>
        )}
        
        {isAdmin && isLocked && (
          <div className="flex items-center gap-2 bg-green-600/20 text-[#32CD32] px-4 py-2 rounded-lg border border-[#32CD32]/30">
            <span>🔒</span>
            <span>Locked</span>
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          disabled={isLocked && !isAdmin}
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>

        <select 
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          disabled={isLocked && !isAdmin}
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

      {/* Info periode */}
      <div className="mb-4 p-3 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 text-sm">
        <span className="text-[#A7D8FF]">Periode perhitungan: </span>
        <span className="text-white font-medium">
          {new Date(getPeriodeStart(selectedMonth, selectedYear)).toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })} s/d {' '}
          {new Date(getPeriodeEnd(selectedMonth, selectedYear)).toLocaleDateString('id-ID', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          })}
        </span>
        <span className="ml-4 text-[#A7D8FF]">Pembagian: </span>
        <span className="text-white font-medium">
          1 {selectedMonth} {selectedYear}
        </span>
      </div>

      {/* Render Sections */}
      {['CS DP WD', 'CAPTAIN', 'AM'].map(dept => {
        if (dept !== 'CS DP WD' && !isAdmin) return null;
        if (groupedOfficers[dept]?.length === 0) return null;
        
        return (
          <div key={dept} className="mb-8">
            <div className="bg-[#1A2F4A] p-3 rounded-t-lg border border-[#FFD700]/30">
              <h2 className="text-xl font-bold text-[#FFD700]">{dept} ({groupedOfficers[dept].length})</h2>
            </div>
            <div className="border-x border-b border-[#FFD700]/30 rounded-b-lg overflow-hidden">
              {groupedOfficers[dept].map((officer) => {
                const { bank, rek, link } = formatBankAndRek(officer.bank_account);
                
                return (
                  <div key={officer.id} className="p-4 border-b border-[#FFD700]/30 last:border-b-0 hover:bg-[#1A2F4A]/50">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Nama dan Join Date */}
                      <div className="w-full md:w-1/5">
                        <div className="font-bold text-[#FFD700]">{officer.full_name}</div>
                        <div className="text-xs text-[#A7D8FF]">
                          Join: {new Date(officer.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </div>
                      </div>
                      
                      {/* Angka-angka - KE SAMPING */}
                      <div className="flex-1 flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-[#A7D8FF] text-xs">Pokok:</span>
                          <span className="font-medium">${Math.round(officer.baseAmount || officer.base_amount)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[#A7D8FF] text-xs">Rate:</span>
                          <span className="font-medium">${Math.round(officer.prorate || officer.prorate)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[#A7D8FF] text-xs">Holiday:</span>
                          <span className="font-medium">{Math.max(0, 4 - (officer.offCount || officer.off_count || 0))}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-[#A7D8FF] text-xs">C/U/S/I/A:</span>
                          <span className="font-medium">
                            {officer.cutiCount || officer.cuti_count || 0}/
                            {officer.unpaidCount || officer.unpaid_count || 0}/
                            {officer.sakitCount || officer.sakit_count || 0}/
                            {officer.izinCount || officer.izin_count || 0}/
                            {officer.alphaCount || officer.alpha_count || 0}
                          </span>
                        </div>
                        
                        {/* KASBON - Admin only */}
{isAdmin && (
  <div className="flex items-center gap-1">
    <span className="text-[#A7D8FF] text-xs">KASBON:</span>
    <span className="font-medium text-red-400">-${Math.abs(officer.kasbon || 0)}</span>
  </div>
)}
                        
                        {/* ETC dengan Keterangan - Admin only */}
{isAdmin && (
  <div className="flex items-center gap-1">
    <span className="text-[#A7D8FF] text-xs">ETC:</span>
    <span className={`font-medium ${officer.etc_operator === '+' ? 'text-green-400' : 'text-red-400'}`}>
      {officer.etc_operator}{officer.etc || 0}
    </span>
    {officer.etc_note && (
      <span className="text-xs text-[#A7D8FF]">({officer.etc_note})</span>
    )}
  </div>
)}
                        {/* NET Final */}
                        <div className="flex items-center gap-1">
                          <span className="text-[#A7D8FF] text-xs">NET:</span>
                          <span className="font-bold text-[#FFD700]">
                            ${Math.round(officer.finalNet || officer.umNet || officer.um_net || 0)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Bank & No Rek - Tampilan Rapi */}
<div className="w-full md:w-1/6">
  <div className="text-[#A7D8FF] text-xs font-medium">{bank}</div>
  <div className="text-xs text-white break-all">{rek}</div>
  
  {/* Link FULL - bisa diklik */}
  {link && (
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-[10px] text-[#FFD700] hover:underline block break-all mt-1"
      title={link}
    >
      {link}
    </a>
  )}
  
  {/* Tombol Edit - DIPAKSA MUNCUL UNTUK TEST */}
{isAdmin && (
  <button
    onClick={() => handleEditClick(officer)}
    className="mt-3 bg-[#FFD700] hover:bg-[#FFD700]/80 text-black px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-all w-fit"
  >
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
    <span>Edit KASBON/ETC</span>
  </button>
)}
</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer Total */}
      <div className="mt-6 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg flex justify-between items-center">
        <span className="text-[#FFD700] font-bold">
          Total Officers: {officersWithStats.length}
        </span>
        <span className="text-[#FFD700] font-bold">
          Total NET: ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.finalNet || o.umNet || o.um_net || 0), 0))}
        </span>
      </div>

      {/* Modal Edit untuk Admin */}
{editingOfficer && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 max-w-md w-full">
      <h3 className="text-xl font-bold text-[#FFD700] mb-4">
        Edit {editingOfficer.full_name}
      </h3>
      
      <div className="space-y-4">
        {/* 1. KASBON */}
        <div>
          <label className="text-[#A7D8FF] text-sm block mb-1">
            KASBON ( - )
          </label>
          <input
            type="number"
            value={editForm.kasbon}
            onChange={(e) => setEditForm({...editForm, kasbon: parseInt(e.target.value) || 0})}
            className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
            placeholder="0"
          />
        </div>
        
        {/* 2. ETC + OPERATOR */}
        <div>
          <label className="text-[#A7D8FF] text-sm block mb-1">
            ETC ( + / - )
          </label>
          <div className="flex gap-2">
            <select
              value={editForm.etc_operator}
              onChange={(e) => setEditForm({...editForm, etc_operator: e.target.value})}
              className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white w-20"
            >
              <option value="+">+</option>
              <option value="-">-</option>
            </select>
            <input
              type="number"
              value={editForm.etc}
              onChange={(e) => setEditForm({...editForm, etc: parseInt(e.target.value) || 0})}
              className="flex-1 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
              placeholder="0"
            />
          </div>
        </div>
        
        {/* 3. KETERANGAN/NOTE */}
        <div>
          <label className="text-[#A7D8FF] text-sm block mb-1">
            Keterangan / Note
          </label>
          <input
            type="text"
            value={editForm.etc_note}
            onChange={(e) => setEditForm({...editForm, etc_note: e.target.value})}
            className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
            placeholder="Misal: Koreksi, Bonus, Denda, dll"
          />
        </div>
        
        {/* Tombol Simpan & Batal */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleEditSave}
            className="flex-1 bg-[#FFD700] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FFD700]/80"
          >
            Simpan
          </button>
          <button
            onClick={() => setEditingOfficer(null)}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}