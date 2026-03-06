'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SummaryKPIDataPage() {
  const [tahun, setTahun] = useState('2026');
  const [periode, setPeriode] = useState('Jan - Jun');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

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
        
        setOfficers(data || []);
        
      } catch (error) {
        console.error('Error fetching officers:', error);
        setOfficers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // ===========================================
  // GENERATE DATA DUMMY
  // ===========================================
  const generateDummyData = (officer, index) => {
    const baseNo = index + 1;
    
    // Deposit Data
    const depositTotal = Math.floor(Math.random() * 50) + 100;
    const depositReject = Math.floor(Math.random() * 5);
    const depositSOP = Math.floor(Math.random() * 15) + 80;
    
    // Withdrawal Data
    const withdrawalTotal = Math.floor(Math.random() * 40) + 80;
    const withdrawalReject = Math.floor(Math.random() * 4);
    const withdrawalSOP = Math.floor(Math.random() * 15) + 75;
    
    // CS Data
    const totalChat = Math.floor(Math.random() * 100) + 100;
    const missedChat = Math.floor(Math.random() * 5);
    
    return {
      no: baseNo,
      name: officer.full_name || 'Unknown',
      panelId: officer.panel_id || '-',
      dept: officer.department || 'CS DP WD',
      status: officer.status || 'REGULAR',
      joinDate: officer.join_date || '-',
      
      deposit: {
        divisi: 'Deposit Aspect',
        totalApproved: depositTotal,
        totalReject: depositReject,
        sop1: depositTotal,
        sopPercent1: depositSOP,
        nonSop1: depositReject,
        sop2: depositTotal,
        sopPercent2: depositSOP,
        nonSop2: depositReject,
        intervalApp: Math.floor(Math.random() * 4) + 1,
        intervalRej: Math.floor(Math.random() * 2),
        heQty: Math.random() > 0.7 ? 1 : 0,
        heAmount: Math.random() > 0.7 ? '500K' : '-',
        mistakeQty: Math.random() > 0.8 ? 1 : 0,
        mistakeAmount: Math.random() > 0.8 ? '250K' : '-',
        blockBank: 0,
        crossBankQty: Math.random() > 0.6 ? 1 : 0,
        crossBankAmount: Math.random() > 0.6 ? '500K' : '-',
        crossAssetQty: Math.random() > 0.9 ? 1 : 0,
        crossAssetAmount: Math.random() > 0.9 ? '250K' : '-',
        bukuDosa: 0,
        sp1: 0,
        sp2: 0,
        sus: 0,
        totalPoin4: 100,
        p1: depositSOP,
        p2: Math.random() > 0.3 ? 100 : 95,
        p3: Math.random() > 0.3 ? 100 : 90,
        p4: 100,
        avg: Math.floor((depositSOP + 100 + 100 + 100) / 4)
      },
      
      withdrawal: {
        divisi: 'Withdrawal Aspect',
        totalApproved: withdrawalTotal,
        totalReject: withdrawalReject,
        sop1: withdrawalTotal,
        sopPercent1: withdrawalSOP,
        nonSop1: withdrawalReject,
        sop2: withdrawalTotal,
        sopPercent2: withdrawalSOP,
        nonSop2: withdrawalReject,
        intervalApp: Math.floor(Math.random() * 3) + 1,
        intervalRej: Math.floor(Math.random() * 2),
        heQty: Math.random() > 0.8 ? 1 : 0,
        heAmount: Math.random() > 0.8 ? '250K' : '-',
        mistakeQty: 0,
        mistakeAmount: '-',
        blockBank: 0,
        crossBankQty: Math.random() > 0.7 ? 1 : 0,
        crossBankAmount: Math.random() > 0.7 ? '250K' : '-',
        crossAssetQty: Math.random() > 0.9 ? 1 : 0,
        crossAssetAmount: Math.random() > 0.9 ? '250K' : '-',
        bukuDosa: 0,
        sp1: 0,
        sp2: 0,
        sus: 0,
        totalPoin4: 100,
        p1: withdrawalSOP,
        p2: Math.random() > 0.4 ? 100 : 92,
        p3: Math.random() > 0.4 ? 100 : 88,
        p4: 100,
        avg: Math.floor((withdrawalSOP + 100 + 100 + 100) / 4)
      },
      
      cs: {
        totalChat: totalChat,
        missedChat: missedChat,
        timeMgmt: Math.floor(Math.random() * 15) + 80,
        commSkill: Math.floor(Math.random() * 15) + 80,
        problemSolving: Math.floor(Math.random() * 15) + 80,
        s: Math.random() > 0.8 ? 1 : 0,
        i: Math.random() > 0.9 ? 1 : 0,
        a: 0,
        u: 0,
        total: totalChat,
        target: 150,
        achieve: Math.floor((totalChat / 150) * 100),
        p1: Math.floor((totalChat / 150) * 100),
        p2: Math.floor(Math.random() * 15) + 80,
        p3: Math.floor(Math.random() * 15) + 80,
        p4: Math.floor(Math.random() * 15) + 80,
        p5: 100,
        p6: 100
      }
    };
  };

  const officerDataList = officers.map((officer, index) => generateDummyData(officer, index));

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-4 text-[#FFD700]">Loading officers data...</p>
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
      <p className="text-[#A7D8FF] mb-6">KPI Summary CS DP WD • Periode {periode} {tahun}</p>

      {/* FILTER */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-8 flex flex-wrap gap-4 items-center">
        <span className="text-[#FFD700] font-bold text-sm">FILTER RANGE:</span>
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
          value={periode}
          onChange={(e) => setPeriode(e.target.value)}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm w-28"
        >
          <option>Jan - Jun</option>
          <option>Jul - Dec</option>
        </select>
        <span className="text-[#A7D8FF] text-sm ml-auto">
          Total Officers: {officers.length}
        </span>
      </div>

      {/* ========== DEPOSIT & WITHDRAWAL KPI ========== */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
        
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[2200px]">
            <thead>
              {/* MAIN HEADER - BARIS 1 */}
<tr className="border-b border-[#FFD700]/20">
  <th colSpan="7" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
  <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">TIME MANAGEMENT</th>
  <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">HUMAN ERROR</th>
  <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">PROBLEM SOLVING</th>
  <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">FOLLOW SOP / TEAMWORK</th>
  <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">SUB SCORE DP & WD</th>
</tr>

{/* SUB HEADER - BARIS 2 (PATOKAN LO - UDAH BENAR) */}
<tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
  {/* STICKY COLUMNS - 7 KOLOM */}
  <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
  <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[150px]">NAME</th>
  <th className="sticky left-[190px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">PANEL ID</th>
  <th className="sticky left-[290px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
  <th className="sticky left-[390px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
  <th className="sticky left-[470px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[90px]">JOIN DATE</th>
  <th className="sticky left-[560px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DIVISI</th>
  
  {/* TIME MANAGEMENT (8 kolom) */}
  <th className="text-center py-2 px-2 min-w-[70px]">Total App</th>
  <th className="text-center py-2 px-2 min-w-[70px]">Total Rej</th>
  <th className="text-center py-2 px-2 min-w-[60px]">SOP DP</th>
  <th className="text-center py-2 px-2 min-w-[60px]">SOP DP% (P1)</th>
  <th className="text-center py-2 px-2 min-w-[60px]">Non SOP DP</th>
  <th className="text-center py-2 px-2 min-w-[60px]">SOP WD</th>
  <th className="text-center py-2 px-2 min-w-[60px]">SOP WD%</th>
  <th className="text-center py-2 px-2 min-w-[60px]">Non SOP WD</th>
  
  {/* HUMAN ERROR (8 kolom) */}
  <th className="text-center py-2 px-2 min-w-[70px]">Interval App</th>
  <th className="text-center py-2 px-2 min-w-[70px]">Interval Rej</th>
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
                <>
                  {/* DEPOSIT ASPECT */}
                  <tr key={`dep-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
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
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sop1}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sopPercent1}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.nonSop1}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sop2}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sopPercent2}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.nonSop2}</td>
                    
                    {/* HUMAN ERROR */}
                    <td className="text-center py-2 px-2">{officer.deposit.intervalApp}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.intervalRej}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.heQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.heAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.mistakeAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.blockBank}</td>
                    
                    {/* PROBLEM SOLVING */}
                    <td className="text-center py-2 px-2">{officer.deposit.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossBankAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossAssetAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p2}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p3}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p2}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p3}</td>
                    
                    {/* FOLLOW SOP */}
                    <td className="text-center py-2 px-2">{officer.deposit.bukuDosa}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sp1}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sp2}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sus}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalPoin4}</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.deposit.p1}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.deposit.p2}</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.deposit.p3}</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.deposit.p4}</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.deposit.avg}</td>
                  </tr>

                  {/* WITHDRAWAL ASPECT */}
                  <tr key={`wd-${idx}`} className="border-b border-[#FFD700]/10 bg-[#0B1A33]/50 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Withdrawal</td>
                    
                    {/* TIME MANAGEMENT */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalReject}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sop1}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sopPercent1}%</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.nonSop1}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sop2}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sopPercent2}%</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.nonSop2}</td>
                    
                    {/* HUMAN ERROR */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.intervalApp}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.intervalRej}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.heQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.heAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.mistakeAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.blockBank}</td>
                    
                    {/* PROBLEM SOLVING */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossBankAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossAssetAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p2}%</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p3}%</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p2}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p3}</td>
                    
                    {/* FOLLOW SOP */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.bukuDosa}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sp1}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sp2}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sus}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalPoin4}</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.withdrawal.p1}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.withdrawal.p2}</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.withdrawal.p3}</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.withdrawal.p4}</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.withdrawal.avg}</td>
                  </tr>
                </>
              ))}

              {/* SYSTEM ROW - DEPOSIT */}
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officers.length + 1}</td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium text-blue-400">System</td>
                <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">System</td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px]">SYSTEM</span>
                </td>
                <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Deposit</td>
                <td colSpan="31" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>

              {/* SYSTEM ROW - WITHDRAWAL */}
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Withdrawal</td>
                <td colSpan="31" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>

              {/* TOTAL ALL - DEPOSIT */}
              <tr className="border-t-2 border-[#FFD700]/30 font-bold bg-[#1A2F4A]/80">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officers.length + 2}</td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">TOTAL ALL</td>
                <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Deposit</td>
                <td colSpan="31" className="text-center py-2 px-2 text-[#FFD700]">822</td>
              </tr>

              {/* TOTAL ALL - WITHDRAWAL */}
              <tr className="border-b border-[#FFD700]/10 font-bold bg-[#1A2F4A]/80">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Withdrawal</td>
                <td colSpan="31" className="text-center py-2 px-2 text-[#FFD700]">763</td>
              </tr>
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
                <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Poin 1</th>
                <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Poin 2</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Poin 3</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">Poin 4</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Poin 5 & Attendance (Poin 6)</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-orange-500/10">SUB SCORE CS</th>
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
                <th className="text-center py-2 px-2 min-w-[60px]">Follow SOP</th>
                <th className="text-center py-2 px-2 min-w-[40px]">S</th>
                <th className="text-center py-2 px-2 min-w-[40px]">I</th>
                <th className="text-center py-2 px-2 min-w-[40px]">A</th>
                <th className="text-center py-2 px-2 min-w-[40px]">U</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Total</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Target</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Achieve%</th>
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
                  <td className="text-center py-2 px-2">100%</td>
                  <td className="text-center py-2 px-2">{officer.cs.s}</td>
                  <td className="text-center py-2 px-2">{officer.cs.i}</td>
                  <td className="text-center py-2 px-2">{officer.cs.a}</td>
                  <td className="text-center py-2 px-2">{officer.cs.u}</td>
                  <td className="text-center py-2 px-2">{officer.cs.total}</td>
                  <td className="text-center py-2 px-2">{officer.cs.target}</td>
                  <td className="text-center py-2 px-2">{officer.cs.achieve}%</td>
                  <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.cs.p1}%</td>
                  <td className="text-center py-2 px-2 font-bold text-green-400">{officer.cs.p2}%</td>
                  <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.cs.p3}%</td>
                  <td className="text-center py-2 px-2 font-bold text-purple-400">{officer.cs.p4}%</td>
                  <td className="text-center py-2 px-2 font-bold text-red-400">{officer.cs.p5}%</td>
                  <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.cs.p6}%</td>
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
                <td colSpan="18" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Summary • Data officers diambil dari database ({officers.length} officers CS DP WD) • Periode {periode} {tahun}</p>
        <p className="mt-1">P1: Time Management | P2: Human Error | P3: Problem Solving | P4: Follow SOP | P5: Chat Achievement | P6: Attendance & Attitude</p>
      </div>
    </div>
  );
}