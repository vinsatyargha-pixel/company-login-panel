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
  // FETCH OFFICERS DARI TABEL OFFICERS
  // ===========================================
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        
        // Ambil dari tabel officers
        const { data, error } = await supabase
          .from('officers')  // GANTI JADI 'officers'
          .select('*')
          .eq('department', 'CS DP WD')
          .order('full_name', { ascending: true });

        if (error) throw error;
        
        console.log('Data officers:', data);
        setOfficers(data || []);
        
      } catch (error) {
        console.error('Error fetching officers:', error);
        setOfficers([]); // Set kosong kalau error
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // ===========================================
  // GENERATE DATA DUMMY UNTUK SETIAP OFFICER
  // ===========================================
  const generateDummyData = (officer, index) => {
    const baseNo = index + 1;
    const randomDeposit = Math.floor(Math.random() * 50) + 100;
    const randomWithdrawal = Math.floor(Math.random() * 40) + 80;
    
    return {
      deposit: {
        no: baseNo,
        name: officer.full_name || officer.name || 'Unknown',
        userId: officer.id || officer.user_id || '-',
        dept: officer.department || 'CS DP WD',
        status: officer.status || 'REGULAR',
        joinDate: officer.join_date || officer.created_at?.split('T')[0] || '-',
        aspect: 'Deposit Aspect',
        totalApproved: randomDeposit,
        totalReject: Math.floor(Math.random() * 5),
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
        p1: Math.floor(Math.random() * 10) + 85,
        p2: Math.random() > 0.3 ? 100 : 95,
        p3: Math.random() > 0.3 ? 100 : 90,
        p4: Math.random() > 0.3 ? 100 : 95,
        avg: 0
      },
      withdrawal: {
        no: '',
        name: '',
        userId: '',
        dept: '',
        status: '',
        joinDate: '',
        aspect: 'Withdrawal Aspect',
        totalApproved: randomWithdrawal,
        totalReject: Math.floor(Math.random() * 4),
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
        p1: Math.floor(Math.random() * 10) + 80,
        p2: Math.random() > 0.4 ? 100 : 92,
        p3: Math.random() > 0.4 ? 100 : 88,
        p4: Math.random() > 0.4 ? 100 : 92,
        avg: 0
      }
    };
  };

  // Generate data untuk semua officer
  const officerDataList = officers.map((officer, index) => generateDummyData(officer, index));

  // Data untuk baris System dan Total
  const systemData = {
    deposit: {
      no: officers.length + 1,
      name: 'System',
      userId: '-',
      dept: 'System',
      status: 'SYSTEM',
      joinDate: '-',
      aspect: 'Deposit Aspect',
      totalApproved: '-',
      totalReject: '-',
    }
  };

  const totalData = {
    deposit: {
      no: officers.length + 2,
      name: 'TOTAL ALL',
      userId: '-',
      dept: 'System + Human',
      status: '-',
      joinDate: '-',
      aspect: 'Deposit Aspect',
      totalApproved: officers.length > 0 ? '822' : '-',
      totalReject: officers.length > 0 ? '11' : '-',
    }
  };

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

      {/* PESAN KALO DATA KOSONG */}
      {officers.length === 0 && (
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-8 mb-8 text-center">
          <p className="text-[#FFD700] text-xl mb-2">Tidak ada data officer</p>
          <p className="text-[#A7D8FF]">Tabel officers kosong atau tidak ada department CS DP WD</p>
        </div>
      )}

      {/* BAGIAN 1: DEPOSIT & WITHDRAWAL KPI */}
      {officers.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
          
          {/* TABLE WRAPPER - SCROLL HORIZONTAL */}
          <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
            <table className="w-full text-xs min-w-[2000px]">
              <thead>
                {/* HEADER ROWS - SAMA KAYA SEBELUMNYA */}
                <tr className="border-b border-[#FFD700]/20">
                  <th colSpan="7" className="text-left py-2 px-2 text-[#FFD700] bg-[#1A2F4A] sticky left-0 z-20"> </th>
                  <th colSpan="4" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Time Management</th>
                  <th colSpan="2" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10"> </th>
                  <th colSpan="7" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Human Error</th>
                  <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Problem Solving</th>
                  <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Follow SOP / Teamwork</th>
                  <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">SUB SCORE DP & WD</th>
                </tr>
                
                <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                  <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
                  <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[120px]">NAME</th>
                  <th className="sticky left-[160px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">ID</th>
                  <th className="sticky left-[260px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                  <th className="sticky left-[360px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[70px]">STATUS</th>
                  <th className="sticky left-[430px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[90px]">JOIN DATE</th>
                  <th className="sticky left-[520px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">ASPECT</th>
                  
                  <th className="text-center py-2 px-2 min-w-[60px]">Total App</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">Total Rej</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">SOP %</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">NON SOP</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">SOP</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">SOP %</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">NON SOP</th>
                  
                  <th className="text-center py-2 px-2 min-w-[70px]">Interval App</th>
                  <th className="text-center py-2 px-2 min-w-[70px]">Interval Rej</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">HE Qty</th>
                  <th className="text-center py-2 px-2 min-w-[70px]">HE Amount</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">Mistake Qty</th>
                  <th className="text-center py-2 px-2 min-w-[80px]">Mistake Amt</th>
                  <th className="text-center py-2 px-2 min-w-[60px]">Block Bank</th>
                  
                  <th className="text-center py-2 px-2 min-w-[80px]">Cross Bank Qty</th>
                  <th className="text-center py-2 px-2 min-w-[90px]">Cross Bank Amt</th>
                  <th className="text-center py-2 px-2 min-w-[80px]">Cross Asset Qty</th>
                  <th className="text-center py-2 px-2 min-w-[90px]">Cross Asset Amt</th>
                  <th className="text-center py-2 px-2 min-w-[70px]">Presentase</th>
                  <th className="text-center py-2 px-2 min-w-[70px]">Poin 2</th>
                  <th className="text-center py-2 px-2 min-w-[70px]">Poin 3</th>
                  
                  <th className="text-center py-2 px-2 min-w-[70px]">Buku Dosa</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">SP1</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">SP2</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">SUS</th>
                  <th className="text-center py-2 px-2 min-w-[70px]">Total Poin 4</th>
                  
                  <th className="text-center py-2 px-2 min-w-[50px]">P1</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">P2</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">P3</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">P4</th>
                  <th className="text-center py-2 px-2 min-w-[50px]">Avg</th>
                </tr>
              </thead>
              <tbody>
                {/* LOOPING DATA OFFICER */}
                {officerDataList.map((officer, idx) => (
                  <tr key={`deposit-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.deposit.no}</td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{officer.deposit.name}</td>
                    <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF] text-[9px]">{officer.deposit.userId}</td>
                    <td className="sticky left-[260px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.deposit.dept}</td>
                    <td className="sticky left-[360px] z-10 bg-[#1A2F4A] py-2 px-2">
                      <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[10px]">
                        {officer.deposit.status}
                      </span>
                    </td>
                    <td className="sticky left-[430px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.deposit.joinDate}</td>
                    <td className="sticky left-[520px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">Deposit</td>
                    
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p1}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p1}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject}</td>
                    
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
                    <td className="text-center py-2 px-2">{officer.deposit.p3}%</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p2}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p3}</td>
                    
                    <td className="text-center py-2 px-2">{officer.deposit.bukuDosa}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sp1}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sp2}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sus}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p4}</td>
                    
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.deposit.p1}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.deposit.p2}</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.deposit.p3}</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.deposit.p4}</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.deposit.avg}</td>
                  </tr>
                ))}

                {/* BARIS SYSTEM */}
                <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                  <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{systemData.deposit.no}</td>
                  <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium text-blue-400">System</td>
                  <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                  <td className="sticky left-[260px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">System</td>
                  <td className="sticky left-[360px] z-10 bg-[#1A2F4A] py-2 px-2">
                    <span className="bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded text-[10px]">SYSTEM</span>
                  </td>
                  <td className="sticky left-[430px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                  <td className="sticky left-[520px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] text-[10px] font-bold">Deposit</td>
                  <td colSpan="31" className="text-center py-2 px-2 text-[#A7D8FF]">-</td>
                </tr>

                {/* BARIS TOTAL ALL */}
                <tr className="border-t-2 border-[#FFD700]/30 font-bold">
                  <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{totalData.deposit.no}</td>
                  <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">TOTAL ALL</td>
                  <td className="sticky left-[160px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                  <td className="sticky left-[260px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                  <td className="sticky left-[360px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                  <td className="sticky left-[430px] z-10 bg-[#1A2F4A] py-2 px-2">-</td>
                  <td className="sticky left-[520px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">Deposit</td>
                  <td colSpan="31" className="text-center py-2 px-2 text-[#FFD700]">
                    {officers.length > 0 ? '822' : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Summary • Data officers diambil dari database {officers.length} officers CS DP WD • Periode {periode} {tahun}</p>
        <p className="mt-1">P1: Time Management | P2: Human Error | P3: Problem Solving | P4: Follow SOP</p>
      </div>
    </div>
  );
}