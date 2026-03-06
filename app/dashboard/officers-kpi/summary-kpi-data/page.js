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
  // FETCH OFFICERS DARI DATABASE
  // ===========================================
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        
        // Ambil dari tabel users (atau officers) yang department = CS DP WD
        const { data, error } = await supabase
          .from('users')  // atau 'officers' tergantung nama tabel lo
          .select('id, user_id, email, full_name, department, role, join_date')
          .eq('department', 'CS DP WD')
          .order('full_name');

        if (error) throw error;
        
        // Filter yang beneran CS DP WD (case insensitive)
        const filteredData = data?.filter(officer => 
          officer.department?.toUpperCase().includes('CS') &&
          officer.department?.toUpperCase().includes('DP') &&
          officer.department?.toUpperCase().includes('WD')
        ) || [];
        
        setOfficers(filteredData);
        console.log('Officers CS DP WD:', filteredData);
        
      } catch (error) {
        console.error('Error fetching officers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // DATA DUMMY TRANSAKSI (nanti diganti dengan data real)
  const getDummyDataForOfficer = (officerName) => {
    // Ini cuma contoh, nanti ambil dari deposit_transactions & withdrawal_transactions
    return {
      deposit: {
        totalApproved: Math.floor(Math.random() * 50) + 100,
        totalReject: Math.floor(Math.random() * 5),
        sop: Math.floor(Math.random() * 10) + 85,
      },
      withdrawal: {
        totalApproved: Math.floor(Math.random() * 40) + 80,
        totalReject: Math.floor(Math.random() * 4),
        sop: Math.floor(Math.random() * 10) + 83,
      }
    };
  };

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
        </div>
      </div>
    );
  }

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
        <span className="text-[#A7D8FF] text-sm ml-auto">
          Total Officers: {officers.length}
        </span>
      </div>

      {/* BAGIAN 1: DEPOSIT & WITHDRAWAL KPI */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
        
        {/* TABLE WRAPPER - SCROLL HORIZONTAL */}
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1800px]">
            <thead>
              {/* HEADER ROW 1 - KATEGORI UTAMA */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="6" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
                <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Time Management</th>
                <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Human Error</th>
                <th colSpan="4" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Problem Solving</th>
                <th colSpan="4" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Follow SOP</th>
                <th colSpan="4" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">SUB SCORE</th>
              </tr>
              
              {/* HEADER ROW 2 - SUB KATEGORI */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                {/* STICKY COLUMNS */}
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
                <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[120px]">NAME</th>
                <th className="sticky left-[160px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[60px]">ID</th>
                <th className="sticky left-[220px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[320px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[70px]">STATUS</th>
                <th className="sticky left-[390px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">ASPECT</th>
                
                {/* Time Management */}
                <th className="text-center py-2 px-2 min-w-[60px]">Total App</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Total Rej</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                <th className="text-center py-2 px-2 min-w-[50px]">SOP%</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Non SOP</th>
                <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                <th className="text-center py-2 px-2 min-w-[50px]">SOP%</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Non SOP</th>
                
                {/* Human Error */}
                <th className="text-center py-2 px-2 min-w-[60px]">HE Qty</th>
                <th className="text-center py-2 px-2 min-w-[70px]">HE Amount</th>
                
                {/* Problem Solving */}
                <th className="text-center py-2 px-2 min-w-[70px]">Cross Bank</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Cross Amt</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Cross Asset</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Asset Amt</th>
                
                {/* Follow SOP */}
                <th className="text-center py-2 px-2 min-w-[50px]">Buku Dosa</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SP1</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SP2</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SUS</th>
                
                {/* SUB SCORE */}
                <th className="text-center py-2 px-2 min-w-[40px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P4</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((officer, index) => {
                const officerData = getDummyDataForOfficer(officer.full_name);
                const rowNumber = index + 1;
                
                return (
                  <>
                    {/* DEPOSIT ASPECT */}
                    <tr key={`${officer.id}-deposit`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                      <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{rowNumber}</td>
                      <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{officer.full_name || officer.username}</td>
                      <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF] text-[9px]">{officer.user_id || officer.id}</td>
                      <td className="sticky left-[220px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.department}</td>
                      <td className="sticky left-[320px] z-10 bg-[#1A2F4A] py-2 px-2">
                        <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[10px]">
                          {officer.role || 'REGULAR'}
                        </span>
                      </td>
                      <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">Deposit</td>
                      
                      {/* Time Management */}
                      <td className="text-center py-2 px-2">{officerData.deposit.totalApproved}</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.totalReject}</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.totalApproved}</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.sop}%</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.totalReject}</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.totalApproved}</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.sop}%</td>
                      <td className="text-center py-2 px-2">{officerData.deposit.totalReject}</td>
                      
                      {/* Human Error */}
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">-</td>
                      
                      {/* Problem Solving */}
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">-</td>
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">-</td>
                      
                      {/* Follow SOP */}
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">0</td>
                      
                      {/* SUB SCORE */}
                      <td className="text-center py-2 px-2 font-bold text-blue-400">{officerData.deposit.sop}</td>
                      <td className="text-center py-2 px-2 font-bold text-red-400">100</td>
                      <td className="text-center py-2 px-2 font-bold text-yellow-400">100</td>
                      <td className="text-center py-2 px-2 font-bold text-green-400">100</td>
                    </tr>

                    {/* WITHDRAWAL ASPECT */}
                    <tr key={`${officer.id}-withdrawal`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5 bg-[#0B1A33]/30">
                      <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]"></td>
                      <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium"></td>
                      <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]"></td>
                      <td className="sticky left-[220px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]"></td>
                      <td className="sticky left-[320px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                      <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">Withdrawal</td>
                      
                      {/* Time Management */}
                      <td className="text-center py-2 px-2">{officerData.withdrawal.totalApproved}</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.totalReject}</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.totalApproved}</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.sop}%</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.totalReject}</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.totalApproved}</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.sop}%</td>
                      <td className="text-center py-2 px-2">{officerData.withdrawal.totalReject}</td>
                      
                      {/* Human Error */}
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">-</td>
                      
                      {/* Problem Solving */}
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">-</td>
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">-</td>
                      
                      {/* Follow SOP */}
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">0</td>
                      <td className="text-center py-2 px-2">0</td>
                      
                      {/* SUB SCORE */}
                      <td className="text-center py-2 px-2 font-bold text-blue-400">{officerData.withdrawal.sop}</td>
                      <td className="text-center py-2 px-2 font-bold text-red-400">100</td>
                      <td className="text-center py-2 px-2 font-bold text-yellow-400">100</td>
                      <td className="text-center py-2 px-2 font-bold text-green-400">100</td>
                    </tr>
                  </>
                );
              })}

              {/* SYSTEM ROW */}
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officers.length + 1}</td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium text-blue-400">System</td>
                <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                <td className="sticky left-[220px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">System</td>
                <td className="sticky left-[320px] z-10 bg-[#1A2F4A] py-2 px-2">
                  <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">SYSTEM</span>
                </td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">Deposit</td>
                <td colSpan="24" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[220px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[320px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">Withdrawal</td>
                <td colSpan="24" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
              </tr>

              {/* TOTAL ALL ROW */}
              <tr className="border-t-2 border-[#FFD700]/30 font-bold">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officers.length + 2}</td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">TOTAL ALL</td>
                <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[220px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[320px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Deposit</td>
                <td colSpan="24" className="text-center py-2 px-2 text-[#FFD700]">822</td>
              </tr>
              <tr className="border-b border-[#FFD700]/10 font-bold">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[220px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[320px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Withdrawal</td>
                <td colSpan="24" className="text-center py-2 px-2 text-[#FFD700]">763</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Summary • Data officers diambil dari database ({officers.length} officers CS DP WD) • Periode {periode} {tahun}</p>
      </div>
    </div>
  );
}