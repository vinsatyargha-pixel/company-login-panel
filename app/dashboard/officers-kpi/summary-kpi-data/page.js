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
  // GENERATE DATA DUMMY LENGKAP
  // ===========================================
  const generateDummyData = (officer, index) => {
    const baseNo = index + 1;
    
    // DATA DEPOSIT
    const depositTotal = Math.floor(Math.random() * 50) + 100;
    const depositReject = Math.floor(Math.random() * 5);
    const depositSOP = Math.floor(Math.random() * 10) + 85;
    
    // DATA WITHDRAWAL  
    const withdrawalTotal = Math.floor(Math.random() * 40) + 80;
    const withdrawalReject = Math.floor(Math.random() * 4);
    const withdrawalSOP = Math.floor(Math.random() * 10) + 80;
    
    // DATA CS
    const totalChat = Math.floor(Math.random() * 100) + 100;
    const missedChat = Math.floor(Math.random() * 5);
    
    return {
      deposit: {
        no: baseNo,
        name: officer.full_name || 'Unknown',
        panelId: officer.panel_id || '-',
        dept: officer.department || 'CS DP WD',
        status: officer.status || 'REGULAR',
        joinDate: officer.join_date || '-',
        aspect: 'Deposit',
        totalApproved: depositTotal,
        totalReject: depositReject,
        sop: depositTotal,
        sopPercent: depositSOP,
        nonSop: depositReject,
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
        p1: depositSOP,
        p2: Math.random() > 0.3 ? 100 : 95,
        p3: Math.random() > 0.3 ? 100 : 90,
        p4: Math.random() > 0.3 ? 100 : 95,
        avg: Math.floor((depositSOP + 100 + 100 + 100) / 4)
      },
      withdrawal: {
        no: '',
        name: '',
        panelId: '',
        dept: '',
        status: '',
        joinDate: '',
        aspect: 'Withdrawal',
        totalApproved: withdrawalTotal,
        totalReject: withdrawalReject,
        sop: withdrawalTotal,
        sopPercent: withdrawalSOP,
        nonSop: withdrawalReject,
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
        p1: withdrawalSOP,
        p2: Math.random() > 0.4 ? 100 : 92,
        p3: Math.random() > 0.4 ? 100 : 88,
        p4: Math.random() > 0.4 ? 100 : 92,
        avg: Math.floor((withdrawalSOP + 100 + 100 + 100) / 4)
      },
      cs: {
        no: baseNo,
        name: officer.full_name || 'Unknown',
        panelId: officer.panel_id || '-',
        dept: officer.department || 'CS DP WD',
        status: officer.status || 'REGULAR',
        joinDate: officer.join_date || '-',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* BACK LINK */}
      <div className="mb-6">
        <Link href="/dashboard/officers-kpi" className="text-[#A7D8FF] hover:text-[#FFD700] text-sm">
          ← BACK TO OFFICERS KPI
        </Link>
      </div>

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#FFD700] mb-2">SUMMARY KPI DATA</h1>
      <p className="text-[#A7D8FF] mb-6">KPI Summary CS DP WD • Periode {periode} {tahun}</p>

      {/* FILTER */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-8 flex gap-4 items-center">
        <span className="text-[#FFD700] text-sm">FILTER RANGE:</span>
        <select value={tahun} onChange={(e) => setTahun(e.target.value)} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm w-24">
          <option>2024</option><option>2025</option><option>2026</option><option>2027</option>
        </select>
        <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm w-28">
          <option>Jan - Jun</option><option>Jul - Dec</option>
        </select>
        <span className="text-[#A7D8FF] text-sm ml-auto">Total Officers: {officers.length}</span>
      </div>

      {/* ========== DEPOSIT & WITHDRAWAL KPI ========== */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[2000px]">
            <thead>
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF]">
                <th className="sticky left-0 bg-[#1A2F4A] py-2 px-2 text-left">No</th>
                <th className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 text-left min-w-[150px]">NAME</th>
                <th className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2 text-left min-w-[100px]">PANEL ID</th>
                <th className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2 text-left">DEPT</th>
                <th className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2 text-left">STATUS</th>
                <th className="sticky left-[490px] bg-[#1A2F4A] py-2 px-2 text-left">JOIN DATE</th>
                <th className="sticky left-[590px] bg-[#1A2F4A] py-2 px-2 text-left">ASPECT</th>
                <th className="py-2 px-2 text-center">Total App</th>
                <th className="py-2 px-2 text-center">Total Rej</th>
                <th className="py-2 px-2 text-center">SOP</th>
                <th className="py-2 px-2 text-center">SOP%</th>
                <th className="py-2 px-2 text-center">Non SOP</th>
                <th className="py-2 px-2 text-center">Interval App</th>
                <th className="py-2 px-2 text-center">Interval Rej</th>
                <th className="py-2 px-2 text-center">HE Qty</th>
                <th className="py-2 px-2 text-center">HE Amt</th>
                <th className="py-2 px-2 text-center">Mistake Qty</th>
                <th className="py-2 px-2 text-center">Mistake Amt</th>
                <th className="py-2 px-2 text-center">Block Bank</th>
                <th className="py-2 px-2 text-center">Cross Bank Qty</th>
                <th className="py-2 px-2 text-center">Cross Bank Amt</th>
                <th className="py-2 px-2 text-center">Cross Asset Qty</th>
                <th className="py-2 px-2 text-center">Cross Asset Amt</th>
                <th className="py-2 px-2 text-center">P1</th>
                <th className="py-2 px-2 text-center">P2</th>
                <th className="py-2 px-2 text-center">P3</th>
                <th className="py-2 px-2 text-center">P4</th>
                <th className="py-2 px-2 text-center">Avg</th>
              </tr>
            </thead>
            <tbody>
              {/* LOOPING DEPOSIT & WITHDRAWAL */}
              {officerDataList.map((officer, idx) => (
                <>
                  {/* DEPOSIT ASPECT */}
                  <tr key={`dep-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 bg-[#1A2F4A] py-2 px-2">{officer.deposit.no}</td>
                    <td className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 font-medium">{officer.deposit.name}</td>
                    <td className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officer.deposit.panelId}</td>
                    <td className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2">{officer.deposit.dept}</td>
                    <td className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">{officer.deposit.status}</span>
                    </td>
                    <td className="sticky left-[490px] bg-[#1A2F4A] py-2 px-2">{officer.deposit.joinDate}</td>
                    <td className="sticky left-[590px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Deposit</td>
                    
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sop}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sopPercent}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.nonSop}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.intervalApp}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.intervalRej}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.heQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.heAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.mistakeAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.blockBank}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossBankAmount}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossAssetAmount}</td>
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.deposit.p1}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.deposit.p2}</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.deposit.p3}</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.deposit.p4}</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.deposit.avg}</td>
                  </tr>

                  {/* WITHDRAWAL ASPECT */}
                  <tr key={`wd-${idx}`} className="border-b border-[#FFD700]/10 bg-[#0B1A33]/50 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[490px] bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[590px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Withdrawal</td>
                    
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalReject}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sop}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sopPercent}%</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.nonSop}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.intervalApp}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.intervalRej}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.heQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.heAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.mistakeAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.blockBank}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossBankAmount}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossAssetAmount}</td>
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.withdrawal.p1}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.withdrawal.p2}</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.withdrawal.p3}</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.withdrawal.p4}</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.withdrawal.avg}</td>
                  </tr>
                </>
              ))}

              {/* SYSTEM ROW */}
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 bg-[#1A2F4A] py-2 px-2">{officers.length + 1}</td>
                <td className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 text-blue-400">System</td>
                <td className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2">System</td>
                <td className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">SYSTEM</span></td>
                <td className="sticky left-[490px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[590px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Deposit</td>
                <td colSpan="21" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>

              {/* TOTAL ALL */}
              <tr className="border-t-2 border-[#FFD700]/30 font-bold bg-[#1A2F4A]/80">
                <td className="sticky left-0 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officers.length + 2}</td>
                <td className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">TOTAL ALL</td>
                <td className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[490px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[590px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Deposit</td>
                <td colSpan="21" className="text-center py-2 px-2 text-[#FFD700]">822</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== CUSTOMER SERVICE KPI ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">CUSTOMER SERVICE KPI</h2>
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF]">
                <th className="sticky left-0 bg-[#1A2F4A] py-2 px-2 text-left">No</th>
                <th className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 text-left min-w-[150px]">NAME</th>
                <th className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2 text-left">PANEL ID</th>
                <th className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2 text-left">DEPT</th>
                <th className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2 text-left">STATUS</th>
                <th className="py-2 px-2 text-center">Total Chat</th>
                <th className="py-2 px-2 text-center">Missed</th>
                <th className="py-2 px-2 text-center">Time Mgmt</th>
                <th className="py-2 px-2 text-center">Comm Skill</th>
                <th className="py-2 px-2 text-center">Problem Solve</th>
                <th className="py-2 px-2 text-center">S</th>
                <th className="py-2 px-2 text-center">I</th>
                <th className="py-2 px-2 text-center">A</th>
                <th className="py-2 px-2 text-center">U</th>
                <th className="py-2 px-2 text-center">Total</th>
                <th className="py-2 px-2 text-center">Target</th>
                <th className="py-2 px-2 text-center">Achieve%</th>
                <th className="py-2 px-2 text-center">P1</th>
                <th className="py-2 px-2 text-center">P2</th>
                <th className="py-2 px-2 text-center">P3</th>
                <th className="py-2 px-2 text-center">P4</th>
                <th className="py-2 px-2 text-center">P5</th>
                <th className="py-2 px-2 text-center">P6</th>
              </tr>
            </thead>
            <tbody>
              {officerDataList.map((officer, idx) => (
                <tr key={`cs-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  <td className="sticky left-0 bg-[#1A2F4A] py-2 px-2">{officer.cs.no}</td>
                  <td className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 font-medium">{officer.cs.name}</td>
                  <td className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officer.cs.panelId}</td>
                  <td className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2">{officer.cs.dept}</td>
                  <td className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">{officer.cs.status}</span>
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
                <td className="sticky left-0 bg-[#1A2F4A] py-2 px-2">7</td>
                <td className="sticky left-[40px] bg-[#1A2F4A] py-2 px-2 text-blue-400">BOT</td>
                <td className="sticky left-[190px] bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[290px] bg-[#1A2F4A] py-2 px-2">System</td>
                <td className="sticky left-[390px] bg-[#1A2F4A] py-2 px-2"><span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded">SYSTEM</span></td>
                <td colSpan="18" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center">
        <p>KPI Summary • Data officers: {officers.length} CS DP WD • Periode {periode} {tahun}</p>
        <p>P1: Chat Achievement | P2: Time Management | P3: Communication | P4: Problem Solving | P5: Attendance | P6: Attitude</p>
      </div>
    </div>
  );
}