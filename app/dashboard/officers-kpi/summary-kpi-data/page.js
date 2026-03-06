'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SummaryKPIDataPage() {
  const [tahun, setTahun] = useState('2026');
  const [periode, setPeriode] = useState('Jan - Jun');

  // DATA DUMMY SESUAI EXCEL - DEPOSIT & WITHDRAWAL (2 BARIS PER OFFICER)
  const dpwdData = [
    // OFFICER 1 - HAKIM
    { no: 1, name: 'Hakim', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-01-15', aspect: 'Deposit Aspect',
      totalApproved: 145, totalReject: 2, intervalApp: 2, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 95, p2: 100, p3: 100, p4: 100, avg: 98.75 },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: 138, totalReject: 1, intervalApp: 1, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 94, p2: 100, p3: 100, p4: 100, avg: 98.5 },
    
    // OFFICER 2 - ZAKIY
    { no: 2, name: 'Zakiy', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-02-10', aspect: 'Deposit Aspect',
      totalApproved: 132, totalReject: 3, intervalApp: 3, intervalRej: 1,
      heQty: 1, heAmount: '500K', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 1, crossBankAmount: '500K', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 92, p2: 95, p3: 90, p4: 95, avg: 93 },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: 128, totalReject: 2, intervalApp: 2, intervalRej: 1,
      heQty: 1, heAmount: '250K', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 1, crossBankAmount: '250K', crossAssetQty: 1, crossAssetAmount: '250K',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 90, p2: 92, p3: 88, p4: 92, avg: 90.5 },
    
    // OFFICER 3 - GOLDIE
    { no: 3, name: 'Goldie', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-03-05', aspect: 'Deposit Aspect',
      totalApproved: 150, totalReject: 0, intervalApp: 1, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 98, p2: 100, p3: 100, p4: 100, avg: 99.5 },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: 142, totalReject: 1, intervalApp: 1, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 97, p2: 100, p3: 100, p4: 100, avg: 99.25 },
    
    // OFFICER 4 - VINI
    { no: 4, name: 'Vini', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-04-20', aspect: 'Deposit Aspect',
      totalApproved: 118, totalReject: 4, intervalApp: 4, intervalRej: 2,
      heQty: 1, heAmount: '500K', mistakeQty: 1, mistakeAmount: '250K', blockBank: 0,
      crossBankQty: 1, crossBankAmount: '500K', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 88, p2: 85, p3: 80, p4: 85, avg: 84.5 },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: 112, totalReject: 3, intervalApp: 3, intervalRej: 1,
      heQty: 1, heAmount: '250K', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 85, p2: 88, p3: 85, p4: 90, avg: 87 },
    
    // OFFICER 5 - RONALDO
    { no: 5, name: 'Ronaldo', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-05-12', aspect: 'Deposit Aspect',
      totalApproved: 135, totalReject: 1, intervalApp: 2, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 90, p2: 100, p3: 100, p4: 100, avg: 97.5 },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: 128, totalReject: 1, intervalApp: 1, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 89, p2: 100, p3: 100, p4: 100, avg: 97.25 },
    
    // OFFICER 6 - SULAEMAN
    { no: 6, name: 'Sulaeman', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-06-08', aspect: 'Deposit Aspect',
      totalApproved: 142, totalReject: 1, intervalApp: 1, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 96, p2: 100, p3: 100, p4: 100, avg: 99 },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: 135, totalReject: 0, intervalApp: 1, intervalRej: 0,
      heQty: 0, heAmount: '-', mistakeQty: 0, mistakeAmount: '-', blockBank: 0,
      crossBankQty: 0, crossBankAmount: '-', crossAssetQty: 0, crossAssetAmount: '-',
      bukuDosa: 0, sp1: 0, sp2: 0, sus: 0,
      p1: 95, p2: 100, p3: 100, p4: 100, avg: 98.75 },
    
    // SYSTEM
    { no: 7, name: 'System', dept: 'System', status: 'SYSTEM', joinDate: '-', aspect: 'Deposit Aspect',
      totalApproved: '-', totalReject: '-', intervalApp: '-', intervalRej: '-',
      heQty: '-', heAmount: '-', mistakeQty: '-', mistakeAmount: '-', blockBank: '-',
      crossBankQty: '-', crossBankAmount: '-', crossAssetQty: '-', crossAssetAmount: '-',
      bukuDosa: '-', sp1: '-', sp2: '-', sus: '-',
      p1: '-', p2: '-', p3: '-', p4: '-', avg: '-' },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: '-', totalReject: '-', intervalApp: '-', intervalRej: '-',
      heQty: '-', heAmount: '-', mistakeQty: '-', mistakeAmount: '-', blockBank: '-',
      crossBankQty: '-', crossBankAmount: '-', crossAssetQty: '-', crossAssetAmount: '-',
      bukuDosa: '-', sp1: '-', sp2: '-', sus: '-',
      p1: '-', p2: '-', p3: '-', p4: '-', avg: '-' },
    
    // TOTAL ALL
    { no: 8, name: 'TOTAL ALL', dept: 'System + Human', status: '-', joinDate: '-', aspect: 'Deposit Aspect',
      totalApproved: '822', totalReject: '11', intervalApp: '13', intervalRej: '3',
      heQty: '2', heAmount: '1M', mistakeQty: '1', mistakeAmount: '250K', blockBank: '0',
      crossBankQty: '2', crossBankAmount: '1M', crossAssetQty: '0', crossAssetAmount: '0',
      bukuDosa: '0', sp1: '0', sp2: '0', sus: '0',
      p1: '559', p2: '580', p3: '570', p4: '580', avg: '572' },
    { no: '', name: '', dept: '', status: '', joinDate: '', aspect: 'Withdrawal Aspect',
      totalApproved: '763', totalReject: '7', intervalApp: '8', intervalRej: '2',
      heQty: '2', heAmount: '500K', mistakeQty: '0', mistakeAmount: '0', blockBank: '0',
      crossBankQty: '1', crossBankAmount: '250K', crossAssetQty: '1', crossAssetAmount: '250K',
      bukuDosa: '0', sp1: '0', sp2: '0', sus: '0',
      p1: '550', p2: '580', p3: '573', p4: '582', avg: '571' }
  ];

  // DATA CUSTOMER SERVICE (TETAP SAMA - SATU BARIS PER OFFICER)
  const csData = [
    { no: 1, name: 'Hakim', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-01-15',
      totalChat: 145, missedChat: 2, timeMgmt: 95, commSkill: 90, problemSolving: 88,
      s: 0, i: 0, a: 0, u: 0, total: 145, target: 150, achieve: 96.7,
      p1: 96.7, p2: 95, p3: 90, p4: 88, p5: 100, p6: 100 },
    { no: 2, name: 'Zakiy', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-02-10',
      totalChat: 138, missedChat: 1, timeMgmt: 92, commSkill: 88, problemSolving: 85,
      s: 1, i: 0, a: 0, u: 0, total: 138, target: 150, achieve: 92,
      p1: 92, p2: 92, p3: 88, p4: 85, p5: 98, p6: 98 },
    { no: 3, name: 'Goldie', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-03-05',
      totalChat: 142, missedChat: 3, timeMgmt: 90, commSkill: 92, problemSolving: 90,
      s: 0, i: 1, a: 0, u: 0, total: 142, target: 150, achieve: 94.7,
      p1: 94.7, p2: 90, p3: 92, p4: 90, p5: 95, p6: 95 },
    { no: 4, name: 'Vini', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-04-20',
      totalChat: 128, missedChat: 0, timeMgmt: 88, commSkill: 85, problemSolving: 82,
      s: 0, i: 0, a: 0, u: 0, total: 128, target: 150, achieve: 85.3,
      p1: 85.3, p2: 88, p3: 85, p4: 82, p5: 100, p6: 100 },
    { no: 5, name: 'Ronaldo', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-05-12',
      totalChat: 135, missedChat: 2, timeMgmt: 85, commSkill: 88, problemSolving: 86,
      s: 0, i: 0, a: 0, u: 0, total: 135, target: 150, achieve: 90,
      p1: 90, p2: 85, p3: 88, p4: 86, p5: 100, p6: 100 },
    { no: 6, name: 'Sulaeman', dept: 'CS DP WD', status: 'REGULAR', joinDate: '2023-06-08',
      totalChat: 140, missedChat: 1, timeMgmt: 94, commSkill: 91, problemSolving: 89,
      s: 0, i: 0, a: 0, u: 0, total: 140, target: 150, achieve: 93.3,
      p1: 93.3, p2: 94, p3: 91, p4: 89, p5: 100, p6: 100 },
    { no: 7, name: 'BOT', dept: 'System', status: 'SYSTEM', joinDate: '-',
      totalChat: 200, missedChat: 0, timeMgmt: 100, commSkill: 100, problemSolving: 100,
      s: 0, i: 0, a: 0, u: 0, total: 200, target: 200, achieve: 100,
      p1: 100, p2: 100, p3: 100, p4: 100, p5: 100, p6: 100 }
  ];

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* BACK TO OFFICERS KPI */}
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
      </div>

      {/* BAGIAN 1: DEPOSIT & WITHDRAWAL KPI */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
        
        {/* TABLE WRAPPER - SCROLL HORIZONTAL */}
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[2000px]">
            <thead>
              {/* HEADER ROW 1 - KATEGORI UTAMA */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="6" className="text-left py-2 px-2 text-[#FFD700] bg-[#1A2F4A] sticky left-0 z-20"> </th>
                <th colSpan="4" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Time Management</th>
                <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10"> </th>
                <th colSpan="7" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Human Error</th>
                <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Problem Solving</th>
                <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Follow SOP / Teamwork</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">SUB SCORE DP & WD</th>
              </tr>
              
              {/* HEADER ROW 2 - SUB KATEGORI */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                {/* STICKY COLUMNS */}
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[50px]">No</th>
                <th className="sticky left-[50px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">NAME</th>
                <th className="sticky left-[150px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[250px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
                <th className="sticky left-[330px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">JOIN DATE</th>
                <th className="sticky left-[430px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">ASPECT</th>
                
                {/* Time Management */}
                <th className="text-center py-2 px-2 min-w-[60px]">Total App</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Total Rej</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP %</th>
                <th className="text-center py-2 px-2 min-w-[60px]">NON SOP</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP %</th>
                <th className="text-center py-2 px-2 min-w-[60px]">NON SOP</th>
                
                {/* Human Error */}
                <th className="text-center py-2 px-2 min-w-[70px]">Interval App</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Interval Rej</th>
                <th className="text-center py-2 px-2 min-w-[50px]">HE Qty</th>
                <th className="text-center py-2 px-2 min-w-[70px]">HE Amount</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Mistake Qty</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Mistake Amt</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Block Bank</th>
                
                {/* Problem Solving */}
                <th className="text-center py-2 px-2 min-w-[80px]">Cross Bank Qty</th>
                <th className="text-center py-2 px-2 min-w-[90px]">Cross Bank Amt</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Cross Asset Qty</th>
                <th className="text-center py-2 px-2 min-w-[90px]">Cross Asset Amt</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Presentase</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Poin 2</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Poin 3</th>
                
                {/* Follow SOP / Teamwork */}
                <th className="text-center py-2 px-2 min-w-[70px]">Buku Dosa</th>
                <th className="text-center py-2 px-2 min-w-[50px]">SP1</th>
                <th className="text-center py-2 px-2 min-w-[50px]">SP2</th>
                <th className="text-center py-2 px-2 min-w-[50px]">SUS</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Total Poin 4</th>
                
                {/* SUB SCORE */}
                <th className="text-center py-2 px-2 min-w-[50px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P4</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Avg</th>
              </tr>
            </thead>
            <tbody>
              {dpwdData.map((row, index) => {
                // Tentukan apakah baris ini perlu nampilin no/name atau tidak
                const showMainInfo = row.no !== '';
                
                return (
                  <tr key={index} className={`border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5 ${
                    row.aspect === 'Withdrawal Aspect' ? 'bg-[#0B1A33]/30' : ''
                  }`}>
                    {/* STICKY COLUMNS */}
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{row.no}</td>
                    <td className="sticky left-[50px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{row.name}</td>
                    <td className="sticky left-[150px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{row.dept}</td>
                    <td className="sticky left-[250px] z-10 bg-[#1A2F4A] py-2 px-2">
                      {row.status && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          row.status === 'REGULAR' ? 'bg-green-500/20 text-green-400' : 
                          row.status === 'SYSTEM' ? 'bg-blue-500/20 text-blue-400' : 
                          row.status === '-' ? '' : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {row.status}
                        </span>
                      )}
                    </td>
                    <td className="sticky left-[330px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{row.joinDate}</td>
                    <td className="sticky left-[430px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">{row.aspect}</td>
                    
                    {/* Time Management */}
                    <td className="text-center py-2 px-2">{row.totalApproved}</td>
                    <td className="text-center py-2 px-2">{row.totalReject}</td>
                    <td className="text-center py-2 px-2">{row.totalApproved}</td>
                    <td className="text-center py-2 px-2">{row.p1}%</td>
                    <td className="text-center py-2 px-2">{row.totalReject}</td>
                    <td className="text-center py-2 px-2">{row.totalApproved}</td>
                    <td className="text-center py-2 px-2">{row.p1}%</td>
                    <td className="text-center py-2 px-2">{row.totalReject}</td>
                    
                    {/* Human Error */}
                    <td className="text-center py-2 px-2">{row.intervalApp}</td>
                    <td className="text-center py-2 px-2">{row.intervalRej}</td>
                    <td className="text-center py-2 px-2">{row.heQty}</td>
                    <td className="text-center py-2 px-2">{row.heAmount}</td>
                    <td className="text-center py-2 px-2">{row.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{row.mistakeAmount}</td>
                    <td className="text-center py-2 px-2">{row.blockBank}</td>
                    
                    {/* Problem Solving */}
                    <td className="text-center py-2 px-2">{row.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{row.crossBankAmount}</td>
                    <td className="text-center py-2 px-2">{row.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{row.crossAssetAmount}</td>
                    <td className="text-center py-2 px-2">{row.p3}%</td>
                    <td className="text-center py-2 px-2">{row.p2}</td>
                    <td className="text-center py-2 px-2">{row.p3}</td>
                    
                    {/* Follow SOP / Teamwork */}
                    <td className="text-center py-2 px-2">{row.bukuDosa}</td>
                    <td className="text-center py-2 px-2">{row.sp1}</td>
                    <td className="text-center py-2 px-2">{row.sp2}</td>
                    <td className="text-center py-2 px-2">{row.sus}</td>
                    <td className="text-center py-2 px-2">{row.p4}</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{row.p1}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{row.p2}</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{row.p3}</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{row.p4}</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{row.avg}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BAGIAN 2: CUSTOMER SERVICE KPI (SAMA KAYA SEBELUMNYA) */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">CUSTOMER SERVICE KPI</h2>
        
        {/* TABLE WRAPPER - SCROLL HORIZONTAL */}
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1400px]">
            <thead>
              {/* HEADER ROW 1 - KATEGORI UTAMA */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="5" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
                <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Poin 1</th>
                <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Poin 2</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Poin 3</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">Poin 4</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Poin 5 & Attendance</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-orange-500/10">SUB SCORE CS</th>
              </tr>
              
              {/* HEADER ROW 2 - SUB KATEGORI */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                {/* STICKY COLUMNS */}
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[50px]">No</th>
                <th className="sticky left-[50px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">NAME</th>
                <th className="sticky left-[150px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[250px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
                <th className="sticky left-[330px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">JOIN DATE</th>
                
                {/* Poin 1 */}
                <th className="text-center py-2 px-2 min-w-[70px]">Total Chat</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Missed Chat</th>
                
                {/* Poin 2 */}
                <th className="text-center py-2 px-2 min-w-[80px]">Time Mgmt</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Comm Skill</th>
                
                {/* Poin 3 */}
                <th className="text-center py-2 px-2 min-w-[90px]">Problem Solving</th>
                
                {/* Poin 4 */}
                <th className="text-center py-2 px-2 min-w-[70px]">Follow SOP</th>
                
                {/* Poin 5 & Attendance */}
                <th className="text-center py-2 px-2 min-w-[40px]">S</th>
                <th className="text-center py-2 px-2 min-w-[40px]">I</th>
                <th className="text-center py-2 px-2 min-w-[40px]">A</th>
                <th className="text-center py-2 px-2 min-w-[40px]">U</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Total</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Target</th>
                
                {/* SUB SCORE */}
                <th className="text-center py-2 px-2 min-w-[50px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P4</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P5</th>
                <th className="text-center py-2 px-2 min-w-[50px]">P6</th>
              </tr>
            </thead>
            <tbody>
              {csData.map((row) => (
                <tr key={row.no} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  {/* STICKY COLUMNS */}
                  <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{row.no}</td>
                  <td className="sticky left-[50px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{row.name}</td>
                  <td className="sticky left-[150px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{row.dept}</td>
                  <td className="sticky left-[250px] z-10 bg-[#1A2F4A] py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      row.status === 'REGULAR' ? 'bg-green-500/20 text-green-400' : 
                      row.status === 'SYSTEM' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="sticky left-[330px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{row.joinDate}</td>
                  
                  {/* Poin 1 */}
                  <td className="text-center py-2 px-2">{row.totalChat}</td>
                  <td className="text-center py-2 px-2">{row.missedChat}</td>
                  
                  {/* Poin 2 */}
                  <td className="text-center py-2 px-2">{row.timeMgmt}%</td>
                  <td className="text-center py-2 px-2">{row.commSkill}%</td>
                  
                  {/* Poin 3 */}
                  <td className="text-center py-2 px-2">{row.problemSolving}%</td>
                  
                  {/* Poin 4 */}
                  <td className="text-center py-2 px-2">100%</td>
                  
                  {/* Poin 5 & Attendance */}
                  <td className="text-center py-2 px-2">{row.s}</td>
                  <td className="text-center py-2 px-2">{row.i}</td>
                  <td className="text-center py-2 px-2">{row.a}</td>
                  <td className="text-center py-2 px-2">{row.u}</td>
                  <td className="text-center py-2 px-2">{row.total}</td>
                  <td className="text-center py-2 px-2">{row.target}</td>
                  
                  {/* SUB SCORE */}
                  <td className="text-center py-2 px-2 font-bold text-blue-400">{row.p1}%</td>
                  <td className="text-center py-2 px-2 font-bold text-green-400">{row.p2}%</td>
                  <td className="text-center py-2 px-2 font-bold text-yellow-400">{row.p3}%</td>
                  <td className="text-center py-2 px-2 font-bold text-purple-400">{row.p4}%</td>
                  <td className="text-center py-2 px-2 font-bold text-red-400">{row.p5}%</td>
                  <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{row.p6}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Summary • Deposit & Withdrawal (2 baris per officer: Deposit Aspect & Withdrawal Aspect) • Periode {periode} {tahun}</p>
        <p className="mt-1">P1: Time Management | P2: Human Error | P3: Problem Solving | P4: Follow SOP | P5: Chat Achievement | P6: Attendance</p>
      </div>
    </div>
  );
}