'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// ===========================================
// HELPER: Convert minutes to HH:MM:SS
// ===========================================
const formatTime = (minutes) => {
  if (!minutes || minutes === 0 || minutes === '0') return '-';
  
  const totalSeconds = Math.floor(parseFloat(minutes) * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ===========================================
// HELPER: Get first and last day of month
// ===========================================
const getMonthDateRange = (tahun, bulan) => {
  const startDate = `${tahun}-${bulan.toString().padStart(2, '0')}-01`;
  const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];
  return { startDate, endDate };
};

export default function SummaryKPIDataPage() {
  const [tahun, setTahun] = useState('2026');
  const [bulanAwal, setBulanAwal] = useState('1');
  const [bulanAkhir, setBulanAkhir] = useState('6');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk menyimpan data transaksi
  const [depositData, setDepositData] = useState({});
  const [withdrawalData, setWithdrawalData] = useState({});

  // Daftar bulan
  const bulanList = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  // ===========================================
  // FETCH OFFICERS CS DP WD
  // ===========================================
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('officers')
          .select('*')
          .eq('department', 'CS DP WD')
          .order('full_name', { ascending: true });

        if (error) throw error;
        
        // Tambah System secara manual
        const systemOfficer = {
          full_name: 'System',
          panel_id: 'System',
          department: 'System',
          status: 'SYSTEM',
          join_date: '-'
        };
        
        setOfficers([...(data || []), systemOfficer]);
        
      } catch (error) {
        console.error('Error fetching officers:', error);
        setOfficers([{
          full_name: 'System',
          panel_id: 'System',
          department: 'System',
          status: 'SYSTEM',
          join_date: '-'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // ===========================================
  // FETCH DEPOSIT TRANSACTIONS (DATA REAL)
  // ===========================================
  useEffect(() => {
    const fetchDepositTransactions = async () => {
      try {
        const { startDate, endDate } = getMonthDateRange(tahun, parseInt(bulanAkhir));
        
        const { data, error } = await supabase
          .from('deposit_transactions')
          .select('*')
          .gte('approved_date', `${tahun}-${bulanAwal.padStart(2, '0')}-01`)
          .lte('approved_date', endDate);

        if (error) throw error;

        const grouped = {};
        
        data.forEach(tx => {
          const handler = tx.handler || 'system';
          
          if (!grouped[handler]) {
            grouped[handler] = {
              totalApproved: 0,
              totalReject: 0,
              totalSOP: 0,
              totalNonSOP: 0,
              totalDuration: 0,
              approvedCount: 0,
              rejectCount: 0,
              rejectDuration: 0
            };
          }
          
          if (tx.status === 'Approved') {
            grouped[handler].totalApproved++;
            grouped[handler].approvedCount++;
            
            const duration = tx.duration_minutes ? parseFloat(tx.duration_minutes) : 0;
            
            if (duration <= 3) {
              grouped[handler].totalSOP++;
            } else {
              grouped[handler].totalNonSOP++;
            }
            
            if (tx.duration_minutes) {
              grouped[handler].totalDuration += duration;
            }
          } 
          else if (tx.status === 'Rejected' || tx.status === 'Fail') {
            grouped[handler].totalReject++;
            grouped[handler].rejectCount++;
            
            if (tx.duration_minutes) {
              grouped[handler].rejectDuration += parseFloat(tx.duration_minutes);
            }
          }
        });
        
        Object.keys(grouped).forEach(key => {
          const g = grouped[key];
          g.avgApprovalTime = g.approvedCount > 0 ? (g.totalDuration / g.approvedCount) : 0;
          g.avgRejectTime = g.rejectCount > 0 ? (g.rejectDuration / g.rejectCount) : 0;
          g.sopPercentage = g.totalApproved > 0 ? Math.round((g.totalSOP / g.totalApproved) * 100) : 0;
        });
        
        setDepositData(grouped);
        
      } catch (error) {
        console.error('Error fetching deposit transactions:', error);
      }
    };

    if (tahun && bulanAwal && bulanAkhir) {
      fetchDepositTransactions();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // FETCH WITHDRAWAL TRANSACTIONS (DATA REAL)
  // ===========================================
  useEffect(() => {
    const fetchWithdrawalTransactions = async () => {
      try {
        const { startDate, endDate } = getMonthDateRange(tahun, parseInt(bulanAkhir));
        
        const { data, error } = await supabase
          .from('withdrawal_transactions')
          .select('*')
          .gte('approved_date', `${tahun}-${bulanAwal.padStart(2, '0')}-01`)
          .lte('approved_date', endDate);

        if (error) throw error;

        const grouped = {};
        
        data.forEach(tx => {
          const handler = tx.handler || 'system';
          
          if (!grouped[handler]) {
            grouped[handler] = {
              totalApproved: 0,
              totalReject: 0,
              totalSOP: 0,
              totalNonSOP: 0,
              totalDuration: 0,
              approvedCount: 0,
              rejectCount: 0,
              rejectDuration: 0
            };
          }
          
          if (tx.status === 'Approved') {
            grouped[handler].totalApproved++;
            grouped[handler].approvedCount++;
            
            const duration = tx.duration_minutes ? parseFloat(tx.duration_minutes) : 0;
            
            if (duration <= 5) {
              grouped[handler].totalSOP++;
            } else {
              grouped[handler].totalNonSOP++;
            }
            
            if (tx.duration_minutes) {
              grouped[handler].totalDuration += duration;
            }
          } 
          else if (tx.status === 'Rejected') {
            grouped[handler].totalReject++;
            grouped[handler].rejectCount++;
            
            if (tx.duration_minutes) {
              grouped[handler].rejectDuration += parseFloat(tx.duration_minutes);
            }
          }
        });
        
        Object.keys(grouped).forEach(key => {
          const g = grouped[key];
          g.avgApprovalTime = g.approvedCount > 0 ? (g.totalDuration / g.approvedCount) : 0;
          g.avgRejectTime = g.rejectCount > 0 ? (g.rejectDuration / g.rejectCount) : 0;
          g.sopPercentage = g.totalApproved > 0 ? Math.round((g.totalSOP / g.totalApproved) * 100) : 0;
        });
        
        setWithdrawalData(grouped);
        
      } catch (error) {
        console.error('Error fetching withdrawal transactions:', error);
      }
    };

    if (tahun && bulanAwal && bulanAkhir) {
      fetchWithdrawalTransactions();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
// FETCH ATTENDANCE FROM API SCHEDULE
// ===========================================
const [attendanceData, setAttendanceData] = useState({});

useEffect(() => {
  const fetchAttendance = async () => {
    try {
      const bulanNama = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ][parseInt(bulanAwal) - 1];
      
      const response = await fetch(
        `/api/schedule?year=${tahun}&month=${bulanNama}`
      );
      const result = await response.json();
      
      if (!result.success) throw new Error('Failed to fetch schedule');
      
      const grouped = {};
      const startMonth = parseInt(bulanAwal);
      const endMonth = parseInt(bulanAkhir);
      
      result.data.forEach(day => {
        const dateStr = day['DATE RUNDOWN'];
        if (!dateStr) return;
        
        const date = new Date(dateStr);
        const monthNum = date.getMonth() + 1;
        
        if (monthNum < startMonth || monthNum > endMonth) return;
        
        const officers = [
          'Sulaeman',
          'Goldie Mountana',
          'Achmad Naufal Zakiy',
          'Mushollina Nul Hakim',
          'Lie Fung Kien (Vini)',
          'Ronaldo Ichwan'
        ];
        
        officers.forEach(officerName => {
          const status = day[officerName];
          if (!status) return;
          
          if (!grouped[officerName]) {
            grouped[officerName] = { s: 0, i: 0, a: 0, u: 0 };
          }
          
          const statusUpper = status.toUpperCase().trim();
          
          // Siap untuk SEMUA kemungkinan status
          if (statusUpper === 'SAKIT') {
            grouped[officerName].s += 1;
          }
          else if (statusUpper === 'IZIN') {
            grouped[officerName].i += 1;
          }
          else if (statusUpper === 'ABSEN') {
            grouped[officerName].a += 1;
          }
          else if (statusUpper === 'UNPAID' || statusUpper === 'UNPAID LEAVE') {
            grouped[officerName].u += 1;
          }
          // Status lain (P, M, OFF, CUTI, dll) diabaikan
        });
      });
      
      setAttendanceData(grouped);
      console.log('Attendance data (S/I/A/U):', grouped);
      
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  if (tahun && bulanAwal && bulanAkhir) {
    fetchAttendance();
  }
}, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // MAP DATA REAL KE FORMAT YANG DIBUTUHKAN
  // ===========================================
  const getDepositDataForOfficer = (officer) => {
    if (officer.panel_id === 'System' || officer.full_name === 'System') {
      const data = depositData['SYSTEM'] || depositData['system'] || {};
      return {
        totalApproved: data.totalApproved || 0,
        totalReject: data.totalReject || 0,
        sop: data.totalSOP || 0,
        sopPercent: data.sopPercentage || 0,
        nonSop: data.totalNonSOP || 0,
        intervalApp: data.avgApprovalTime || 0,
        intervalRej: data.avgRejectTime || 0,
        heQty: 0,
        heAmount: '-',
        mistakeQty: 0,
        mistakeAmount: '-',
        blockBank: 0,
        crossBankQty: 0,
        crossBankAmount: '-',
        crossAssetQty: 0,
        crossAssetAmount: '-',
        bukuDosa: 0,
        sp1: 0,
        sp2: 0,
        sus: 0,
        totalPoin4: 100,
        p1: data.sopPercentage || 0,
        p2: 100,
        p3: 100,
        p4: 100,
        avg: data.sopPercentage ? Math.round((data.sopPercentage + 100 + 100 + 100) / 4) : 0
      };
    }

    const handlerVariants = [
      officer.panel_id?.toLowerCase(),
      officer.panel_id,
      officer.username?.toLowerCase(),
      officer.full_name?.toLowerCase()
    ].filter(Boolean);
    
    let data = {};
    for (const variant of handlerVariants) {
      if (depositData[variant]) {
        data = depositData[variant];
        break;
      }
    }
    
    return {
      totalApproved: data.totalApproved || 0,
      totalReject: data.totalReject || 0,
      sop: data.totalSOP || 0,
      sopPercent: data.sopPercentage || 0,
      nonSop: data.totalNonSOP || 0,
      intervalApp: data.avgApprovalTime || 0,
      intervalRej: data.avgRejectTime || 0,
      heQty: 0,
      heAmount: '-',
      mistakeQty: 0,
      mistakeAmount: '-',
      blockBank: 0,
      crossBankQty: 0,
      crossBankAmount: '-',
      crossAssetQty: 0,
      crossAssetAmount: '-',
      bukuDosa: 0,
      sp1: 0,
      sp2: 0,
      sus: 0,
      totalPoin4: 100,
      p1: data.sopPercentage || 0,
      p2: 100,
      p3: 100,
      p4: 100,
      avg: data.sopPercentage ? Math.round((data.sopPercentage + 100 + 100 + 100) / 4) : 0
    };
  };

  const getWithdrawalDataForOfficer = (officer) => {
    if (officer.panel_id === 'System' || officer.full_name === 'System') {
      const data = withdrawalData['SYSTEM'] || withdrawalData['system'] || {};
      return {
        totalApproved: data.totalApproved || 0,
        totalReject: data.totalReject || 0,
        sop: data.totalSOP || 0,
        sopPercent: data.sopPercentage || 0,
        nonSop: data.totalNonSOP || 0,
        intervalApp: data.avgApprovalTime || 0,
        intervalRej: data.avgRejectTime || 0,
        heQty: 0,
        heAmount: '-',
        mistakeQty: 0,
        mistakeAmount: '-',
        blockBank: 0,
        crossBankQty: 0,
        crossBankAmount: '-',
        crossAssetQty: 0,
        crossAssetAmount: '-',
        bukuDosa: 0,
        sp1: 0,
        sp2: 0,
        sus: 0,
        totalPoin4: 100,
        p1: data.sopPercentage || 0,
        p2: 100,
        p3: 100,
        p4: 100,
        avg: data.sopPercentage ? Math.round((data.sopPercentage + 100 + 100 + 100) / 4) : 0
      };
    }

    const handlerVariants = [
      officer.panel_id?.toLowerCase(),
      officer.panel_id,
      officer.username?.toLowerCase(),
      officer.full_name?.toLowerCase()
    ].filter(Boolean);
    
    let data = {};
    for (const variant of handlerVariants) {
      if (withdrawalData[variant]) {
        data = withdrawalData[variant];
        break;
      }
    }
    
    return {
      totalApproved: data.totalApproved || 0,
      totalReject: data.totalReject || 0,
      sop: data.totalSOP || 0,
      sopPercent: data.sopPercentage || 0,
      nonSop: data.totalNonSOP || 0,
      intervalApp: data.avgApprovalTime || 0,
      intervalRej: data.avgRejectTime || 0,
      heQty: 0,
      heAmount: '-',
      mistakeQty: 0,
      mistakeAmount: '-',
      blockBank: 0,
      crossBankQty: 0,
      crossBankAmount: '-',
      crossAssetQty: 0,
      crossAssetAmount: '-',
      bukuDosa: 0,
      sp1: 0,
      sp2: 0,
      sus: 0,
      totalPoin4: 100,
      p1: data.sopPercentage || 0,
      p2: 100,
      p3: 100,
      p4: 100,
      avg: data.sopPercentage ? Math.round((data.sopPercentage + 100 + 100 + 100) / 4) : 0
    };
  };

  // Generate data dengan real attendance
  const officerDataList = officers.map((officer, index) => {
    const depositReal = getDepositDataForOfficer(officer);
    const withdrawalReal = getWithdrawalDataForOfficer(officer);
    
    // Ambil data attendance berdasarkan nama officer
    const officerName = officer.full_name;
    const attendance = attendanceData[officerName] || { s: 0, i: 0, a: 0, u: 0 };
    const totalAbsen = attendance.s + attendance.i + attendance.a + attendance.u;
    const targetHari = 150; // Sesuaikan dengan target per periode
    const achievePercent = targetHari > 0 ? Math.round(((targetHari - totalAbsen) / targetHari) * 100) : 100;
    
    return {
      no: index + 1,
      name: officer.full_name || 'Unknown',
      panelId: officer.panel_id || '-',
      dept: officer.department || 'CS DP WD',
      status: officer.status || 'REGULAR',
      joinDate: officer.join_date || '-',
      
      deposit: {
        divisi: 'Deposit Aspect',
        ...depositReal
      },
      
      withdrawal: {
        divisi: 'Withdrawal Aspect',
        ...withdrawalReal
      },
      
      cs: {
        // DATA REAL dari attendance untuk S/I/A/U
        totalChat: Math.floor(Math.random() * 50) + 80, // Masih dummy
        missedChat: Math.floor(Math.random() * 3),
        timeMgmt: Math.floor(Math.random() * 10) + 85,
        commSkill: Math.floor(Math.random() * 10) + 85,
        problemSolving: Math.floor(Math.random() * 10) + 85,
        s: attendance.s,      // ✅ S dari attendance
        i: attendance.i,      // ✅ I dari attendance
        a: attendance.a,      // ✅ A dari attendance
        u: attendance.u,      // ✅ U dari attendance
        total: totalAbsen,
        target: targetHari,
        achieve: achievePercent,
        p1: 85,
        p2: 85,
        p3: 85,
        p4: 85,
        p5: 85,
        p6: 100
      }
    };
  });

  const totalDepositApproved = officerDataList.reduce((sum, o) => sum + (o.deposit.totalApproved || 0), 0);
  const totalWithdrawalApproved = officerDataList.reduce((sum, o) => sum + (o.withdrawal.totalApproved || 0), 0);

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-4 text-[#FFD700]">Loading KPI data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* BACK LINK */}
      <div className="mb-6">
        <Link 
          href="/dashboard/officers-kpi"
          className="inline-flex items-center gap-2 text-[#A7D8FF] hover:text-[#FFD700] transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO OFFICERS KPI
        </Link>
      </div>

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#FFD700] mb-2">SUMMARY KPI DATA</h1>
      <p className="text-[#A7D8FF] mb-6">
        KPI Summary CS DP WD • Periode {bulanList.find(b => b.value === bulanAwal)?.label} - {bulanList.find(b => b.value === bulanAkhir)?.label} {tahun}
      </p>

      {/* FILTER - RENTANG BULAN */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-8 flex flex-wrap gap-4 items-center">
        <span className="text-[#FFD700] font-bold text-sm">FILTER RENTANG BULAN:</span>
        
        <select 
          value={tahun}
          onChange={(e) => setTahun(e.target.value)}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm w-24"
        >
          <option>2024</option>
          <option>2025</option>
          <option>2026</option>
          <option>2027</option>
        </select>
        
        <select 
          value={bulanAwal}
          onChange={(e) => {
            setBulanAwal(e.target.value);
            if (parseInt(e.target.value) > parseInt(bulanAkhir)) {
              setBulanAkhir(e.target.value);
            }
          }}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm"
        >
          {bulanList.map(bulan => (
            <option key={bulan.value} value={bulan.value}>{bulan.label}</option>
          ))}
        </select>
        
        <span className="text-[#FFD700]">s/d</span>
        
        <select 
          value={bulanAkhir}
          onChange={(e) => setBulanAkhir(e.target.value)}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm"
        >
          {bulanList.filter(b => parseInt(b.value) >= parseInt(bulanAwal)).map(bulan => (
            <option key={bulan.value} value={bulan.value}>{bulan.label}</option>
          ))}
        </select>
        
        <span className="text-[#A7D8FF] text-sm ml-auto">
          Total Officers: {officers.length}
        </span>
      </div>

      {/* ========== DEPOSIT & WITHDRAWAL KPI ========== */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
        
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1800px]">
            <thead>
              {/* MAIN HEADER - BARIS 1 */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="7" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
                <th colSpan="7" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">TIME MANAGEMENT</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">HUMAN ERROR</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">PROBLEM SOLVING</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">FOLLOW SOP / TEAMWORK</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">SUB SCORE DP & WD</th>
              </tr>

              {/* SUB HEADER - BARIS 2 */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                {/* STICKY COLUMNS - 7 KOLOM */}
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
                <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[150px]">NAME</th>
                <th className="sticky left-[190px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">PANEL ID</th>
                <th className="sticky left-[290px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[390px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
                <th className="sticky left-[470px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[90px]">JOIN DATE</th>
                <th className="sticky left-[560px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DIVISI</th>
                
                {/* TIME MANAGEMENT - 7 KOLOM */}
                <th className="text-center py-2 px-2 min-w-[70px]">Total App</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Total Rej</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP % (P1)</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Non SOP</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Interval App</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Interval Rej</th>
                
                {/* HUMAN ERROR (6 kolom) */}
                <th className="text-center py-2 px-2 min-w-[50px]">HE Qty</th>
                <th className="text-center py-2 px-2 min-w-[70px]">HE Amt</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Mistake Qty</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Mistake Amt</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Block Bank</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Presentase (P2)</th>
                
                {/* PROBLEM SOLVING (5 kolom) */}
                <th className="text-center py-2 px-2 min-w-[70px]">Cross Bank Qty</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Cross Bank Amt</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Cross Asset Qty</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Cross Asset Amt</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Presentase (P3)</th>
                
                {/* FOLLOW SOP (5 kolom) */}
                <th className="text-center py-2 px-2 min-w-[60px]">Buku Dosa</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SP1</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SP2</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SUS</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Total (P4)</th>
                
                {/* SUB SCORE (5 kolom) */}
                <th className="text-center py-2 px-2 min-w-[40px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P4</th>
                <th className="text-center py-2 px-2 min-w-[40px]">Avg</th>
              </tr>
            </thead>
            
            <tbody>
              {/* LOOPING OFFICERS */}
              {officerDataList.map((officer, idx) => (
                <React.Fragment key={`officer-${idx}`}>
                  {/* DEPOSIT ASPECT */}
                  <tr className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.no}</td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{officer.name}</td>
                    <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officer.panelId}</td>
                    <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.dept}</td>
                    <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">{officer.status}</span>
                    </td>
                    <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.joinDate}</td>
                    <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Deposit</td>
                    
                    {/* TIME MANAGEMENT */}
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sop || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sopPercent ? `${officer.deposit.sopPercent}%` : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.nonSop || '-'}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.deposit.intervalApp)}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.deposit.intervalRej)}</td>
                    
                    {/* HUMAN ERROR */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">100%</td>
                    
                    {/* PROBLEM SOLVING */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">100%</td>
                    
                    {/* FOLLOW SOP */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">100</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.deposit.p1 ? `${officer.deposit.p1}%` : '-'}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">100%</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">100%</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">100%</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.deposit.avg || '-'}</td>
                  </tr>

                  {/* WITHDRAWAL ASPECT */}
                  <tr className="border-b border-[#FFD700]/10 bg-[#0B1A33]/50 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Withdrawal</td>
                    
                    {/* TIME MANAGEMENT */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalApproved || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalReject || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sop || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sopPercent ? `${officer.withdrawal.sopPercent}%` : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.nonSop || '-'}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.withdrawal.intervalApp)}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.withdrawal.intervalRej)}</td>
                    
                    {/* HUMAN ERROR */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">100%</td>
                    
                    {/* PROBLEM SOLVING */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">-</td>
                    <td className="text-center py-2 px-2">100%</td>
                    
                    {/* FOLLOW SOP */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">100</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.withdrawal.p1 ? `${officer.withdrawal.p1}%` : '-'}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">100%</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">100%</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">100%</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.withdrawal.avg || '-'}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== CUSTOMER SERVICE KPI ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">CUSTOMER SERVICE KPI</h2>
        
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1600px]">
            <thead>
              {/* MAIN HEADER CS */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="5" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Poin 1</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Poin 2</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Poin 3</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">Poin 4</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Poin 5</th>
                <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-orange-500/10">Attendance & Attitude (Poin 6)</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-pink-500/10">SUB SCORE CS</th>
              </tr>
              
              {/* SUB HEADER CS */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
                <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[150px]">NAME</th>
                <th className="sticky left-[190px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">PANEL ID</th>
                <th className="sticky left-[290px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[390px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
                
                <th className="text-center py-2 px-2 min-w-[70px]">Total Chat</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Missed Chat</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Time Mgmt</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Comm Skill</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Problem Solving</th>
                
                <th className="text-center py-2 px-2 min-w-[40px]">S</th>
                <th className="text-center py-2 px-2 min-w-[40px]">I</th>
                <th className="text-center py-2 px-2 min-w-[40px]">A</th>
                <th className="text-center py-2 px-2 min-w-[40px]">U</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Total</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Target</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Achieve</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Presentase</th>
                
                <th className="text-center py-2 px-2 min-w-[40px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P4</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P5</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P6</th>
              </tr>
            </thead>
            <tbody>
              {officerDataList.map((officer, idx) => (
                <tr key={`cs-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.no}</td>
                  <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{officer.name}</td>
                  <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officer.panelId}</td>
                  <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.dept}</td>
                  <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">{officer.status}</span>
                  </td>
                  
                  <td className="text-center py-2 px-2">{officer.cs.totalChat}</td>
                  <td className="text-center py-2 px-2">{officer.cs.missedChat}</td>
                  <td className="text-center py-2 px-2">{officer.cs.timeMgmt}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.commSkill}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.problemSolving}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.s}</td>
                  <td className="text-center py-2 px-2">{officer.cs.i}</td>
                  <td className="text-center py-2 px-2">{officer.cs.a}</td>
                  <td className="text-center py-2 px-2">{officer.cs.u}</td>
                  <td className="text-center py-2 px-2">{officer.cs.total}</td>
                  <td className="text-center py-2 px-2">{officer.cs.target}</td>
                  <td className="text-center py-2 px-2">{officer.cs.achieve}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.p1}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.p2}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.p3}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.p4}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.p5}%</td>
                  <td className="text-center py-2 px-2">{officer.cs.p6}%</td>
                </tr>
              ))}
              
              {/* BOT ROW */}
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officers.length + 1}</td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium text-blue-400">BOT</td>
                <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">System</td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px]">SYSTEM</span>
                </td>
                <td colSpan="19" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Summary • Data officers diambil dari database ({officers.length} officers CS DP WD) • Periode {bulanList.find(b => b.value === bulanAwal)?.label} - {bulanList.find(b => b.value === bulanAkhir)?.label} {tahun}</p>
        <p className="mt-1">P1: Time Management | P2: Human Error | P3: Problem Solving | P4: Follow SOP | P5: Chat Achievement | P6: Attendance & Attitude</p>
        <p className="mt-1 text-green-400">✓ Time Management menggunakan data real berdasarkan approved_date</p>
        <p className="mt-1 text-yellow-400">✓ Interval App & Rej dalam format HH:MM:SS</p>
        <p className="mt-1 text-blue-400">✓ Attendance (S/I/A/U) dari API Schedule real</p>
      </div>
    </div>
  );
}