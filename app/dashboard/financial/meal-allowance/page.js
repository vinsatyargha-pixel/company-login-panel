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
  
  // State untuk edit
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({
    kasbon: 0,
    etc: 0,
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
    if (monthIndex === 0) { // January
      return `${parseInt(year) - 1}-12-21`;
    } else {
      return `${year}-${String(monthIndex).padStart(2, '0')}-21`;
    }
  };

  const getPeriodeEnd = (month, year) => {
    const monthIndex = months.indexOf(month);
    return `${year}-${String(monthIndex + 1).padStart(2, '0')}-20`;
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
    
    // AM & CAPTAIN tetap
    if (department === 'AM') {
      return { base_amount: 400, prorate_per_day: 15 };
    }
    if (department === 'CAPTAIN') {
      return { base_amount: 350, prorate_per_day: 13 };
    }
    
    // CS DP WD berdasarkan masa kerja
    if (department === 'CS DP WD') {
      if (monthsWorked >= 36) { // 3 tahun keatas
        return { base_amount: 325, prorate_per_day: 12 };
      } else if (monthsWorked >= 24) { // 2 tahun keatas
        return { base_amount: 300, prorate_per_day: 11 };
      } else { // kurang dari 2 tahun
        return { base_amount: 275, prorate_per_day: 10 };
      }
    }
    
    return null;
  };

  const calculateOfficerStats = (officerName, department, joinDate, schedule = scheduleData) => {
    // 1. TENTUKAN POKOK & PRORATE
    let pokok = 0, prorate = 0;
    
    if (department === 'AM') {
      pokok = 400;
      prorate = 15;
    } else if (department === 'CAPTAIN') {
      pokok = 350;
      prorate = 13;
    } else if (department === 'CS DP WD') {
      const monthsWorked = getMonthsOfWork(joinDate);
      if (monthsWorked >= 36) {
        pokok = 325;
        prorate = 12;
      } else if (monthsWorked >= 24) {
        pokok = 300;
        prorate = 11;
      } else {
        pokok = 275;
        prorate = 10;
      }
    }
    
    // 2. HITUNG KEJADIAN DARI SCHEDULE
    const periodeStart = new Date(getPeriodeStart(selectedMonth, selectedYear));
    const periodeEnd = new Date(getPeriodeEnd(selectedMonth, selectedYear));
    
    periodeStart.setHours(0, 0, 0, 0);
    periodeEnd.setHours(23, 59, 59, 999);
    
    const periodData = schedule.filter(day => {
      const dateStr = day['DATE RUNDOWN'];
      if (!dateStr) return false;
      
      const [dayNum, monthStr, yearStr] = dateStr.split('-');
      const date = new Date(`${yearStr}-${monthStr}-${dayNum}`);
      date.setHours(0, 0, 0, 0);
      
      return date >= periodeStart && date <= periodeEnd;
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

    // 3. HITUNG UM NET
    const offNotTaken = Math.max(0, 4 - offCount);
    const tambahProrate = offNotTaken * prorate;
    const potonganKejadian = (sakitCount + cutiCount + izinCount + unpaidCount) * prorate;
    const dendaAlpha = alphaCount * 50;
    
    const umNet = Math.max(0, pokok + tambahProrate - potonganKejadian - dendaAlpha);

    return {
      baseAmount: pokok,
      prorate: prorate,
      offCount,
      sakitCount,
      cutiCount,
      izinCount,
      unpaidCount,
      alphaCount,
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
      
      // Ambil semua officer aktif
      const { data: allOfficers } = await supabase
        .from('officers')
        .select('id, full_name, department, join_date, bank_account')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      // Ambil snapshot bulan ini
      const { data: snapData } = await supabase
        .from('meal_allowance_snapshot')
        .select('*')
        .eq('bulan', bulan);
      
      if (snapData && snapData.length === allOfficers.length) {
        // LENGKAP, pake snapshot
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
          etc_note: item.etc_note || '',
          bank_account: item.bank_account || ''
        }));
        
        setOfficers(formattedOfficers);
      } else {
        // TIDAK LENGKAP, hitung ulang semua
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
      
      setMealRates(ratesData || []);
      setScheduleData(scheduleResult.data || []);
      
      // Hitung stat untuk setiap officer
      const officersWithStats = (officersData || []).map(officer => {
        const stats = calculateOfficerStats(
          officer.full_name, 
          officer.department, 
          officer.join_date,
          scheduleResult.data || []
        );
        
        return {
          id: officer.id,
          full_name: officer.full_name,
          department: officer.department,
          join_date: officer.join_date,
          bank_account: officer.bank_account,
          ...stats,
          kasbon: 0,
          etc: 0,
          etc_note: ''
        };
      });
      
      setOfficers(officersWithStats);
      
    } catch (error) {
      console.error('Error in manual fetch:', error);
    }
  };

  // ===========================================
  // EDIT HANDLERS (ADMIN ONLY)
  // ===========================================

  const handleEditClick = (officer) => {
    if (!isAdmin) return;
    setEditingOfficer(officer);
    setEditForm({
      kasbon: officer.kasbon || 0,
      etc: officer.etc || 0,
      etc_note: officer.etc_note || ''
    });
  };

  const handleEditSave = async () => {
    if (!isAdmin) return;
    
    try {
      if (editForm.kasbon < 0) {
        alert('⚠️ Kasbon tidak boleh negatif');
        return;
      }
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      
      // Data untuk disimpan
      const snapshotData = {
        officer_id: editingOfficer.id,
        officer_name: editingOfficer.full_name,
        department: editingOfficer.department,
        join_date: editingOfficer.join_date,
        bulan: bulan,
        periode_start: getPeriodeStart(selectedMonth, selectedYear),
        periode_end: getPeriodeEnd(selectedMonth, selectedYear),
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
        etc: editForm.etc || 0,
        etc_note: editForm.etc_note
      };
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .upsert(snapshotData, { 
          onConflict: 'officer_id, bulan' 
        });
      
      if (error) throw error;
      
      // Update state langsung
      setOfficers(prev => prev.map(o => 
        o.id === editingOfficer.id 
          ? { 
              ...o, 
              kasbon: editForm.kasbon,
              etc: editForm.etc || 0,
              etc_note: editForm.etc_note
            }
          : o
      ));
      
      alert('✅ Data berhasil diupdate');
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
      const finalNet = Math.max(0, (officer.umNet || 0) - (officer.kasbon || 0) + (officer.etc || 0));
      return {
        ...officer,
        finalNet
      };
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
          <p className="text-[#A7D8FF] mt-1">
            {isAdmin ? '👑 Admin Mode (bisa edit)' : '👤 Staff Mode (read only)'} - {selectedMonth} {selectedYear}
          </p>
        </div>
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
            ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.etc || 0), 0))}
          </div>
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

      {/* Info periode */}
      <div className="mb-4 p-3 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 text-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-[#A7D8FF]">Periode Kejadian: </span>
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
                    
                    {/* BARIS 2: Angka-angka */}
                    <div className="flex flex-wrap items-center gap-4 text-sm bg-[#1A2F4A] p-3 rounded-lg mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">Pokok:</span>
                        <span className="font-medium text-white">${Math.round(officer.baseAmount || 0)}</span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">OFF Day:</span>
                        <span className="font-medium text-white">{officer.offCount || 0}</span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">C/U/S/I/A:</span>
                        <span className="font-medium text-white">
                          {officer.cutiCount || 0}/
                          {officer.unpaidCount || 0}/
                          {officer.sakitCount || 0}/
                          {officer.izinCount || 0}/
                          {officer.alphaCount || 0}
                        </span>
                      </div>
                      
                      <div className="w-px h-4 bg-[#FFD700]/30"></div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-[#A7D8FF] text-xs">NET:</span>
                        <span className="font-bold text-[#FFD700]">
                          ${officer.finalNet || 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* BARIS 3: Kolom Kasbon, ETC, Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                        <div className="text-[#A7D8FF] text-xs mb-1">💰 KASBON</div>
                        <div className="font-medium text-red-400">
                          ${officer.kasbon || 0}
                        </div>
                      </div>
                      
                      <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                        <div className="text-[#A7D8FF] text-xs mb-1">🔄 ETC</div>
                        <div className={`font-medium ${(officer.etc || 0) > 0 ? 'text-green-400' : (officer.etc || 0) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {(officer.etc || 0) > 0 ? '+' : ''}{officer.etc || 0}
                        </div>
                      </div>
                      
                      <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                        <div className="text-[#A7D8FF] text-xs mb-1">📝 NOTES</div>
                        <div className="text-sm text-white truncate" title={officer.etc_note}>
                          {officer.etc_note || '-'}
                        </div>
                      </div>
                    </div>
                    
                    {/* BARIS 4: Tombol Edit */}
                    {isAdmin && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleEditClick(officer)}
                          className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-black px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <span>Edit KASBON/ETC</span>
                        </button>
                      </div>
                    )}
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
          Total NET: ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.finalNet || 0), 0))}
        </span>
      </div>

      {/* Modal Edit untuk Admin */}
      {editingOfficer && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">
              Edit {editingOfficer.full_name}
            </h3>
            
            <div className="space-y-4">
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
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">
                  ETC (+ nambah, - ngurang)
                </label>
                <input
                  type="text"
                  value={editForm.etc}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9-]/g, '');
                    setEditForm({...editForm, etc: value ? parseInt(value) : 0});
                  }}
                  className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                  placeholder="Contoh: 25 atau -10"
                  inputMode="numeric"
                />
              </div>
              
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