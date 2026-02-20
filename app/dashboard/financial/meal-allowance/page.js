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
  const [unlocking, setUnlocking] = useState(false);
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

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  
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

  const formatBankAndRek = (bankAccount) => {
    if (!bankAccount) return { bank: 'ABA', rek: '-', link: '' };
    
    let bank = '';
    let rek = bankAccount;
    let link = '';
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = bankAccount.match(urlRegex);
    if (links && links.length > 0) {
      link = links[0];
      rek = bankAccount.replace(link, '').trim();
    }
    
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

  const calculateOfficerStats = (officerName, department, joinDate, schedule = scheduleData) => {
    const targetMonth = months.indexOf(selectedMonth);
    
    const periodData = schedule.filter(day => {
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

  // ===========================================
  // DATA FETCHING
  // ===========================================

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

  const calculateAllOfficers = async () => {
    try {
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      const { data: ratesData } = await supabase
        .from('meal_allowance')
        .select('*');
      
      setMealRates(ratesData || []);
      
      const scheduleResponse = await fetch(
        `/api/schedule?year=${selectedYear}&month=${selectedMonth}`
      );
      const scheduleResult = await scheduleResponse.json();
      const schedule = scheduleResult.data || [];
      
      return officersData.map(officer => {
        const stats = calculateOfficerStats(
          officer.full_name, 
          officer.department, 
          officer.join_date,
          schedule
        );
        
        return {
          officer_id: officer.id,
          officer_name: officer.full_name,
          department: officer.department,
          join_date: officer.join_date,
          bank_account: officer.bank_account || '',
          base_amount: stats.baseAmount,
          prorate: stats.prorate,
          off_count: stats.offCount,
          sakit_count: stats.sakitCount,
          cuti_count: stats.cutiCount,
          izin_count: stats.izinCount,
          unpaid_count: stats.unpaidCount,
          alpha_count: stats.alphaCount,
          um_net: stats.umNet,
          kasbon: 0,
          etc: 0,
          etc_operator: '+',
          etc_note: '',
          is_locked: true
        };
      });
    } catch (error) {
      console.error('Error calculating officers:', error);
      return [];
    }
  };

  // ===========================================
  // LOCK / UNLOCK HANDLERS
  // ===========================================

  const handleLockPeriod = async () => {
    if (!isAdmin) return;
    
    setLocking(true);
    try {
      const bulan = `${selectedMonth} ${selectedYear}`;
      const allOfficersData = await calculateAllOfficers();
      
      if (allOfficersData.length === 0) {
        throw new Error('Tidak ada data officer');
      }
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .upsert(allOfficersData, { 
          onConflict: 'officer_id, bulan' 
        });
      
      if (error) throw error;
      
      setIsLocked(true);
      alert('✅ Periode berhasil dikunci! Snapshot tersimpan.');
      fetchData();
      
    } catch (error) {
      console.error('Error locking period:', error);
      alert('❌ Gagal mengunci periode: ' + error.message);
    } finally {
      setLocking(false);
    }
  };

  const handleUnlockPeriod = async () => {
    if (!isAdmin) return;
    
    if (!confirm('⚠️ Yakin mau unlock periode ini? Data akan dihitung ulang dari schedule!')) return;
    
    setUnlocking(true);
    try {
      const bulan = `${selectedMonth} ${selectedYear}`;
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .update({ is_locked: false })
        .eq('bulan', bulan);
      
      if (error) throw error;
      
      setIsLocked(false);
      alert('✅ Periode di-unlock! Data bisa dihitung ulang.');
      fetchData();
      
    } catch (error) {
      console.error('Error unlocking period:', error);
      alert('❌ Gagal unlock periode');
    } finally {
      setUnlocking(false);
    }
  };

  // ===========================================
  // EDIT HANDLERS
  // ===========================================

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
      if (editForm.kasbon < 0 || editForm.etc < 0) {
        alert('⚠️ Nilai tidak boleh negatif');
        return;
      }
      
      const snapshotData = {
        officer_id: editingOfficer.id,
        officer_name: editingOfficer.full_name,
        department: editingOfficer.department,
        join_date: editingOfficer.join_date,
        bulan: `${selectedMonth} ${selectedYear}`,
        base_amount: editingOfficer.baseAmount || 0,
        prorate: editingOfficer.prorate || 0,
        off_count: editingOfficer.offCount || 0,
        sakit_count: editingOfficer.sakitCount || 0,
        cuti_count: editingOfficer.cutiCount || 0,
        izin_count: editingOfficer.izinCount || 0,
        unpaid_count: editingOfficer.unpaidCount || 0,
        alpha_count: editingOfficer.alphaCount || 0,
        um_net: editingOfficer.umNet || 0,
        kasbon: editForm.kasbon,
        etc: editForm.etc,
        etc_operator: editForm.etc_operator,
        etc_note: editForm.etc_note,
        bank_account: editingOfficer.bank_account || '',
        is_locked: true
      };
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .upsert(snapshotData, { 
          onConflict: 'officer_id, bulan' 
        });
      
      if (error) throw error;
      
      alert('✅ Data berhasil diupdate');
      fetchData();
      setEditingOfficer(null);
      
    } catch (error) {
      console.error('Error updating:', error);
      alert('❌ Gagal update data: ' + error.message);
    }
  };

  // ===========================================
  // FILTER & PROCESS OFFICERS
  // ===========================================

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
        const baseNet = Number(officer.umNet) || 0;
        const kasbon = Number(officer.kasbon) || 0;
        const etc = Number(officer.etc) || 0;
        const etcOp = officer.etc_operator === '+' ? 1 : -1;
        const finalNet = baseNet - kasbon + (etcOp * etc);
        
        return {
          ...officer,
          finalNet: Math.max(0, Math.round(finalNet))
        };
      } else {
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
        
        {/* Admin Controls - Lock/Unlock */}
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
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-green-600/20 text-[#32CD32] px-4 py-2 rounded-lg border border-[#32CD32]/30">
              <span>🔒</span>
              <span>Locked</span>
            </div>
            <button
              onClick={handleUnlockPeriod}
              disabled={unlocking}
              className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-500 px-4 py-2 rounded-lg border border-yellow-500/30 font-medium transition-all"
            >
              {unlocking ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                  <span>Unlocking...</span>
                </>
              ) : (
                <>
                  <span>🔓</span>
                  <span>Unlock</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Officers</div>
          <div className="text-2xl font-bold text-[#FFD700]">{officersWithStats.length}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total NET</div>
          <div className="text-2xl font-bold text-[#FFD700]">
            ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.finalNet || 0), 0))}
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Kasbon</div>
          <div className="text-2xl font-bold text-red-400">
            ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.kasbon || 0), 0))}
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total ETC</div>
          <div className="text-2xl font-bold text-green-400">
            ${Math.round(officersWithStats.reduce((sum, o) => {
              const etcOp = o.etc_operator === '+' ? 1 : -1;
              return sum + (etcOp * (o.etc || 0));
            }, 0))}
          </div>
        </div>
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
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-[#A7D8FF]">Periode: </span>
            <span className="text-white font-medium">
              {new Date(getPeriodeStart(selectedMonth, selectedYear)).toLocaleDateString('id-ID', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })} - {' '}
              {new Date(getPeriodeEnd(selectedMonth, selectedYear)).toLocaleDateString('id-ID', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
          </div>
          <div>
            <span className="text-[#A7D8FF]">Pembagian UM: </span>
            <span className="text-white font-medium">1 {selectedMonth} {selectedYear}</span>
          </div>
        </div>
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
                    {/* BARIS 1: Nama, Join Date, Bank */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                      <div>
                        <div className="font-bold text-[#FFD700] text-lg">{officer.full_name}</div>
                        <div className="text-xs text-[#A7D8FF]">
                          Join: {new Date(officer.join_date).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: '2-digit' 
                          })}
                        </div>
                      </div>
                      
                      {/* Bank & Link */}
                      <div className="mt-2 md:mt-0">
                        <div className="text-[#A7D8FF] text-xs font-medium">{bank}</div>
                        <div className="text-xs text-white break-all">{rek}</div>
                        {link && (
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-[#FFD700] hover:underline block break-all"
                            title={link}
                          >
                            {link}
                          </a>
                        )}
                      </div>
                    </div>
                    
                    {/* BARIS 2: Angka-angka (Pokok, Rate, Holiday, C/U/S/I/A, NET) */}
                    <div className="flex flex-wrap items-center gap-4 text-sm bg-[#1A2F4A] p-3 rounded-lg mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">Pokok:</span>
                        <span className="font-medium text-white">${Math.round(officer.baseAmount || officer.base_amount || 0)}</span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">Rate:</span>
                        <span className="font-medium text-white">${Math.round(officer.prorate || officer.prorate || 0)}</span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">Holiday:</span>
                        <span className="font-medium text-white">{Math.max(0, 4 - (officer.offCount || officer.off_count || 0))}</span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">C/U/S/I/A:</span>
                        <span className="font-medium text-white">
                          {officer.cutiCount || officer.cuti_count || 0}/
                          {officer.unpaidCount || officer.unpaid_count || 0}/
                          {officer.sakitCount || officer.sakit_count || 0}/
                          {officer.izinCount || officer.izin_count || 0}/
                          {officer.alphaCount || officer.alpha_count || 0}
                        </span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">NET:</span>
                        <span className="font-bold text-[#FFD700]">
                          ${Math.round(officer.finalNet || officer.umNet || officer.um_net || 0)}
                        </span>
                      </div>
                    </div>
                    
                    {/* BARIS 3: Kolom Kasbon, ETC, Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      {/* Kasbon */}
                      <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                        <div className="text-[#A7D8FF] text-xs mb-1">💰 KASBON</div>
                        <div className="font-medium text-red-400">
                          {usingSnapshot ? (
                            `$${officer.kasbon || 0}`
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                      
                      {/* ETC */}
                      <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                        <div className="text-[#A7D8FF] text-xs mb-1">🔄 ETC</div>
                        <div className="font-medium text-green-400">
                          {usingSnapshot ? (
                            `${officer.etc_operator === '+' ? '+' : '-'}$${officer.etc || 0}`
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Notes */}
                      <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                        <div className="text-[#A7D8FF] text-xs mb-1">📝 NOTES</div>
                        <div className="text-sm text-white truncate" title={officer.etc_note}>
                          {usingSnapshot ? (officer.etc_note || '-') : '-'}
                        </div>
                      </div>
                    </div>
                    
                    {/* BARIS 4: Tombol Edit */}
                    <div className="flex justify-end">
                      {isAdmin && !isLocked && (
                        <button
                          onClick={() => handleEditClick(officer)}
                          className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-black px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit KASBON/ETC</span>
                        </button>
                      )}
                      
                      {isAdmin && isLocked && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <span>🔒</span>
                          <span>Data terkunci (snapshot)</span>
                        </span>
                      )}
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
              {/* KASBON */}
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">
                  KASBON ( - )
                </label>
                <input
                  type="text"
                  value={editForm.kasbon}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setEditForm({...editForm, kasbon: value ? parseInt(value) : 0});
                  }}
                  className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
              
              {/* ETC + OPERATOR */}
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
                    type="text"
                    value={editForm.etc}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setEditForm({...editForm, etc: value ? parseInt(value) : 0});
                    }}
                    className="flex-1 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                    placeholder="0"
                    inputMode="numeric"
                  />
                </div>
              </div>
              
              {/* KETERANGAN/NOTE */}
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