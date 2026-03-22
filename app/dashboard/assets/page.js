'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const formatNumber = (num) => {
  if (num === 0 || num === null || num === undefined) return '0';
  return num.toLocaleString('id-ID');
};

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState('XLY');
  const [data, setData] = useState({
    new_register: { count: 0, amount: 0 },
    new_member_deposit: { count: 0, amount: 0 },
    percentage: 0,
    total_deposit: { count: 0, amount: 0 },
    total_withdrawal: { count: 0, amount: 0 },
    active_member: 0,
    turnover: 0,
    winlose: 0,
    bonus: { count: 0, amount: 0 },
    commission: { count: 0, amount: 0 },
    cashback: { count: 0, amount: 0 },
    adjustment: { count: 0, amount: 0 },
    referral: { count: 0, amount: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('yesterday');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedAsset, dateFilter, customStartDate, customEndDate]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('asset_code, asset_name').eq('status', 'active');
    setAssets(data || []);
  };

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
          return { start: customStartDate, end: customEndDate };
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

      // Fetch deposits
      const { data: deposits } = await supabase
        .from('deposit_transactions')
        .select('*')
        .eq('brand', selectedAsset)
        .gte('approved_date', `${startDate} 00:00:00`)
        .lte('approved_date', `${endDate} 23:59:59`)
        .eq('status', 'Approved');

      // Fetch withdrawals
      const { data: withdrawals } = await supabase
        .from('withdrawal_transactions')
        .select('*')
        .eq('brand', selectedAsset)
        .gte('approved_date', `${startDate} 00:00:00`)
        .lte('approved_date', `${endDate} 23:59:59`)
        .eq('status', 'Approved');

      // Fetch new members
      const { data: newMembers } = await supabase
        .from('members')
        .select('*')
        .eq('brand', selectedAsset)
        .gte('created_at', `${startDate} 00:00:00`)
        .lte('created_at', `${endDate} 23:59:59`);

      // Fetch winlose
      const { data: winlose } = await supabase
        .from('winlose_transactions')
        .select('*')
        .eq('brand', selectedAsset)
        .gte('period_start', startDate)
        .lte('period_start', endDate);

      const totalDepositAmount = deposits?.reduce((sum, d) => sum + (d.nett_amount || 0), 0) || 0;
      const totalDepositCount = deposits?.length || 0;
      
      const totalWithdrawalAmount = withdrawals?.reduce((sum, w) => sum + (w.nett_amount || 0), 0) || 0;
      const totalWithdrawalCount = withdrawals?.length || 0;

      const turnover = winlose?.reduce((sum, w) => sum + (w.net_turnover || 0), 0) || 0;
      const winloseTotal = winlose?.reduce((sum, w) => sum + (w.member_total || 0), 0) || 0;

      const newRegisterCount = newMembers?.length || 0;
      
      const newMemberIds = new Set(newMembers?.map(m => m.user_name) || []);
      const newMemberDeposit = deposits?.filter(d => newMemberIds.has(d.user_name)) || [];
      const newMemberDepositCount = newMemberDeposit.length;
      const newMemberDepositAmount = newMemberDeposit.reduce((sum, d) => sum + (d.nett_amount || 0), 0) || 0;
      
      const percentage = newRegisterCount > 0 ? (newMemberDepositCount / newRegisterCount) * 100 : 0;

      const activeMembers = deposits?.filter(d => d.user_name).map(d => d.user_name) || [];
      const uniqueActiveMembers = [...new Set(activeMembers)];

      setData({
        new_register: { count: newRegisterCount, amount: 0 },
        new_member_deposit: { count: newMemberDepositCount, amount: newMemberDepositAmount },
        percentage: percentage,
        total_deposit: { count: totalDepositCount, amount: totalDepositAmount },
        total_withdrawal: { count: totalWithdrawalCount, amount: -totalWithdrawalAmount },
        active_member: uniqueActiveMembers.length,
        turnover: turnover,
        winlose: winloseTotal,
        bonus: { count: 0, amount: 0 },
        commission: { count: 0, amount: 0 },
        cashback: { count: 0, amount: 0 },
        adjustment: { count: 0, amount: 0 },
        referral: { count: 0, amount: 0 }
      });
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentDateRange = getDateRange();
  const displayDateRange = dateFilter === 'custom' && customStartDate && customEndDate 
    ? `${customStartDate} - ${customEndDate}`
    : `${currentDateRange.start}${currentDateRange.start !== currentDateRange.end ? ` - ${currentDateRange.end}` : ''}`;

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
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-4">
        <Link href="/dashboard" className="text-[#FFD700] hover:underline text-sm">
          ← BACK TO DASHBOARD
        </Link>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select 
          value={selectedAsset} 
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded px-3 py-1.5 text-white text-sm"
        >
          {assets.map(asset => (
            <option key={asset.asset_code} value={asset.asset_code}>
              {asset.asset_name} ({asset.asset_code})
            </option>
          ))}
        </select>

        <select 
          value={dateFilter} 
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded px-3 py-1.5 text-white text-sm"
        >
          <option value="yesterday">Kemarin</option>
          <option value="week">7 Hari</option>
          <option value="month">30 Hari</option>
          <option value="3month">3 Bulan</option>
          <option value="6month">6 Bulan</option>
          <option value="year">1 Tahun</option>
          <option value="custom">Custom</option>
        </select>

        {dateFilter === 'custom' && (
          <>
            <input 
              type="date" 
              value={customStartDate} 
              onChange={(e) => { setCustomStartDate(e.target.value); setDateFilter('custom'); }}
              className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded px-3 py-1.5 text-white text-sm"
            />
            <span className="text-[#A7D8FF] text-sm">-</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={(e) => { setCustomEndDate(e.target.value); setDateFilter('custom'); }}
              className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded px-3 py-1.5 text-white text-sm"
            />
          </>
        )}

        <span className="text-[#A7D8FF] text-xs ml-auto">Period: {displayDateRange}</span>
      </div>

      {/* TABLE - 3 KOLOM: Metric, Count, Amount */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#FFD700]/30 bg-[#1A2F4A]">
              <th className="px-4 py-2 text-left text-[#FFD700]">Metric</th>
              <th className="px-4 py-2 text-right text-[#FFD700]">Count</th>
              <th className="px-4 py-2 text-right text-[#FFD700]">Amount</th>
             </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">New Register</td><td className="px-4 py-2 text-right">{formatNumber(data.new_register.count)}</td><td className="px-4 py-2 text-right"></td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">New Member Deposit</td><td className="px-4 py-2 text-right">{formatNumber(data.new_member_deposit.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.new_member_deposit.amount)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Persentage</td><td className="px-4 py-2 text-right">{data.percentage.toFixed(2)}%</td><td className="px-4 py-2 text-right"></td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Total Deposit</td><td className="px-4 py-2 text-right">{formatNumber(data.total_deposit.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.total_deposit.amount)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Total Withdrawal</td><td className="px-4 py-2 text-right">{formatNumber(data.total_withdrawal.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.total_withdrawal.amount)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Active Member</td><td className="px-4 py-2 text-right">{formatNumber(data.active_member)}</td><td className="px-4 py-2 text-right"></td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">TurnOver</td><td className="px-4 py-2 text-right"></td><td className="px-4 py-2 text-right">{formatNumber(data.turnover)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Winlose</td><td className="px-4 py-2 text-right"></td><td className="px-4 py-2 text-right">{formatNumber(data.winlose)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Bonus</td><td className="px-4 py-2 text-right">{formatNumber(data.bonus.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.bonus.amount)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Commission</td><td className="px-4 py-2 text-right">{formatNumber(data.commission.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.commission.amount)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Cashback</td><td className="px-4 py-2 text-right">{formatNumber(data.cashback.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.cashback.amount)}</td></tr>
            <tr className="border-b border-[#FFD700]/10"><td className="px-4 py-2">Adjustment</td><td className="px-4 py-2 text-right">{formatNumber(data.adjustment.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.adjustment.amount)}</td></tr>
            <tr><td className="px-4 py-2">Referral</td><td className="px-4 py-2 text-right">{formatNumber(data.referral.count)}</td><td className="px-4 py-2 text-right">{formatNumber(data.referral.amount)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}