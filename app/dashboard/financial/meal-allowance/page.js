'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function MealAllowancePage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('February');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedDept, setSelectedDept] = useState('All');
  const [scheduleData, setScheduleData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableDepartments, setAvailableDepartments] = useState(['All', 'AM', 'CAPTAIN', 'CS DP WD']);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({
    kasbon: 0,
    cuti: 0,
    etc: 0,
    etc_note: '',
    // Manual untuk CAPTAIN (karena ga ada di schedule)
    off_day: 4, // Default 4 (jatah penuh)
    off_taken: 0, // OFF yang diambil
    sakit: 0,
    izin: 0,
    unpaid: 0,
    alpha: 0,
    // Manual override untuk semua department
    off_day_manual: false,
    off_day_count_manual: 0,
    prorate_manual: false,
    prorate_value_manual: 0,
    base_amount_manual: false,
    base_amount_value_manual: 0,
    sakit_manual: false,
    sakit_count_manual: 0,
    izin_manual: false,
    izin_count_manual: 0,
    unpaid_manual: false,
    unpaid_count_manual: 0,
    alpha_manual: false,
    alpha_count_manual: 0
  });
  const [lastSync, setLastSync] = useState(new Date());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

  // Jatah OFF per periode (21 - 20) = 4 hari
  const JATAH_OFF_PER_PERIODE = 4;

  // ===========================================
  // AUTO-SELECT BULAN BERDASARKAN TANGGAL (CUTOFF 20)
  // ===========================================
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
      
      return {
        month: months[nextMonthIndex],
        year: nextYear.toString()
      };
    } else {
      return {
        month: months[currentMonthIndex],
        year: currentYear.toString()
      };
    }
  };

  // ===========================================
  // INITIAL SETUP
  // ===========================================
  useEffect(() => {
    const { month, year } = getCurrentMonthByCutoff();
    setSelectedMonth(month);
    setSelectedYear(year);
    setInitialLoad(false);
  }, []);

  // ===========================================
  // SET DEPARTMENTS BERDASARKAN ROLE
  // ===========================================
  useEffect(() => {
    if (!initialLoad) {
      if (!isAdmin) {
        setAvailableDepartments(['CS DP WD']);
        setSelectedDept('CS DP WD');
      } else {
        setAvailableDepartments(['All', 'AM', 'CAPTAIN', 'CS DP WD']);
        setSelectedDept('All');
      }
    }
  }, [isAdmin, initialLoad]);

  // ===========================================
  // FETCH DATA
  // ===========================================
  useEffect(() => {
    if (!initialLoad) {
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedMonth, selectedYear, initialLoad]);

  // ===========================================
  // HITUNG MASA KERJA
  // ===========================================
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

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    setLastSync(new Date());
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setDataLoaded(false);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (selectedMonth === 'January') {
        setOfficers([]);
        setLoading(false);
        setDataLoaded(true);
        return;
      }
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      const prev = getPreviousMonthData(selectedMonth, selectedYear);
      
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      // Fetch schedule hanya untuk CS DP WD dan AM (karena CAPTAIN ga ada di schedule)
      let schedule = [];
      if (selectedDept === 'All' || selectedDept === 'CS DP WD' || selectedDept === 'AM') {
        const scheduleResponse = await fetch(
          `/api/schedule?year=${prev.year}&month=${prev.month}`
        );
        const scheduleResult = await scheduleResponse.json();
        schedule = scheduleResult.data || [];
      }
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
        // Hitung usia dari schedule (untuk CS DP WD dan AM)
        const usia = officer.department === 'CAPTAIN' 
          ? { sakit: 0, izin: 0, unpaid: 0, alpha: 0, cuti: 0, off: 0 } // CAPTAIN manual semua
          : hitungUSIA(officer.full_name, schedule);
        
        const snapshot = snapData?.find(s => s.officer_id === officer.id);
        const { bank, rek, link } = formatBankAndRek(officer.bank_account || '');
        const rate = getMealRate(officer.department, officer.join_date);
        
        return {
          id: officer.id,
          no: 0,
          full_name: officer.full_name,
          department: officer.department,
          join_date: officer.join_date,
          baseAmount: snapshot?.base_amount_manual ? snapshot.base_amount_value_manual : (rate?.base_amount || 0),
          prorate: snapshot?.prorate_manual ? snapshot.prorate_value_manual : (rate?.prorate_per_day || 0),
          // Data kehadiran - priority: manual snapshot > otomatis dari schedule
          offCount: officer.department === 'CAPTAIN' 
            ? (snapshot?.off_day_count_manual || 4) // Default CAPTAIN 4 hari
            : (snapshot?.off_manual ? snapshot.off_day_count_manual : (usia.off || 0)),
          sakitCount: snapshot?.sakit_manual ? snapshot.sakit_count_manual : (usia.sakit || 0),
          izinCount: snapshot?.izin_manual ? snapshot.izin_count_manual : (usia.izin || 0),
          unpaidCount: snapshot?.unpaid_manual ? snapshot.unpaid_count_manual : (usia.unpaid || 0),
          alphaCount: snapshot?.alpha_manual ? snapshot.alpha_count_manual : (usia.alpha || 0),
          cutiCount: snapshot?.cuti_count || 0,
          kasbon: snapshot?.kasbon || 0,
          etc: snapshot?.etc || 0,
          etc_note: snapshot?.etc_note || '',
          // Manual override flags
          off_manual: snapshot?.off_manual || false,
          off_day_count_manual: snapshot?.off_day_count_manual || 0,
          prorate_manual: snapshot?.prorate_manual || false,
          prorate_value_manual: snapshot?.prorate_value_manual || 0,
          base_amount_manual: snapshot?.base_amount_manual || false,
          base_amount_value_manual: snapshot?.base_amount_value_manual || 0,
          sakit_manual: snapshot?.sakit_manual || false,
          sakit_count_manual: snapshot?.sakit_count_manual || 0,
          izin_manual: snapshot?.izin_manual || false,
          izin_count_manual: snapshot?.izin_count_manual || 0,
          unpaid_manual: snapshot?.unpaid_manual || false,
          unpaid_count_manual: snapshot?.unpaid_count_manual || 0,
          alpha_manual: snapshot?.alpha_manual || false,
          alpha_count_manual: snapshot?.alpha_count_manual || 0,
          bank: bank,
          rek: rek,
          link: link,
          lastEditedBy: snapshot?.last_edited_by ? adminMap[snapshot.last_edited_by] : null,
          lastEditedAt: snapshot?.last_edited_at || null,
          is_paid: snapshot?.is_paid || false,
          paid_at: snapshot?.paid_at || null,
          paid_by: snapshot?.paid_by ? adminMap[snapshot.paid_by] : null,
          is_locked: snapshot?.is_locked || false
        };
      });
      
      // 🧮 HITUNG dengan LOGIC yang sama untuk semua department
      const withUmNet = officersWithStats
        .map((o, index) => {
          // Prorate = OFF yang TIDAK diambil
          const offDiambil = o.offCount || 0;
          const offRemaining = Math.max(0, JATAH_OFF_PER_PERIODE - offDiambil);
          const uangProrate = offRemaining * o.prorate;
          
          // Potongan dari ketidakhadiran (sakit, izin, unpaid, cuti)
          const potongan = (o.sakitCount + o.izinCount + o.unpaidCount + o.cutiCount) * o.prorate;
          
          // Denda absen (khusus alpha)
          const denda = o.alphaCount * 50;
          
          // UM = Base + uangProrate - potongan - denda
          const umNet = Math.max(0, o.baseAmount + uangProrate - potongan - denda);
          const finalNet = Math.max(0, umNet - (o.kasbon || 0) + (o.etc || 0));
          
          return { 
            ...o, 
            no: index + 1,
            umNet,
            finalNet,
            offRemaining,
            uangProrate
          };
        })
        .filter(o => {
          if (!isAdmin) return o.department === 'CS DP WD';
          return selectedDept === 'All' || o.department === selectedDept;
        })
        .filter(o => o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      setOfficers(withUmNet);
      setDataLoaded(true);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // EDIT HANDLERS
  // ===========================================

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
      etc_note: officer.etc_note || '',
      // Data kehadiran
      off_day: 4, // Default jatah
      off_taken: officer.offCount || 0,
      sakit: officer.sakitCount || 0,
      izin: officer.izinCount || 0,
      unpaid: officer.unpaidCount || 0,
      alpha: officer.alphaCount || 0,
      // Manual override flags
      off_day_manual: officer.off_manual || false,
      off_day_count_manual: officer.off_day_count_manual || officer.offCount || 0,
      prorate_manual: officer.prorate_manual || false,
      prorate_value_manual: officer.prorate_value_manual || officer.prorate || 0,
      base_amount_manual: officer.base_amount_manual || false,
      base_amount_value_manual: officer.base_amount_value_manual || officer.baseAmount || 0,
      sakit_manual: officer.sakit_manual || false,
      sakit_count_manual: officer.sakit_count_manual || officer.sakitCount || 0,
      izin_manual: officer.izin_manual || false,
      izin_count_manual: officer.izin_count_manual || officer.izinCount || 0,
      unpaid_manual: officer.unpaid_manual || false,
      unpaid_count_manual: officer.unpaid_count_manual || officer.unpaidCount || 0,
      alpha_manual: officer.alpha_manual || false,
      alpha_count_manual: officer.alpha_count_manual || officer.alphaCount || 0
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
      
      // Ambil nilai berdasarkan manual atau tidak
      const baseAmount = editForm.base_amount_manual ? editForm.base_amount_value_manual : officer.baseAmount;
      const prorateValue = editForm.prorate_manual ? editForm.prorate_value_manual : officer.prorate;
      const offCount = editForm.off_day_manual ? editForm.off_day_count_manual : officer.offCount;
      const sakitCount = editForm.sakit_manual ? editForm.sakit_count_manual : officer.sakitCount;
      const izinCount = editForm.izin_manual ? editForm.izin_count_manual : officer.izinCount;
      const unpaidCount = editForm.unpaid_manual ? editForm.unpaid_count_manual : officer.unpaidCount;
      const alphaCount = editForm.alpha_manual ? editForm.alpha_count_manual : officer.alphaCount;
      
      // Hitung ulang
      const offRemaining = Math.max(0, JATAH_OFF_PER_PERIODE - offCount);
      const uangProrate = offRemaining * prorateValue;
      const potongan = (sakitCount + izinCount + unpaidCount + editForm.cuti) * prorateValue;
      const denda = alphaCount * 50;
      const umNetBaru = Math.max(0, baseAmount + uangProrate - potongan - denda);
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
        base_amount: baseAmount,
        prorate: prorateValue,
        off_count: offCount,
        sakit_count: sakitCount,
        cuti_count: editForm.cuti,
        izin_count: izinCount,
        unpaid_count: unpaidCount,
        alpha_count: alphaCount,
        um_net: umNetBaru,
        kasbon: editForm.kasbon,
        etc: editForm.etc || 0,
        etc_note: editForm.etc_note,
        // Manual override flags
        off_manual: editForm.off_day_manual,
        off_day_count_manual: editForm.off_day_manual ? editForm.off_day_count_manual : null,
        prorate_manual: editForm.prorate_manual,
        prorate_value_manual: editForm.prorate_manual ? editForm.prorate_value_manual : null,
        base_amount_manual: editForm.base_amount_manual,
        base_amount_value_manual: editForm.base_amount_manual ? editForm.base_amount_value_manual : null,
        sakit_manual: editForm.sakit_manual,
        sakit_count_manual: editForm.sakit_manual ? editForm.sakit_count_manual : null,
        izin_manual: editForm.izin_manual,
        izin_count_manual: editForm.izin_manual ? editForm.izin_count_manual : null,
        unpaid_manual: editForm.unpaid_manual,
        unpaid_count_manual: editForm.unpaid_manual ? editForm.unpaid_count_manual : null,
        alpha_manual: editForm.alpha_manual,
        alpha_count_manual: editForm.alpha_manual ? editForm.alpha_count_manual : null,
        last_edited_by: adminId,
        last_edited_at: new Date().toISOString(),
        is_paid: officer.is_paid,
        paid_at: officer.paid_at,
        paid_by: officer.is_paid ? adminId : null,
        is_locked: officer.is_locked
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

  // ===========================================
  // RENDER LOADING STATE
  // ===========================================
  if (loading && !refreshing && initialLoad) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD700] border-t-transparent mb-4"></div>
        <div className="text-[#FFD700] text-lg font-semibold animate-pulse">
          Initializing Meal Allowance...
        </div>
        <div className="text-[#A7D8FF] text-sm mt-2">
          Setting period: {selectedMonth} {selectedYear}
        </div>
        <div className="mt-4 flex gap-2">
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  if (loading && !refreshing) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD700] border-t-transparent mb-4"></div>
        <div className="text-[#FFD700] text-lg font-semibold animate-pulse">
          Loading meal allowance data...
        </div>
        <div className="text-[#A7D8FF] text-sm mt-2">
          {selectedMonth} {selectedYear}
        </div>
        <div className="mt-4 text-[#A7D8FF] text-sm">
          Fetching officers and schedule...
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
        <Link href="/dashboard/financial" className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 hover:scale-105">
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
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Syncing...' : 'Refresh & Sync'}</span>
        </button>
      </div>

      {/* Loading Overlay untuk Refresh */}
      {refreshing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0B1A33] p-6 rounded-lg border-2 border-[#FFD700]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FFD700] border-t-transparent mb-4 mx-auto"></div>
            <p className="text-[#FFD700] font-semibold">Syncing data...</p>
            <p className="text-[#A7D8FF] text-sm mt-2">Please wait</p>
          </div>
        </div>
      )}

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
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300" 
          value={selectedMonth} 
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300" 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300" 
          value={selectedDept} 
          onChange={(e) => setSelectedDept(e.target.value)} 
          disabled={!isAdmin}
        >
          {availableDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
        
        <input 
          type="text" 
          placeholder="Cari nama..." 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50 transition-all duration-300" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        
        <div className="text-xs text-[#A7D8FF] flex items-center gap-2 ml-auto">
          <span>Last sync:</span>
          <span className="text-[#FFD700] font-medium">{lastSync.toLocaleTimeString()}</span>
          {dataLoaded && <span className="text-green-400">✓</span>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Officer</div>
          <div className="text-2xl font-bold text-[#FFD700]">{officers.length}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total NET</div>
          <div className="text-2xl font-bold text-[#FFD700]">
            ${Math.round(officers.reduce((sum, o) => sum + (o.finalNet || 0), 0))}
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Paid / Unpaid</div>
          <div className="flex gap-3 text-lg font-bold">
            <span className="text-green-400">{officers.filter(o => o.is_paid).length}</span>
            <span className="text-gray-400">/</span>
            <span className="text-red-400">{officers.filter(o => !o.is_paid).length}</span>
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
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
            {officers.map((officer, index) => (
              <tr 
                key={officer.id} 
                className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 transition-all duration-300 animate-slideIn"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-3 py-2 text-white border-r border-[#FFD700]/10">{officer.no}</td>
                
                <td className="px-3 py-2 border-r border-[#FFD700]/10">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#FFD700]">{officer.full_name}</span>
                    
                    {/* Tanda manual override */}
                    {officer.off_manual && (
                      <span className="text-[10px] text-yellow-400 mt-0.5">
                        ✏️ OFF Manual: {officer.off_day_count_manual} hari
                      </span>
                    )}
                    {officer.prorate_manual && (
                      <span className="text-[10px] text-yellow-400 mt-0.5">
                        ✏️ Prorate Manual: ${officer.prorate_value_manual}/hari
                      </span>
                    )}
                    {officer.base_amount_manual && (
                      <span className="text-[10px] text-yellow-400 mt-0.5">
                        ✏️ Base Manual: ${officer.base_amount_value_manual}
                      </span>
                    )}
                    {officer.sakit_manual && (
                      <span className="text-[10px] text-yellow-400 mt-0.5">
                        ✏️ Sakit Manual: {officer.sakit_count_manual}
                      </span>
                    )}
                    {officer.izin_manual && (
                      <span className="text-[10px] text-yellow-400 mt-0.5">
                        ✏️ Izin Manual: {officer.izin_count_manual}
                      </span>
                    )}
                    
                    {/* Info prorate */}
                    {officer.offRemaining > 0 && (
                      <span className="text-[10px] text-green-400 mt-1 animate-pulse">
                        +${officer.uangProrate} (prorate {officer.offRemaining} hari)
                      </span>
                    )}
                    
                    {officer.is_paid && (
                      <span className="text-[10px] text-green-400 mt-1">✓ PAID</span>
                    )}
                    
                    {!officer.is_paid && isAdmin && (
                      <button
                        onClick={() => togglePaymentStatus(officer.id)}
                        className="text-[10px] bg-gray-600 hover:bg-gray-700 text-white px-2 py-0.5 rounded mt-1 w-fit transition-all duration-300 hover:scale-105"
                      >
                        Mark Paid
                      </button>
                    )}
                    
                    {isAdmin && (
                      <button
                        onClick={() => handleEditClick(officer)}
                        disabled={officer.is_locked}
                        className={`text-[10px] mt-1 px-2 py-0.5 rounded w-fit transition-all duration-300 hover:scale-105 ${
                          officer.is_locked 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-[#FFD700] text-black hover:bg-[#FFD700]/80'
                        }`}
                      >
                        Edit
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
                
                {/* PRORATE - Uang dari OFF yang tidak diambil */}
                <td className="px-3 py-2 border-r border-[#FFD700]/10 text-center">
                  {officer.offRemaining > 0 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-green-400 font-bold">
                        +${officer.offRemaining * officer.prorate}
                      </span>
                      <span className="text-[9px] text-[#A7D8FF]">
                        (sisa {officer.offRemaining} off)
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
          <span className="flex items-center gap-1 text-yellow-400">
            <span>✏️</span> Manual override
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <span>Last sync: {lastSync.toLocaleString()}</span>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-[#FFD700] hover:underline flex items-center gap-1 disabled:opacity-50 transition-all duration-300"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 max-w-4xl w-full transform scale-100 transition-all duration-300 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">
              Edit {editingOfficer.full_name} 
              <span className="text-sm text-[#A7D8FF] ml-2">({editingOfficer.department})</span>
            </h3>
            
            <div className="space-y-6">
              {/* Section: Manual Override untuk semua data */}
              <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
                <h4 className="text-[#FFD700] font-semibold mb-3">⚙️ MANUAL OVERRIDE</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Base Amount Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.base_amount_manual} 
                        onChange={(e) => setEditForm({...editForm, base_amount_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual Base Amount</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: ${editingOfficer.baseAmount}</div>
                    {editForm.base_amount_manual && (
                      <input 
                        type="number" 
                        value={editForm.base_amount_value_manual} 
                        onChange={(e) => setEditForm({...editForm, base_amount_value_manual: parseInt(e.target.value) || 0})} 
                        className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                        min="0"
                        placeholder="Base amount"
                      />
                    )}
                  </div>
                  
                  {/* Prorate Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.prorate_manual} 
                        onChange={(e) => setEditForm({...editForm, prorate_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual Prorate/hari</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: ${editingOfficer.prorate}</div>
                    {editForm.prorate_manual && (
                      <input 
                        type="number" 
                        value={editForm.prorate_value_manual} 
                        onChange={(e) => setEditForm({...editForm, prorate_value_manual: parseInt(e.target.value) || 0})} 
                        className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                        min="0"
                        placeholder="Nilai prorate"
                      />
                    )}
                  </div>
                  
                  {/* OFF Day Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.off_day_manual} 
                        onChange={(e) => setEditForm({...editForm, off_day_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual OFF Diambil</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: {editingOfficer.offCount} hari</div>
                    {editForm.off_day_manual && (
                      <div>
                        <input 
                          type="number" 
                          value={editForm.off_day_count_manual} 
                          onChange={(e) => setEditForm({...editForm, off_day_count_manual: parseInt(e.target.value) || 0})} 
                          className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                          min="0"
                          max={JATAH_OFF_PER_PERIODE}
                          placeholder={`Max ${JATAH_OFF_PER_PERIODE} hari`}
                        />
                        <p className="text-[10px] text-[#A7D8FF] mt-1">
                          Jatah OFF: {JATAH_OFF_PER_PERIODE} hari
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* SAKIT Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.sakit_manual} 
                        onChange={(e) => setEditForm({...editForm, sakit_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual SAKIT</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: {editingOfficer.sakitCount} hari</div>
                    {editForm.sakit_manual && (
                      <input 
                        type="number" 
                        value={editForm.sakit_count_manual} 
                        onChange={(e) => setEditForm({...editForm, sakit_count_manual: parseInt(e.target.value) || 0})} 
                        className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                        min="0"
                        placeholder="Jumlah sakit"
                      />
                    )}
                  </div>
                  
                  {/* IZIN Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.izin_manual} 
                        onChange={(e) => setEditForm({...editForm, izin_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual IZIN</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: {editingOfficer.izinCount} hari</div>
                    {editForm.izin_manual && (
                      <input 
                        type="number" 
                        value={editForm.izin_count_manual} 
                        onChange={(e) => setEditForm({...editForm, izin_count_manual: parseInt(e.target.value) || 0})} 
                        className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                        min="0"
                        placeholder="Jumlah izin"
                      />
                    )}
                  </div>
                  
                  {/* UNPAID Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.unpaid_manual} 
                        onChange={(e) => setEditForm({...editForm, unpaid_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual UNPAID</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: {editingOfficer.unpaidCount} hari</div>
                    {editForm.unpaid_manual && (
                      <input 
                        type="number" 
                        value={editForm.unpaid_count_manual} 
                        onChange={(e) => setEditForm({...editForm, unpaid_count_manual: parseInt(e.target.value) || 0})} 
                        className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                        min="0"
                        placeholder="Jumlah unpaid"
                      />
                    )}
                  </div>
                  
                  {/* ALPHA Manual */}
                  <div className="p-3 bg-[#0B1A33] rounded-lg">
                    <label className="flex items-center gap-2 text-[#A7D8FF] text-sm mb-2">
                      <input 
                        type="checkbox" 
                        checked={editForm.alpha_manual} 
                        onChange={(e) => setEditForm({...editForm, alpha_manual: e.target.checked})} 
                        className="w-4 h-4 accent-[#FFD700]"
                      />
                      <span>Manual ABSEN</span>
                    </label>
                    <div className="text-[10px] text-[#A7D8FF] mb-2">Default: {editingOfficer.alphaCount} hari</div>
                    {editForm.alpha_manual && (
                      <input 
                        type="number" 
                        value={editForm.alpha_count_manual} 
                        onChange={(e) => setEditForm({...editForm, alpha_count_manual: parseInt(e.target.value) || 0})} 
                        className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm" 
                        min="0"
                        placeholder="Jumlah absen"
                      />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Section: Data yang bisa diedit */}
              <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
                <h4 className="text-[#FFD700] font-semibold mb-3">📝 DATA EDIT</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#A7D8FF] text-sm block mb-1">KASBON ( - )</label>
                    <input 
                      type="number" 
                      value={editForm.kasbon} 
                      onChange={(e) => setEditForm({...editForm, kasbon: parseInt(e.target.value) || 0})} 
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[#A7D8FF] text-sm block mb-1">CUTI (hari)</label>
                    <input 
                      type="number" 
                      value={editForm.cuti} 
                      onChange={(e) => setEditForm({...editForm, cuti: parseInt(e.target.value) || 0})} 
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                      min="0"
                    />
                    <p className="text-[10px] text-[#A7D8FF] mt-1">
                      * Potongan ${editForm.cuti * (editForm.prorate_manual ? editForm.prorate_value_manual : editingOfficer.prorate)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-[#A7D8FF] text-sm block mb-1">ETC (+/-)</label>
                    <input 
                      type="number" 
                      value={editForm.etc} 
                      onChange={(e) => setEditForm({...editForm, etc: parseInt(e.target.value) || 0})} 
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-[#A7D8FF] text-sm block mb-1">Keterangan</label>
                    <input 
                      type="text" 
                      value={editForm.etc_note} 
                      onChange={(e) => setEditForm({...editForm, etc_note: e.target.value})} 
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" 
                      placeholder="Misal: Koreksi, Bonus"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview hasil perhitungan */}
              <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
                <h4 className="text-[#FFD700] font-semibold mb-3">🔍 PREVIEW PERHITUNGAN</h4>
                
                {(() => {
                  // Ambil nilai berdasarkan manual atau tidak
                  const baseAmount = editForm.base_amount_manual ? editForm.base_amount_value_manual : editingOfficer.baseAmount;
                  const prorateValue = editForm.prorate_manual ? editForm.prorate_value_manual : editingOfficer.prorate;
                  const offCount = editForm.off_day_manual ? editForm.off_day_count_manual : editingOfficer.offCount;
                  const sakitCount = editForm.sakit_manual ? editForm.sakit_count_manual : editingOfficer.sakitCount;
                  const izinCount = editForm.izin_manual ? editForm.izin_count_manual : editingOfficer.izinCount;
                  const unpaidCount = editForm.unpaid_manual ? editForm.unpaid_count_manual : editingOfficer.unpaidCount;
                  const alphaCount = editForm.alpha_manual ? editForm.alpha_count_manual : editingOfficer.alphaCount;
                  
                  const offRemaining = Math.max(0, JATAH_OFF_PER_PERIODE - offCount);
                  const uangProrate = offRemaining * prorateValue;
                  const potongan = (sakitCount + izinCount + unpaidCount + editForm.cuti) * prorateValue;
                  const denda = alphaCount * 50;
                  const umNetPreview = Math.max(0, baseAmount + uangProrate - potongan - denda);
                  const finalNetPreview = Math.max(0, umNetPreview - editForm.kasbon + editForm.etc);
                  
                  return (
                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-[#A7D8FF]">Base Amount:</div>
                        <div className="text-white font-medium text-right">${baseAmount}</div>
                        
                        <div className="text-[#A7D8FF]">Prorate/hari:</div>
                        <div className="text-white font-medium text-right">${prorateValue}</div>
                        
                        <div className="text-[#A7D8FF]">OFF Diambil:</div>
                        <div className="text-white font-medium text-right">{offCount} hari</div>
                        
                        <div className="text-[#A7D8FF]">Sisa OFF:</div>
                        <div className="text-green-400 font-medium text-right">{offRemaining} hari</div>
                        
                        <div className="text-[#A7D8FF] text-green-400">Uang Prorate (+):</div>
                        <div className="text-green-400 font-bold text-right">+${uangProrate}</div>
                        
                        <div className="text-[#A7D8FF] text-red-400">Total Potongan (-):</div>
                        <div className="text-red-400 font-bold text-right">-${potongan + denda}</div>
                      </div>
                      
                      <div className="border-t border-[#FFD700]/30 my-2 pt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-[#FFD700]">UM NET:</span>
                          <span className="text-[#FFD700]">${umNetPreview}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#A7D8FF]">Kasbon:</span>
                          <span className="text-red-400">-${editForm.kasbon}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#A7D8FF]">ETC:</span>
                          <span className={editForm.etc >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {editForm.etc >= 0 ? `+${editForm.etc}` : editForm.etc}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-1">
                          <span className="text-[#FFD700]">FINAL NET:</span>
                          <span className="text-[#FFD700]">${finalNetPreview}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex gap-2 pt-4">
                <button 
                  onClick={handleEditSave} 
                  className="flex-1 bg-[#FFD700] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FFD700]/80 transition-all duration-300 hover:scale-105"
                >
                  Simpan
                </button>
                <button 
                  onClick={() => setEditingOfficer(null)} 
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-all duration-300 hover:scale-105"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideIn { animation: slideIn 0.5s ease-out; }
      `}</style>
    </div>
  );
}