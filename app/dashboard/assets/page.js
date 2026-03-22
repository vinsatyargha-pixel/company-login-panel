'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Format IDR
const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Format number
const formatNumber = (num) => {
  return new Intl.NumberFormat('id-ID').format(num || 0);
};

export default function AssetsPage() {
  const [summary, setSummary] = useState({
    trx: 0,
    amt: 0,
    new_register: 0,
    new_member_deposit: 0,
    percentage: 0,
    total_deposit: 0,
    total_withdrawal: 0,
    active_member: 0,
    turnover: 0,
    winlose: 0,
    bonus: 0,
    commission: 0,
    cashback: 0,
    adjustment: 0,
    referral: 0
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('yesterday');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    let start;
    let end = today;
    
    switch(dateFilter) {
      case 'yesterday':
        start = yesterday;
        end = yesterday;
        break;
      case 'week':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start = new Date(today);
        start.setDate(today.getDate() - 30);
        break;
      case '3month':
        start = new Date(today);
        start.setMonth(today.getMonth() - 3);
        break;
      case '6month':
        start = new Date(today);
        start.setMonth(today.getMonth() - 6);
        break;
      case 'year':
        start = new Date(today);
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: customStartDate,
            end: customEndDate
          };
        }
        start = yesterday;
        end = yesterday;
        break;
      default:
        start = yesterday;
        end = yesterday;
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const dateRange = getDateRange();
      const startDate = dateRange.start;
      const endDate = dateRange.end;

      // Fetch deposit transactions untuk XLY
      const { data: deposits } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('brand', 'XLY')
        .gte('approved_date', `${startDate} 00:00:00`)
        .lte('approved_date', `${endDate} 23:59:59`)
        .eq('status', 'Approved');

      // Fetch withdrawal transactions untuk XLY
      const { data: withdrawals } = await supabase
        .from('withdrawal_transactions')
        .select('*')
        .eq('brand', 'XLY')
        .gte('approved_date', `${startDate} 00:00:00`)
        .lte('approved_date', `${endDate} 23:59:59`)
        .eq('status', 'Approved');

      // Fetch new members (dari tabel members)
      const { data: newMembers } = await supabase
        .from('members')
        .select('*')
        .eq('brand', 'XLY')
        .gte('created_at', `${startDate} 00:00:00`)
        .lte('created_at', `${endDate} 23:59:59`);

      // Fetch winlose data
      const { data: winlose } = await supabase
        .from('winlose_transactions')
        .select('*')
        .eq('brand', 'XLY')
        .gte('period_start', startDate)
        .lte('period_start', endDate);

      // Hitung metrics
      const totalDeposit = deposits?.reduce((sum, d) => sum + (d.nett_amount || 0), 0) || 0;
      const totalWithdrawal = withdrawals?.reduce((sum, w) => sum + (w.nett_amount || 0), 0) || 0;
      const trx = (deposits?.length || 0) + (withdrawals?.length || 0);
      const amt = totalDeposit + totalWithdrawal;
      
      const turnover = winlose?.reduce((sum, w) => sum + (w.net_turnover || 0), 0) || 0;
      const winloseTotal = winlose?.reduce((sum, w) => sum + (w.member_total || 0), 0) || 0;

      // New member deposit (member baru yang deposit)
      const newMemberIds = new Set(newMembers?.map(m => m.user_name) || []);
      const newMemberDeposit = deposits?.filter(d => newMemberIds.has(d.user_name)) || [];
      const newMemberDepositCount = newMemberDeposit.length;
      const newRegisterCount = newMembers?.length || 0;
      const percentage = newRegisterCount > 0 ? (newMemberDepositCount / newRegisterCount) * 100 : 0;

      // Active members (unique member yang deposit)
      const activeMembers = deposits?.filter(d => d.user_name).map(d => d.user_name) || [];
      const uniqueActiveMembers = [...new Set(activeMembers)];

      setSummary({
        trx: trx,
        amt: amt,
        new_register: newRegisterCount,
        new_member_deposit: newMemberDepositCount,
        percentage: percentage,
        total_deposit: totalDeposit,
        total_withdrawal: totalWithdrawal,
        active_member: uniqueActiveMembers.length,
        turnover: turnover,
        winlose: winloseTotal,
        bonus: 0,
        commission: 0,
        cashback: 0,
        adjustment: 0,
        referral: 0
      });
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDateRange = getDateRange();
  const displayDateRange = dateFilter === 'custom' && customStartDate && customEndDate 
    ? `${customStartDate} to ${customEndDate}`
    : `${currentDateRange.start}${currentDateRange.start !== currentDateRange.end ? ` to ${currentDateRange.end}` : ''}`;

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-[#0B1A33]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-4 text-[#FFD700]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* HEADER */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 mb-4 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-3xl font-bold text-[#FFD700]">ASSET GROUP-X</h1>
        <p className="text-[#A7D8FF] mt-2">Monitoring performa asset Lucky77 (XLY)</p>
        <p className="text-sm text-[#FFD700]/80 mt-1">Period: {displayDateRange}</p>
      </div>

      {/* FILTER */}
      <div className="mb-8 p-4 border border-[#FFD700]/30 rounded-lg bg-[#1A2F4A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-bold text-[#FFD700] mb-2 block">FILTER DATE RANGE:</span>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <button onClick={() => setDateFilter('yesterday')} className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'yesterday' ? 'bg-[#FFD700] text-black' : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}>Kemarin</button>
              <button onClick={() => setDateFilter('week')} className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'week' ? 'bg-[#FFD700] text-black' : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}>7 Hari</button>
              <button onClick={() => setDateFilter('month')} className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'month' ? 'bg-[#FFD700] text-black' : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}>30 Hari</button>
              <button onClick={() => setDateFilter('3month')} className={`px-3 py-1.5 rounded text-sm ${dateFilter === '3month' ? 'bg-[#FFD700] text-black' : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}>3 Bulan</button>
              <button onClick={() => setDateFilter('6month')} className={`px-3 py-1.5 rounded text-sm ${dateFilter === '6month' ? 'bg-[#FFD700] text-black' : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}>6 Bulan</button>
              <button onClick={() => setDateFilter('year')} className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'year' ? 'bg-[#FFD700] text-black' : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}>1 Tahun</button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-3 border-t border-[#FFD700]/20">
              <span className="text-[#A7D8FF] font-medium">Custom Range:</span>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={customStartDate} onChange={(e) => { setCustomStartDate(e.target.value); setDateFilter('custom'); }} className="border border-[#FFD700]/30 rounded px-3 py-1.5 text-white bg-[#0B1A33]" />
                <span className="text-[#A7D8FF]">to</span>
                <input type="date" value={customEndDate} onChange={(e) => { setCustomEndDate(e.target.value); setDateFilter('custom'); }} className="border border-[#FFD700]/30 rounded px-3 py-1.5 text-white bg-[#0B1A33]" />
                <button onClick={() => { const today = new Date().toISOString().split('T')[0]; setCustomStartDate(today); setCustomEndDate(today); setDateFilter('custom'); }} className="px-3 py-1.5 bg-[#0B1A33] text-[#A7D8FF] rounded text-sm hover:bg-[#2A3F5A] border border-[#FFD700]/30">Today</button>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-[#FFD700]">XLY</div>
            <p className="text-sm text-[#A7D8FF]">Lucky77</p>
          </div>
        </div>
      </div>

      {/* TABLE - 1 BARIS SESUAI GAMBAR */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#FFD700]/30 bg-[#0B1A33]">
              <th className="px-4 py-3 text-left text-[#FFD700] font-bold">TRX</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">AMT</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">New Register</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">New Member Deposit</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Persentage</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Total Deposit</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Total Withdrawal</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Active Member</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">TurnOver</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Winlose</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Bonus</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Commission</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Cashback</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Adjustment</th>
              <th className="px-4 py-3 text-right text-[#FFD700] font-bold">Referral</th>
             </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#FFD700]/20 bg-[#1A2F4A]/50">
              <td className="px-4 py-3 text-left text-white font-bold">{formatNumber(summary.trx)}</td>
              <td className="px-4 py-3 text-right text-white">{formatIDR(summary.amt)}</td>
              <td className="px-4 py-3 text-right text-white">{formatNumber(summary.new_register)}</td>
              <td className="px-4 py-3 text-right text-white">{formatNumber(summary.new_member_deposit)}</td>
              <td className="px-4 py-3 text-right text-white">{summary.percentage.toFixed(2)}%</td>
              <td className="px-4 py-3 text-right text-green-400">{formatIDR(summary.total_deposit)}</td>
              <td className="px-4 py-3 text-right text-red-400">{formatIDR(summary.total_withdrawal)}</td>
              <td className="px-4 py-3 text-right text-white">{formatNumber(summary.active_member)}</td>
              <td className="px-4 py-3 text-right text-blue-400">{formatIDR(summary.turnover)}</td>
              <td className={`px-4 py-3 text-right ${summary.winlose <= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatIDR(summary.winlose)}</td>
              <td className="px-4 py-3 text-right text-white">{formatIDR(summary.bonus)}</td>
              <td className="px-4 py-3 text-right text-white">{formatIDR(summary.commission)}</td>
              <td className="px-4 py-3 text-right text-white">{formatIDR(summary.cashback)}</td>
              <td className="px-4 py-3 text-right text-white">{formatIDR(summary.adjustment)}</td>
              <td className="px-4 py-3 text-right text-white">{formatIDR(summary.referral)}</td>
             </tr>
          </tbody>
        </table>
      </div>

      {/* EMPTY STATE */}
      {summary.trx === 0 && (
        <div className="border border-[#FFD700]/30 rounded-lg p-12 text-center bg-[#1A2F4A] mt-6">
          <div className="w-16 h-16 border-2 border-[#FFD700]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="text-xl font-bold text-[#FFD700] mb-2">TIDAK ADA DATA</h3>
          <p className="text-[#A7D8FF]">Tidak ada transaksi dalam periode yang dipilih</p>
        </div>
      )}
    </div>
  );
}