'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MealAllowancePage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDept, setSelectedDept] = useState('All');
  const [scheduleData, setScheduleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDepartments, setAvailableDepartments] = useState(['All', 'AM', 'CAPTAIN', 'CS DP WD']);
  
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({
    kasbon: 0,
    cuti: 0,
    etc: 0,
    etc_note: ''
  });
  const [lastSync, setLastSync] = useState(new Date());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

  const JATAH_OFF_PER_PERIODE = 4;

  const getCurrentMonthByCutoff = () => {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonthIndex = today.getMonth();
    const currentYear = today.getFullYear();
    
    if (currentDate > 20) {
      let nextMonthIndex = currentMonthIndex + 1;
      let nextYear = currentYear;
      
      if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear = currentYear + 1;
      }
      
      setSelectedYear(nextYear.toString());
      setSelectedMonth(months[nextMonthIndex]);
    } else {
      setSelectedYear(currentYear.toString());
      setSelectedMonth(months[currentMonthIndex]);
    }
  };

  const hitungMasaKerja = (joinDate) => {
    if (!joinDate) return '< 1 bln';
    
    const join = new Date(joinDate);
    const filterDate = new Date(`${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, '0')}-01`);
    
    join.setDate(1);
    filterDate.setDate(1);
    
    let tahun = filterDate.getFullYear() - join.getFullYear();
    let bulan = filterDate.getMonth() - join.getMonth();
    
    if (bulan < 0) {
      tahun -= 1;
      bulan += 12;
    }
    
    if (tahun === 0 && bulan === 0) {
      return '< 1 bln';
    } else if (tahun === 0) {
      return `${bulan} bln`;
    } else if (bulan === 0) {
      return `${tahun} thn`;
    } else {
      return `${tahun} thn ${bulan} bln`;
    }
  };

  const formatBankAndRek = (bankAccount) => {
    if (!bankAccount) return { bank: '-', rek: '-', link: '' };
    
    let bank = 'ABA';
    let rek = bankAccount;
    let link = '';
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = bankAccount.match(urlRegex);
    if (links && links.length > 0) {
      link = links[0];
      rek = bankAccount.replace(link, '').trim();
    }
    
    if (rek.includes('ACLEDA')) {
      bank = 'ACLEDA';
      rek = rek.replace('ACLEDA', '').trim();
    } else if (rek.includes('WING')) {
      bank = 'WING';
      rek = rek.replace('WING', '').replace('BANK', '').trim();
    } else {
      rek = rek.replace('ABA', '').trim();
    }
    
    return { bank, rek: rek || '-', link };
  };

  const getMonthsOfWork = (joinDate) => {
    const join = new Date(joinDate);
    const end = new Date(`${selectedYear}-${String(months.indexOf(selectedMonth) + 1).padStart(2, '0')}-20`);
    const years = end.getFullYear() - join.getFullYear();
    return (years * 12) + (end.getMonth() - join.getMonth());
  };

  const getMealRate = (department, joinDate) => {
    const monthsWorked = getMonthsOfWork(joinDate);
    
    if (department === 'AM') return { base_amount: 400, prorate_per_day: 15 };
    if (department === 'CAPTAIN') return { base_amount: 350, prorate_per_day: 13 };
    
    if (department === 'CS DP WD') {
      if (monthsWorked >= 36) return { base_amount: 325, prorate_per_day: 12 };
      if (monthsWorked >= 24) return { base_amount: 300, prorate_per_day: 11 };
      return { base_amount: 275, prorate_per_day: 10 };
    }
    return null;
  };

  const getPreviousMonthData = (month, year) => {
    const monthIndex = months.indexOf(month);
    if (monthIndex === 0) {
      return { 
        month: 'December', 
        year: parseInt(year) - 1,
        start: `${parseInt(year) - 1}-12-21`,
        end: `${year}-01-20`
      };
    } else {
      const prevMonthIndex = monthIndex - 1;
      return { 
        month: months[prevMonthIndex], 
        year: parseInt(year),
        start: `${year}-${String(prevMonthIndex + 1).padStart(2, '0')}-21`,
        end: `${year}-${String(monthIndex).padStart(2, '0')}-20`
      };
    }
  };

  const hitungUSIA = (officerName, schedule = scheduleData) => {
    const totals = {
      OFF: 0, SAKIT: 0, IZIN: 0, ABSEN: 0, CUTI: 0,
      'UNPAID LEAVE': 0, SPECIAL: 0, DIRUMAHKAN: 0,
      RESIGN: 0, TERMINATED: 0, 'BELUM JOIN': 0
    };
    
    schedule.forEach(day => {
      const status = day[officerName];
      if (!status) return;
      if (totals.hasOwnProperty(status)) {
        totals[status] += 1;
      }
    });

    return {
      sakit: totals['SAKIT'] || 0,
      izin: totals['IZIN'] || 0,
      unpaid: totals['UNPAID LEAVE'] || 0,
      alpha: totals['ABSEN'] || 0,
      cuti: totals['CUTI'] || 0,
      off: totals['OFF'] || 0
    };
  };

  useEffect(() => {
    getCurrentMonthByCutoff();
  }, []);

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
    setEditingOfficer(null);
    setEditForm({ kasbon: 0, cuti: 0, etc: 0, etc_note: '' });
  }, [selectedMonth, selectedYear]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    setLastSync(new Date());
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (selectedMonth === 'January') {
        setOfficers([]);
        setLoading(false);
        return;
      }
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      const prev = getPreviousMonthData(selectedMonth, selectedYear);
      
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      const scheduleResponse = await fetch(
        `/api/schedule?year=${prev.year}&month=${prev.month}`
      );
      const scheduleResult = await scheduleResponse.json();
      const schedule = scheduleResult.data || [];
      setScheduleData(schedule);
      
      const { data: snapData } = await supabase
        .from('meal_allowance_snapshot')
        .select('*')
        .eq('bulan', bulan);
      
      const { data: adminData } = await supabase
        .from('officers')
        .select('id, full_name, email')
        .eq('role', 'admin');
      
      const adminMap = {};
      adminData?.forEach(a => { adminMap[a.id] = a.full_name || a.email; });
      
      const officersWithStats = (officersData || []).map(officer => {
        const usia = hitungUSIA(officer.full_name, schedule);
        const snapshot = snapData?.find(s => s.officer_id === officer.id);
        const { bank, rek, link } = formatBankAndRek(officer.bank_account || '');
        const rate = getMealRate(officer.department, officer.join_date);
        
        return {
          id: officer.id,
          no: 0,
          full_name: officer.full_name,
          department: officer.department,
          join_date: officer.join_date,
          baseAmount: rate?.base_amount || 0,
          prorate: rate?.prorate_per_day || 0,
          offCount: usia.off,
          sakitCount: usia.sakit,
          izinCount: usia.izin,
          unpaidCount: usia.unpaid,
          alphaCount: usia.alpha,
          cutiCount: snapshot?.cuti_count || 0,
          kasbon: snapshot?.kasbon || 0,
          etc: snapshot?.etc || 0,
          etc_note: snapshot?.etc_note || '',
          bank: bank,
          rek: rek,
          link: link,
          lastEditedBy: snapshot?.last_edited_by ? adminMap[snapshot.last_edited_by] : null,
          lastEditedAt: snapshot?.last_edited_at || null,
          is_paid: snapshot?.is_paid || false,
          paid_at: snapshot?.paid_at || null,
          paid_by: snapshot?.paid_by ? adminMap[snapshot.paid_by] : null,
          is_locked: snapshot?.is_locked || false,
          prorate_disabled: snapshot?.prorate_disabled || false
        };
      });
      
      const withUmNet = officersWithStats
        .map((o, index) => {
          const offDiambil = o.offCount || 0;
          const offTidakDiambil = Math.max(0, JATAH_OFF_PER_PERIODE - offDiambil);
          
          let uangProrate = offTidakDiambil * o.prorate;
          if (o.prorate_disabled && o.department !== 'CS DP WD') {
            uangProrate = 0;
          }
          
          const potongan = (o.sakitCount + o.izinCount + o.unpaidCount + o.cutiCount) * o.prorate;
          const denda = o.alphaCount * 50;
          const umNet = Math.max(0, o.baseAmount + uangProrate - potongan - denda);
          const finalNet = Math.max(0, umNet - (o.kasbon || 0) + (o.etc || 0));
          
          return { 
            ...o, 
            no: index + 1,
            umNet,
            finalNet,
            offTaken: offDiambil,
            offRemaining: offTidakDiambil,
            uangProrate
          };
        })
        .filter(o => {
          if (!isAdmin) return o.department === 'CS DP WD';
          return selectedDept === 'All' || o.department === selectedDept;
        })
        .filter(o => o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      setOfficers(withUmNet);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (officer) => {
    if (!isAdmin) return;
    if (officer.is_locked) {
      alert('Data ini sudah terkunci karena sudah PAID');
      return;
    }
    setEditingOfficer(officer);
    setEditForm({
      kasbon: officer.kasbon || 0,
      cuti: officer.cutiCount || 0,
      etc: officer.etc || 0,
      etc_note: officer.etc_note || ''
    });
  };

  const handleEditSave = async () => {
    if (!isAdmin) return;
    if (editingOfficer.is_locked) {
      alert('Data ini sudah terkunci karena sudah PAID');
      setEditingOfficer(null);
      return;
    }
    
    try {
      if (editForm.kasbon < 0 || editForm.cuti < 0) {
        alert('⚠️ Kasbon dan Cuti tidak boleh negatif');
        return;
      }
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      const officer = editingOfficer;
      const prev = getPreviousMonthData(selectedMonth, selectedYear);
      
      const offDiambil = officer.offCount || 0;
      const offTidakDiambil = Math.max(0, JATAH_OFF_PER_PERIODE - offDiambil);
      
      let uangProrate = offTidakDiambil * officer.prorate;
      if (officer.prorate_disabled && officer.department !== 'CS DP WD') {
        uangProrate = 0;
      }
      
      const potongan = (officer.sakitCount + editForm.cuti + officer.izinCount + officer.unpaidCount) * officer.prorate;
      const denda = officer.alphaCount * 50;
      const umNetBaru = Math.max(0, officer.baseAmount + uangProrate - potongan - denda);
      const finalNetBaru = Math.max(0, umNetBaru - editForm.kasbon + editForm.etc);
      
      let adminName = 'Unknown';
      let adminId = null;
      
      if (user?.email) {
        const { data: adminData } = await supabase
          .from('officers')
          .select('id, full_name')
          .ilike('email', user.email)
          .maybeSingle();
        
        if (adminData) {
          adminName = adminData.full_name || user.email;
          adminId = adminData.id;
        } else {
          adminName = user.email;
        }
      }
      
      const snapshotData = {
        officer_id: officer.id,
        officer_name: officer.full_name,
        department: officer.department,
        join_date: officer.join_date,
        bulan: bulan,
        periode_start: prev.start,
        periode_end: prev.end,
        base_amount: officer.baseAmount,
        prorate: officer.prorate,
        off_count: officer.offCount || 0,
        sakit_count: officer.sakitCount || 0,
        cuti_count: editForm.cuti,
        izin_count: officer.izinCount || 0,
        unpaid_count: officer.unpaidCount || 0,
        alpha_count: officer.alphaCount || 0,
        um_net: umNetBaru,
        kasbon: editForm.kasbon,
        etc: editForm.etc || 0,
        etc_note: editForm.etc_note,
        last_edited_by: adminId,
        last_edited_at: new Date().toISOString(),
        is_paid: officer.is_paid,
        paid_at: officer.paid_at,
        paid_by: officer.is_paid ? adminId : null,
        is_locked: officer.is_locked,
        prorate_disabled: officer.prorate_disabled
      };
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .upsert(snapshotData, { onConflict: 'officer_id, bulan' });
      
      if (error) throw error;
      
      await fetchData();
      
      alert(`✅ Data berhasil diupdate oleh ${adminName}`);
      setEditingOfficer(null);
      
    } catch (error) {
      console.error('Error updating:', error);
      alert('❌ Gagal update data: ' + error.message);
    }
  };

  const togglePaymentStatus = async (officerId) => {
    if (!isAdmin) return;

    try {
      const officer = officers.find(o => o.id === officerId);
      if (!officer) return;

      const newPaidStatus = !officer.is_paid;
      const bulan = `${selectedMonth} ${selectedYear}`;
      
      let adminId = null;
      let adminName = 'Admin';
      
      if (user?.email) {
        const { data: adminData } = await supabase
          .from('officers')
          .select('id, full_name')
          .ilike('email', user.email)
          .maybeSingle();
        
        if (adminData) {
          adminId = adminData.id;
          adminName = adminData.full_name || user.email;
        }
      }

      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .update({
          is_paid: newPaidStatus,
          paid_at: newPaidStatus ? new Date().toISOString() : null,
          paid_by: newPaidStatus ? adminId : null,
          is_locked: newPaidStatus
        })
        .eq('officer_id', officerId)
        .eq('bulan', bulan);

      if (error) throw error;

      await fetchData();

    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Gagal mengupdate status pembayaran');
    }
  };

  const toggleProrate = async (officer) => {
    if (!isAdmin) return;
    if (officer.department === 'CS DP WD') {
      alert('CS DP WD tidak bisa diubah proratenya');
      return;
    }
    if (officer.is_locked) {
      alert('Data sudah terkunci');
      return;
    }
    
    try {
      const bulan = `${selectedMonth} ${selectedYear}`;
      const newStatus = !officer.prorate_disabled;
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .upsert({
          officer_id: officer.id,
          officer_name: officer.full_name,
          department: officer.department,
          bulan: bulan,
          prorate_disabled: newStatus,
          last_edited_by: user?.id,
          last_edited_at: new Date().toISOString()
        }, { onConflict: 'officer_id, bulan' });
      
      if (error) throw error;
      
      await fetchData();
      
      alert(`✅ Prorate ${newStatus ? 'dihapus' : 'diaktifkan'} untuk ${officer.full_name}`);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal update prorate');
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
          <p className="mt-4 text-[#FFD700]">Loading data...</p>
        </div>
      </div>
    );
  }

  if (selectedMonth === 'January') {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <Link href="/dashboard/financial" className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Financial</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[#FFD700]">MEAL ALLOWANCE</h1>
            <p className="text-[#A7D8FF] mt-1">January 2026 - Data Kosong</p>
          </div>
        </div>
        <div className="text-center py-20 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30">
          <p className="text-[#A7D8FF] text-lg">🔮 Belum ada data untuk bulan January</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/financial" className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#FFD700]">MEAL ALLOWANCE</h1>
          <p className="text-[#A7D8FF] mt-1">
            {isAdmin ? '👑 Admin Mode' : '👤 Staff Mode'} - {selectedMonth} {selectedYear}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Syncing...' : 'Refresh & Sync'}</span>
        </button>
      </div>

      <div className="mb-4 p-3 bg-[#0B1A33] rounded-lg border border-[#FFD700]/20 text-xs text-[#A7D8FF]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#FFD700] font-bold">💡 INFO:</span>
          <span>Setelah edit data, silahkan klik</span>
          <span className="text-[#FFD700] font-medium">Refresh & Sync</span>
          <span>terlebih dahulu untuk save</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-wrap gap-4 bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
        <select className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        <select className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        <select className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} disabled={!isAdmin}>
          {availableDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
        <input 
          type="text" 
          placeholder="Cari nama..." 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1 min-w-[200px]" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        
        <div className="text-xs text-[#A7D8FF] flex items-center gap-2 ml-auto">
          <span>Last sync:</span>
          <span className="text-[#FFD700] font-medium">{lastSync.toLocaleTimeString()}</span>
          <span className="text-green-400">✓</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Officer</div>
          <div className="text-2xl font-bold text-[#FFD700]">{officers.length}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total NET</div>
          <div className="text-2xl font-bold text-[#FFD700]">
            ${Math.round(officers.reduce((sum, o) => sum + (o.finalNet || 0), 0))}
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Paid / Unpaid</div>
          <div className="flex gap-3 text-lg font-bold">
            <span className="text-green-400">{officers.filter(o => o.is_paid).length}</span>
            <span className="text-gray-400">/</span>
            <span className="text-red-400">{officers.filter(o => !o.is_paid).length}</span>
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Periode Data</div>
          <div className="text-sm font-medium text-white">
            {getPreviousMonthData(selectedMonth, selectedYear).month} {getPreviousMonthData(selectedMonth, selectedYear).year}
          </div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">No.</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">Nama</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">Jabatan</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">Tgl Join</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">Masa Kerja</th>
              <th colSpan="2" className="px-3 py-2 text-center text-[#FFD700] font-bold border-r border-[#FFD700]/30">POKOK UM</th>
              <th colSpan="6" className="px-3 py-2 text-center text-[#FFD700] font-bold border-r border-[#FFD700]/30">KEHADIRAN</th>
              <th colSpan="5" className="px-3 py-2 text-center text-[#FFD700] font-bold border-r border-[#FFD700]/30">Potongan</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">UM</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">KASBON</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">U.M NET</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold border-r border-[#FFD700]/30">NAMA BANK</th>
              <th rowSpan="2" className="px-3 py-3 text-left text-[#FFD700] font-bold">NO REK / BARCODE</th>
            </tr>
            <tr className="border-b border-[#FFD700]/30">
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">/ DAY</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">PRORATE</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">OFF</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">CUTI</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">UNPAID</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">SAKIT</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">IZIN</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">ABSEN</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">CUTI</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">UNPAID</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">SAKIT</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">IZIN</th>
              <th className="px-3 py-2 text-center text-[#A7D8FF] text-xs border-r border-[#FFD700]/30">ABSEN</th>
            </tr>
          </thead>
          
          <tbody>
            {officers.map((officer) => (
              <tr key={officer.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10">{officer.no}</td>
                
                <td className="px-3 py-2 border-r border-[#FFD700]/10">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#FFD700]">{officer.full_name}</span>
                    
                    {officer.offRemaining > 0 && (
                      <span className="text-[10px] text-green-400 mt-1">
                        +${officer.uangProrate} (prorate {officer.offRemaining} hari) {officer.department !== 'CS DP WD' && '(HAPUS)'}
                      </span>
                    )}
                    
                    {officer.is_paid && (
                      <span className="text-[10px] text-green-400 mt-1">✓ PAID</span>
                    )}
                    
                    {!officer.is_paid && isAdmin && (
                      <button
                        onClick={() => togglePaymentStatus(officer.id)}
                        className="text-[10px] bg-gray-600 hover:bg-gray-700 text-white px-2 py-0.5 rounded mt-1 w-fit"
                      >
                        Mark Paid
                      </button>
                    )}
                    
                    {isAdmin && (
                      <button
                        onClick={() => handleEditClick(officer)}
                        disabled={officer.is_locked}
                        className={`text-[10px] mt-1 px-2 py-0.5 rounded w-fit ${
                          officer.is_locked 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#FFD700] text-black hover:bg-[#FFD700]/80'
                        }`}
                      >
                        Edit
                      </button>
                    )}

                    {isAdmin && officer.department !== 'CS DP WD' && !officer.prorate_disabled && (
                      <button
                        onClick={() => toggleProrate(officer)}
                        disabled={officer.is_locked}
                        className="text-[10px] mt-1 px-2 py-0.5 rounded w-fit bg-red-500/20 text-red-400 border border-red-400/30"
                      >
                        Hapus Prorate
                      </button>
                    )}

                    {isAdmin && officer.department !== 'CS DP WD' && officer.prorate_disabled && (
                      <button
                        onClick={() => toggleProrate(officer)}
                        disabled={officer.is_locked}
                        className="text-[10px] mt-1 px-2 py-0.5 rounded w-fit bg-green-500/20 text-green-400 border border-green-400/30"
                      >
                        Aktifkan Prorate
                      </button>
                    )}
                  </div>
                </td>
                
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10">{officer.department}</td>
                
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10">
                  {new Date(officer.join_date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </td>
                
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10">
                  <span className="bg-[#0B1A33] px-2 py-1 rounded text-[#FFD700] font-medium">
                    {hitungMasaKerja(officer.join_date)}
                  </span>
                </td>
                
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.prorate}</td>
                
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center">
                  {officer.offRemaining > 0 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 font-bold">
                        +${officer.offRemaining * officer.prorate}
                      </span>
                      <span className="text-[9px] text-[#A7D8FF]">
                        ({officer.offRemaining} hari) {officer.department !== 'CS DP WD' && '(HAPUS)'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.offCount || 0}</td>
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.cutiCount}</td>
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.unpaidCount}</td>
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.sakitCount}</td>
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.izinCount}</td>
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10 text-center">{officer.alphaCount}</td>
                
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center text-red-400">
                  {officer.cutiCount > 0 ? officer.cutiCount * officer.prorate : ''}
                </td>
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center text-red-400">
                  {officer.unpaidCount > 0 ? officer.unpaidCount * officer.prorate : ''}
                </td>
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center text-red-400">
                  {officer.sakitCount > 0 ? officer.sakitCount * officer.prorate : ''}
                </td>
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center text-red-400">
                  {officer.izinCount > 0 ? officer.izinCount * officer.prorate : ''}
                </td>
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center text-red-400">
                  {officer.alphaCount > 0 ? officer.alphaCount * 50 : ''}
                </td>
                
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center font-medium text-white">
                  ${officer.baseAmount}
                </td>
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center font-medium text-red-400">
                  {officer.kasbon > 0 ? `$${officer.kasbon}` : ''}
                </td>
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center font-bold text-[#FFD700]">
                  ${officer.finalNet}
                </td>
                
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-white">{officer.bank}</td>
                <td className="px-3 py-2 text-white">
                  <div className="flex flex-col">
                    <span>{officer.rek}</span>
                    {officer.link && (
                      <a href={officer.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#FFD700] hover:underline mt-1">
                        Link QRIS
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-4 p-3 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 text-xs text-[#A7D8FF] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span>Total: {officers.length} officers</span>
          <span className="flex items-center gap-1 text-green-400">
            <span>⬆️</span> Live edit
          </span>
          <span className="flex items-center gap-1 text-[#FFD700]">
            <span>⬇️</span> Refresh sync
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <span>Last sync: {lastSync.toLocaleString()}</span>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[#FFD700] hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <svg className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingOfficer && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">Edit {editingOfficer.full_name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">KASBON ( - )</label>
                <input 
                  type="number" 
                  value={editForm.kasbon} 
                  onChange={(e) => setEditForm({...editForm, kasbon: parseInt(e.target.value) || 0})} 
                  className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                  min="0"
                />
              </div>
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">CUTI (hari)</label>
                <input 
                  type="number" 
                  value={editForm.cuti} 
                  onChange={(e) => setEditForm({...editForm, cuti: parseInt(e.target.value) || 0})} 
                  className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                  min="0"
                />
                <div className="flex gap-4 mt-1 text-[10px] text-[#A7D8FF]">
                  <span>OFF diambil: {editingOfficer.offCount || 0}/{JATAH_OFF_PER_PERIODE}</span>
                  <span>Sisa off: {Math.max(0, JATAH_OFF_PER_PERIODE - (editingOfficer.offCount || 0))}</span>
                </div>
              </div>
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">ETC (+/-)</label>
                <input 
                  type="number" 
                  value={editForm.etc} 
                  onChange={(e) => setEditForm({...editForm, etc: parseInt(e.target.value) || 0})} 
                  className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                />
              </div>
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">Keterangan</label>
                <input 
                  type="text" 
                  value={editForm.etc_note} 
                  onChange={(e) => setEditForm({...editForm, etc_note: e.target.value})} 
                  className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                  placeholder="Misal: Koreksi, Bonus, Denda"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button onClick={handleEditSave} className="flex-1 bg-[#FFD700] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FFD700]/80">
                  Simpan
                </button>
                <button onClick={() => setEditingOfficer(null)} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600">
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