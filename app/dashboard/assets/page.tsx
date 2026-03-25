'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const formatNumber = (num: number) => {
  if (num === 0 || num === null || num === undefined) return '0';
  return num.toLocaleString('id-ID');
};

// ===========================================
// PAGINATION HELPER
// ===========================================
const fetchAllWithPagination = async (queryBuilder: any) => {
  let allData: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await queryBuilder
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;

    if (data && data.length > 0) {
      allData = [...allData, ...data];
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
};

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<any[]>([]);
  const [assetsData, setAssetsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('yesterday');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    if (assets.length > 0) {
      fetchAllAssetsData();
    }
  }, [assets, dateFilter, customStartDate, customEndDate]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('assets').select('*').eq('status', 'active');
    setAssets(data || []);
  };

  const getDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    let start: Date;
    let end: Date = today;
    
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

  // ===========================================
  // FETCH ASSET DATA DENGAN PAGINATION
  // ===========================================
  const fetchAssetData = async (assetCode: string) => {
    const dateRange = getDateRange();
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    // Fetch deposits dengan pagination
    let depositQuery = supabase
      .from('deposit_transactions')
      .select('*')
      .eq('brand', assetCode)
      .gte('approved_date', `${startDate} 00:00:00`)
      .lte('approved_date', `${endDate} 23:59:59`)
      .eq('status', 'Approved');

    const deposits = await fetchAllWithPagination(depositQuery);

    // Fetch withdrawals dengan pagination
    let withdrawalQuery = supabase
      .from('withdrawal_transactions')
      .select('*')
      .eq('brand', assetCode)
      .gte('approved_date', `${startDate} 00:00:00`)
      .lte('approved_date', `${endDate} 23:59:59`)
      .eq('status', 'Approved');

    const withdrawals = await fetchAllWithPagination(withdrawalQuery);

    // Fetch new members dengan pagination
    let memberQuery = supabase
      .from('members')
      .select('*')
      .eq('brand', assetCode)
      .gte('created_at', `${startDate} 00:00:00`)
      .lte('created_at', `${endDate} 23:59:59`);

    const newMembers = await fetchAllWithPagination(memberQuery);

    // Fetch winlose dengan pagination untuk turnover & winlose
    let winloseQuery = supabase
      .from('winlose_transactions')
      .select('net_turnover, member_total')
      .eq('brand', assetCode)
      .gte('period_start', startDate)
      .lte('period_start', endDate);

    const winlose = await fetchAllWithPagination(winloseQuery);

    // Fetch adjustment dengan pagination
    let adjustmentQuery = supabase
      .from('adjustment_transactions')
      .select('amount')
      .eq('brand', assetCode)
      .eq('status', 'Approved')
      .gte('approved_date', `${startDate} 00:00:00`)
      .lte('approved_date', `${endDate} 23:59:59`);

    const adjustments = await fetchAllWithPagination(adjustmentQuery);

    // HITUNG METRICS
    const totalDepositAmount = deposits?.reduce((sum: number, d: any) => sum + (d.nett_amount || 0), 0) || 0;
    const totalDepositCount = deposits?.length || 0;
    
    const totalWithdrawalAmount = withdrawals?.reduce((sum: number, w: any) => sum + (w.nett_amount || 0), 0) || 0;
    const totalWithdrawalCount = withdrawals?.length || 0;

    // TURNOVER dari winlose (net_turnover)
    const turnover = winlose?.reduce((sum: number, w: any) => sum + (w.net_turnover || 0), 0) || 0;
    
    // WINLOSE dari winlose (member_total)
    const winloseTotal = winlose?.reduce((sum: number, w: any) => sum + (w.member_total || 0), 0) || 0;

    // ADJUSTMENT dari adjustment_transactions
    const adjustmentAmount = adjustments?.reduce((sum: number, a: any) => sum + (a.amount || 0), 0) || 0;
    const adjustmentCount = adjustments?.length || 0;

    const newRegisterCount = newMembers?.length || 0;
    
    const newMemberIds = new Set(newMembers?.map((m: any) => m.user_name) || []);
    const newMemberDeposit = deposits?.filter((d: any) => newMemberIds.has(d.user_name)) || [];
    const newMemberDepositCount = newMemberDeposit.length;
    const newMemberDepositAmount = newMemberDeposit.reduce((sum: number, d: any) => sum + (d.nett_amount || 0), 0) || 0;
    
    const percentage = newRegisterCount > 0 ? (newMemberDepositCount / newRegisterCount) * 100 : 0;

    const activeMembers = deposits?.filter((d: any) => d.user_name).map((d: any) => d.user_name) || [];
    const uniqueActiveMembers = [...new Set(activeMembers)];

    return {
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
      adjustment: { count: adjustmentCount, amount: adjustmentAmount },
      referral: { count: 0, amount: 0 }
    };
  };

  const fetchAllAssetsData = async () => {
    try {
      setLoading(true);
      const results = [];
      for (const asset of assets) {
        const data = await fetchAssetData(asset.asset_code);
        results.push({
          asset: asset,
          data: data
        });
      }
      setAssetsData(results);
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
      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-[#FFD700] hover:underline text-sm">
          ← BACK TO DASHBOARD
        </Link>
        <button
          onClick={() => router.push('/dashboard/assets/add')}
          className="bg-[#FFD700] text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#FFD700]/90 transition-all"
        >
          + TAMBAH ASSET
        </button>
      </div>

      {/* FILTER DATE RANGE */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
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

      {/* TABLES PER ASSET */}
      <div className="space-y-8">
        {assetsData.map((item, idx) => {
          const asset = item.asset;
          const data = item.data;
          return (
            <div key={asset.id} className="border border-[#FFD700]/30 rounded-lg overflow-hidden bg-[#1A2F4A]">
              {/* ASSET HEADER */}
              <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                <h3 className="text-[#FFD700] font-bold">
                  {asset.asset_name} (WLB {asset.wlb_code || asset.asset_code})
                </h3>
              </div>

              {/* TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#FFD700]/30 bg-[#0B1A33]/50">
                      <th className="px-4 py-2 text-left text-[#FFD700]">Metric</th>
                      <th className="px-4 py-2 text-right text-[#FFD700]">Count</th>
                      <th className="px-4 py-2 text-right text-[#FFD700]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">New Register</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.new_register.count)}</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">New Member Deposit</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.new_member_deposit.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.new_member_deposit.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Percentage</td>
                      <td className="px-4 py-2 text-right">{data.percentage.toFixed(2)}%</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Total Deposit</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.total_deposit.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.total_deposit.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Total Withdrawal</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.total_withdrawal.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.total_withdrawal.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Active Member</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.active_member)}</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">TurnOver</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.turnover)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Winlose</td>
                      <td className="px-4 py-2 text-right">-</td>
                      <td className={`px-4 py-2 text-right ${data.winlose <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatNumber(data.winlose)}
                      </td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Bonus</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.bonus.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.bonus.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Commission</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.commission.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.commission.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Cashback</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.cashback.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.cashback.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Adjustment</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.adjustment.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.adjustment.amount)}</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">Referral</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.referral.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.referral.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {assetsData.length === 0 && (
        <div className="border border-[#FFD700]/30 rounded-lg p-12 text-center bg-[#1A2F4A]">
          <div className="w-16 h-16 border-2 border-[#FFD700]/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏦</span>
          </div>
          <h3 className="text-xl font-bold text-[#FFD700] mb-2">BELUM ADA ASSET</h3>
          <p className="text-[#A7D8FF] mb-6">Tambahkan asset pertama Anda</p>
          <button
            onClick={() => router.push('/dashboard/assets/add')}
            className="bg-[#FFD700] text-black px-6 py-3 rounded-lg font-bold hover:bg-[#FFD700]/90 transition-all"
          >
            + TAMBAH ASSET PERTAMA
          </button>
        </div>
      )}
    </div>
  );
}