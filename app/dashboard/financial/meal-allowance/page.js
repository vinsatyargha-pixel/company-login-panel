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
  
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editForm, setEditForm] = useState({
    kasbon: 0,
    cuti: 0,
    etc: 0,
    etc_note: ''
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];

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

  // ===========================================
  // FUNGSI GET PREVIOUS MONTH (BUAT LABEL)
  // ===========================================
  const getPreviousMonth = (month, year) => {
    const monthIndex = months.indexOf(month);
    if (monthIndex === 0) {
      return `December ${parseInt(year) - 1}`;
    } else {
      return `${months[monthIndex - 1]} ${year}`;
    }
  };

  // ===========================================
  // FUNGSI GET PREVIOUS MONTH DATA (LENGKAP DENGAN PERIODE)
  // ===========================================
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

  // ===========================================
  // FUNGSI HITUNG USIA (LANGSUNG DARI SCHEDULE)
  // ===========================================
  const hitungUSIA = (officerName, schedule = scheduleData) => {
    const totals = {
      OFF: 0,
      SAKIT: 0,
      IZIN: 0,
      ABSEN: 0,
      CUTI: 0,
      'UNPAID LEAVE': 0,
      SPECIAL: 0,
      DIRUMAHKAN: 0,
      RESIGN: 0,
      TERMINATED: 0,
      'BELUM JOIN': 0
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
      
      if (selectedMonth === 'January') {
        setOfficers([]);
        setLoading(false);
        return;
      }
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      
      // AMBIL BULAN SEBELUMNYA UNTUK SCHEDULE
      const prev = getPreviousMonthData(selectedMonth, selectedYear);
      console.log(`Fetching schedule for: ${prev.month} ${prev.year} (data untuk ${selectedMonth} ${selectedYear})`);
      
      // Ambil data officers
      const { data: officersData } = await supabase
        .from('officers')
        .select('*')
        .in('department', ['AM', 'CAPTAIN', 'CS DP WD'])
        .eq('status', 'REGULAR');
      
      // AMBIL SCHEDULE DARI BULAN SEBELUMNYA
      const scheduleResponse = await fetch(
        `/api/schedule?year=${prev.year}&month=${prev.month}`
      );
      const scheduleResult = await scheduleResponse.json();
      const schedule = scheduleResult.data || [];
      setScheduleData(schedule);
      
      // Ambil snapshot
      const { data: snapData } = await supabase
        .from('meal_allowance_snapshot')
        .select('officer_id, cuti_count, kasbon, etc, etc_note, last_edited_by, last_edited_at')
        .eq('bulan', bulan);
      
      // Ambil data admin
      const { data: adminData } = await supabase
        .from('officers')
        .select('id, full_name, email')
        .eq('role', 'admin');
      
      const adminMap = {};
      adminData?.forEach(a => { adminMap[a.id] = a.full_name || a.email; });
      
      // Gabungin data
      const officersWithStats = (officersData || []).map(officer => {
        const usia = hitungUSIA(officer.full_name, schedule);
        const snapshot = snapData?.find(s => s.officer_id === officer.id);
        const { bank, rek, link } = formatBankAndRek(officer.bank_account || '');
        const rate = getMealRate(officer.department, officer.join_date);
        
        return {
          id: officer.id,
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
          lastEditedAt: snapshot?.last_edited_at || null
        };
      });
      
      // Hitung umNet
      const withUmNet = officersWithStats.map(o => {
        const potongan = (o.sakitCount + o.cutiCount + o.izinCount + o.unpaidCount) * o.prorate;
        const denda = o.alphaCount * 50;
        const umNet = Math.max(0, o.baseAmount - potongan - denda);
        return { ...o, umNet };
      });
      
      setOfficers(withUmNet);
      
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
    
    try {
      if (editForm.kasbon < 0 || editForm.cuti < 0) {
        alert('⚠️ Kasbon dan Cuti tidak boleh negatif');
        return;
      }
      
      const bulan = `${selectedMonth} ${selectedYear}`;
      const officer = editingOfficer;
      
      // HITUNG PERIODE PAKAI FUNGSI (SUDAH TERSEDIA GLOBAL)
      const prev = getPreviousMonthData(selectedMonth, selectedYear);
      
      // Hitung ulang UM Net
      const potongan = (officer.sakitCount + editForm.cuti + officer.izinCount + officer.unpaidCount) * officer.prorate;
      const denda = officer.alphaCount * 50;
      const umNetBaru = Math.max(0, officer.baseAmount - potongan - denda);
      
      // CARI NAMA ADMIN
      let adminName = 'Unknown';
      let adminId = null;
      
      if (user?.email) {
        const { data: adminData } = await supabase
          .from('officers')
          .select('id, full_name')
          .eq('email', user.email)
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
        last_edited_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('meal_allowance_snapshot')
        .upsert(snapshotData, { onConflict: 'officer_id, bulan' });
      
      if (error) throw error;
      
      setOfficers(prev => prev.map(o => 
        o.id === officer.id 
          ? { 
              ...o, 
              kasbon: editForm.kasbon,
              cutiCount: editForm.cuti,
              etc: editForm.etc || 0,
              etc_note: editForm.etc_note,
              umNet: umNetBaru,
              lastEditedBy: adminName,
              lastEditedAt: new Date().toISOString()
            }
          : o
      ));
      
      alert(`✅ Data berhasil diupdate oleh ${adminName}`);
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
      if (!isAdmin) return o.department === 'CS DP WD';
      return selectedDept === 'All' || o.department === selectedDept;
    })
    .filter(o => o.full_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((officer) => ({
      ...officer,
      finalNet: Math.max(0, (officer.umNet || 0) - (officer.kasbon || 0) + (officer.etc || 0))
    }));

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

  if (selectedMonth === 'January') {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/financial" className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30">
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

      <div className="mb-6 flex flex-wrap gap-4">
        <select className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        <select className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        <select className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} disabled={!isAdmin}>
          {availableDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
        </select>
        <input type="text" placeholder="Search name..." className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white flex-1 min-w-[200px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="mb-4 p-3 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 text-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <span className="text-[#A7D8FF]">Data dari schedule:</span> 
            <span className="text-white font-medium">{getPreviousMonth(selectedMonth, selectedYear)}</span>
          </div>
          <div>
            <span className="text-[#A7D8FF]">Pembagian UM:</span> 
            <span className="text-white font-medium">1 {selectedMonth} {selectedYear}</span>
          </div>
        </div>
      </div>

      {['CS DP WD', 'CAPTAIN', 'AM'].map(dept => {
        if (dept !== 'CS DP WD' && !isAdmin) return null;
        if (groupedOfficers[dept]?.length === 0) return null;
        
        return (
          <div key={dept} className="mb-8">
            <div className="bg-[#1A2F4A] p-3 rounded-t-lg border border-[#FFD700]/30">
              <h2 className="text-xl font-bold text-[#FFD700]">{dept} ({groupedOfficers[dept].length})</h2>
            </div>
            <div className="border-x border-b border-[#FFD700]/30 rounded-b-lg overflow-hidden">
              {groupedOfficers[dept].map((officer) => (
                <div key={officer.id} className="p-4 border-b border-[#FFD700]/30 last:border-b-0 hover:bg-[#1A2F4A]/50">
                  {/* BARIS 1: Nama, Join Date, Bank */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                    <div>
                      <div className="font-bold text-[#FFD700] text-lg">{officer.full_name}</div>
                      <div className="text-xs text-[#A7D8FF]">Join: {new Date(officer.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</div>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <div className="text-[#A7D8FF] text-xs font-medium">{officer.bank}</div>
                      <div className="text-xs text-white break-all">{officer.rek}</div>
                      {officer.link && (
                        <a href={officer.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#FFD700] hover:underline block break-all mt-1" title={officer.link}>
                          {officer.link}
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
                      <span className="text-[#A7D8FF] text-xs">Rate/hari:</span>
                      <span className="font-medium text-white">${officer.prorate || 0}</span>
                    </div>
                    
                    <div className="w-px h-4 bg-[#FFD700]/30"></div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-[#A7D8FF] text-xs">S/I/U/A:</span>
                      <span className="font-medium text-white">
                        {officer.sakitCount || 0}/{officer.izinCount || 0}/{officer.unpaidCount || 0}/{officer.alphaCount || 0}
                      </span>
                    </div>
                    
                    <div className="w-px h-4 bg-[#FFD700]/30"></div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-[#A7D8FF] text-xs">Cuti Manual:</span>
                      <span className="font-medium text-yellow-400">{officer.cutiCount || 0}</span>
                    </div>
                    
                    <div className="w-px h-4 bg-[#FFD700]/30"></div>
                    
                    <div className="flex items-center gap-1">
                      <span className="text-[#A7D8FF] text-xs">NET:</span>
                      <span className="font-bold text-[#FFD700]">${officer.finalNet || 0}</span>
                    </div>
                  </div>
                  
                  {/* BARIS 3: Kolom Kasbon, ETC, Notes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                      <div className="text-[#A7D8FF] text-xs mb-1">💰 KASBON</div>
                      <div className="font-medium text-red-400">${officer.kasbon || 0}</div>
                    </div>
                    
                    <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                      <div className="text-[#A7D8FF] text-xs mb-1">🔄 ETC/PRORATE</div>
                      <div className={`font-medium ${(officer.etc || 0) > 0 ? 'text-green-400' : (officer.etc || 0) < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                        {(officer.etc || 0) > 0 ? '+' : ''}{officer.etc || 0}
                      </div>
                    </div>
                    
                    <div className="bg-[#1A2F4A]/50 p-2 rounded border border-[#FFD700]/20">
                      <div className="text-[#A7D8FF] text-xs mb-1">📝 NOTES</div>
                      <div className="text-sm text-white truncate" title={officer.etc_note}>{officer.etc_note || '-'}</div>
                    </div>
                  </div>
                  
                  {/* LOG EDIT */}
                  {(officer.lastEditedBy || officer.lastEditedAt) && (
                    <div className="text-[10px] text-[#A7D8FF] mb-2 text-right">
                      Last edited by: {officer.lastEditedBy || 'Admin'} {officer.lastEditedAt ? `at ${new Date(officer.lastEditedAt).toLocaleString()}` : ''}
                    </div>
                  )}
                  
                  {/* Tombol Edit */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      <button onClick={() => handleEditClick(officer)} className="bg-[#FFD700] hover:bg-[#FFD700]/80 text-black px-4 py-2 rounded text-sm font-medium flex items-center gap-2 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Edit KASBON/ETC/CUTI</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-6 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg flex justify-between items-center">
        <span className="text-[#FFD700] font-bold">Total Officers: {officersWithStats.length}</span>
        <span className="text-[#FFD700] font-bold">Total NET: ${Math.round(officersWithStats.reduce((sum, o) => sum + (o.finalNet || 0), 0))}</span>
      </div>

      {/* MODAL EDIT */}
      {editingOfficer && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">Edit {editingOfficer.full_name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">KASBON ( - )</label>
                <input type="text" value={editForm.kasbon} onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setEditForm({...editForm, kasbon: value ? parseInt(value) : 0});
                }} className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" placeholder="0" inputMode="numeric" />
              </div>
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">CUTI (hari)</label>
                <input type="text" value={editForm.cuti} onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setEditForm({...editForm, cuti: value ? parseInt(value) : 0});
                }} className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" placeholder="0" inputMode="numeric" />
                <p className="text-[10px] text-[#A7D8FF] mt-1">*Akan mengganti hitungan cuti dari schedule</p>
              </div>
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">ETC (+ nambah, - ngurang)</label>
                <input type="text" value={editForm.etc} onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || value === '-') {
                    setEditForm({...editForm, etc: value});
                    return;
                  }
                  if (/^-?\d*$/.test(value)) {
                    setEditForm({...editForm, etc: value});
                  }
                }} onBlur={() => {
                  const num = parseInt(editForm.etc);
                  setEditForm({...editForm, etc: isNaN(num) ? 0 : num});
                }} className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" placeholder="Contoh: 25 atau -10" />
              </div>
              
              <div>
                <label className="text-[#A7D8FF] text-sm block mb-1">Keterangan / Note</label>
                <input type="text" value={editForm.etc_note} onChange={(e) => setEditForm({...editForm, etc_note: e.target.value})} className="w-full bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" placeholder="Misal: Koreksi, Bonus, Denda, dll" />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button onClick={handleEditSave} className="flex-1 bg-[#FFD700] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#FFD700]/80">Simpan</button>
                <button onClick={() => setEditingOfficer(null)} className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}