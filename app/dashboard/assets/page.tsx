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

// ===========================================
// CLEAN ACCOUNT ID
// ===========================================
const cleanAccountId = (fullId: string): string => {
  if (!fullId) return '';
  if (fullId.toUpperCase().startsWith('XLY')) {
    return fullId.substring(3);
  }
  return fullId;
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
  // FETCH NEW REGIST (DARI PLAYER_LISTING)
  // ===========================================
  const fetchNewRegist = async (assetCode: string, startDate: string, endDate: string) => {
    let query = supabase
      .from('player_listing')
      .select('username')
      .eq('website', assetCode)
      .gte('registration_date', `${startDate} 00:00:00`)
      .lte('registration_date', `${endDate} 23:59:59`);

    const registrations = await fetchAllWithPagination(query);
    
    const uniqueUsers = new Set<string>();
    registrations?.forEach((p: any) => {
      if (p.username) uniqueUsers.add(p.username.toLowerCase());
    });
    
    return uniqueUsers.size;
  };

  // ===========================================
// FETCH FIRST DEPOSIT (DEBUG VERSION)
// ===========================================
const fetchFirstDepositData = async (assetCode: string, startDate: string, endDate: string) => {
  console.log(`\n🔍 DEBUG: Fetching first deposit for ${assetCode}`);
  console.log(`   Filter period: ${startDate} to ${endDate}`);
  
  // 1. Ambil SEMUA deposit seumur hidup
  let allDepositsQuery = supabase
    .from('deposit_transactions')
    .select('user_name, nett_amount, approved_date')
    .eq('brand', assetCode)
    .eq('status', 'Approved')
    .order('approved_date', { ascending: true });

  const allDeposits = await fetchAllWithPagination(allDepositsQuery);
  
  console.log(`   - All deposits (lifetime): ${allDeposits.length}`);
  
  // DEBUG: Tampilkan 10 deposit pertama
  console.log(`   - Sample first 10 deposits:`);
  allDeposits.slice(0, 10).forEach((d: any, i: number) => {
    console.log(`     ${i+1}. ${d.user_name} - ${d.approved_date} - ${d.nett_amount}`);
  });
  
  if (allDeposits.length === 0) {
    return { count: 0, amount: 0 };
  }
  
  // 2. Group by user_name, ambil deposit pertama (paling awal)
  const userFirstDepositMap = new Map<string, { amount: number; date: string }>();
  
  for (const deposit of allDeposits) {
    const userName = deposit.user_name;
    if (!userName) continue;
    
    if (!userFirstDepositMap.has(userName)) {
      userFirstDepositMap.set(userName, {
        amount: deposit.nett_amount || 0,
        date: deposit.approved_date
      });
    }
  }
  
  console.log(`   - Unique users with first deposit: ${userFirstDepositMap.size}`);
  
  // DEBUG: Cek user yang kita tahu first deposit di 25 Maret
  const testUsers = ['3idmubarak', 'Achmad05', 'acuy85', 'Adele99', 'adlihasan88'];
  console.log(`   - DEBUG: Cek test users:`);
  for (const user of testUsers) {
    const firstDep = userFirstDepositMap.get(user);
    if (firstDep) {
      console.log(`     ${user}: first deposit = ${firstDep.date} (amount: ${firstDep.amount})`);
    } else {
      console.log(`     ${user}: NOT FOUND in first deposit map!`);
    }
  }
  
  // 3. Filter: hanya yang deposit pertama terjadi dalam rentang filter
  const startDateTime = `${startDate} 00:00:00`;
  const endDateTime = `${endDate} 23:59:59`;
  
  let totalAmount = 0;
  let count = 0;
  const firstDepositsInFilter: any[] = [];
  
  for (const [userName, firstDep] of userFirstDepositMap) {
    if (firstDep.date >= startDateTime && firstDep.date <= endDateTime) {
      count++;
      totalAmount += firstDep.amount;
      firstDepositsInFilter.push({ user_name: userName, amount: firstDep.amount, date: firstDep.date });
    }
  }
  
  console.log(`   - First deposits in filter period: ${count}`);
  console.log(`   - Sample first deposits in filter:`);
  firstDepositsInFilter.slice(0, 10).forEach((fd: any, i: number) => {
    console.log(`     ${i+1}. ${fd.user_name} - ${fd.date} - ${fd.amount}`);
  });
  
  return { count, amount: totalAmount };
};

  // ===========================================
  // FETCH TOTAL DEPOSIT
  // ===========================================
  const fetchTotalDeposit = async (assetCode: string, startDate: string, endDate: string) => {
    let query = supabase
      .from('deposit_transactions')
      .select('nett_amount')
      .eq('brand', assetCode)
      .gte('approved_date', `${startDate} 00:00:00`)
      .lte('approved_date', `${endDate} 23:59:59`)
      .eq('status', 'Approved');

    const deposits = await fetchAllWithPagination(query);
    
    const totalAmount = deposits.reduce((sum: number, d: any) => sum + (d.nett_amount || 0), 0);
    const totalCount = deposits.length;
    
    return { count: totalCount, amount: totalAmount };
  };

  // ===========================================
  // FETCH TOTAL WITHDRAWAL
  // ===========================================
  const fetchTotalWithdrawal = async (assetCode: string, startDate: string, endDate: string) => {
    let query = supabase
      .from('withdrawal_transactions')
      .select('nett_amount')
      .eq('brand', assetCode)
      .gte('approved_date', `${startDate} 00:00:00`)
      .lte('approved_date', `${endDate} 23:59:59`)
      .eq('status', 'Approved');

    const withdrawals = await fetchAllWithPagination(query);
    
    const totalAmount = withdrawals.reduce((sum: number, w: any) => sum + (w.nett_amount || 0), 0);
    const totalCount = withdrawals.length;
    
    return { count: totalCount, amount: -totalAmount };
  };

  // ===========================================
  // FETCH ACTIVE MEMBER & WINLOSE
  // ===========================================
  const fetchWinloseData = async (assetCode: string, startDate: string, endDate: string) => {
    let query = supabase
      .from('winlose_transactions')
      .select('net_turnover, member_total, account_id')
      .eq('website', assetCode)
      .gte('period_start', startDate)
      .lte('period_start', endDate);

    const winlose = await fetchAllWithPagination(query);
    
    const turnover = winlose.reduce((sum: number, w: any) => sum + (w.net_turnover || 0), 0);
    const winloseTotal = winlose.reduce((sum: number, w: any) => sum + (w.member_total || 0), 0);
    
    const activeMembersSet = new Set<string>();
    winlose?.forEach((w: any) => {
      let accountId = w.account_id;
      if (accountId) {
        const cleanId = cleanAccountId(accountId);
        if (cleanId) {
          activeMembersSet.add(cleanId.toLowerCase());
        }
      }
    });
    
    return {
      active_member: activeMembersSet.size,
      turnover: turnover,
      winlose: winloseTotal
    };
  };

  // ===========================================
  // FETCH ADJUSTMENT
  // ===========================================
  const fetchAdjustment = async (assetCode: string, startDate: string, endDate: string) => {
    let query = supabase
      .from('adjustment_transactions')
      .select('adjustment_amount')
      .eq('brand', assetCode)
      .eq('status', 'Approved')
      .gte('adjustment_date', `${startDate} 00:00:00`)
      .lte('adjustment_date', `${endDate} 23:59:59`);

    const adjustments = await fetchAllWithPagination(query);
    
    const totalAmount = adjustments.reduce((sum: number, a: any) => sum + (a.adjustment_amount || 0), 0);
    const totalCount = adjustments.length;
    
    return { count: totalCount, amount: totalAmount };
  };

  // ===========================================
  // FETCH ALL ASSET DATA
  // ===========================================
  const fetchAssetData = async (assetCode: string) => {
    const dateRange = getDateRange();
    const startDate = dateRange.start;
    const endDate = dateRange.end;

    console.log(`\n📊 Processing ${assetCode} - ${startDate} to ${endDate}`);

    const [
      newRegist,
      firstDeposit,
      totalDeposit,
      totalWithdrawal,
      winloseData,
      adjustment
    ] = await Promise.all([
      fetchNewRegist(assetCode, startDate, endDate),
      fetchFirstDepositData(assetCode, startDate, endDate),
      fetchTotalDeposit(assetCode, startDate, endDate),
      fetchTotalWithdrawal(assetCode, startDate, endDate),
      fetchWinloseData(assetCode, startDate, endDate),
      fetchAdjustment(assetCode, startDate, endDate)
    ]);

    console.log(`📊 Asset ${assetCode} Summary:`);
    console.log(`   - New Regist: ${newRegist}`);
    console.log(`   - First Deposit: ${firstDeposit.count} (${firstDeposit.amount})`);
    console.log(`   - Total Deposit: ${totalDeposit.count} (${totalDeposit.amount})`);
    console.log(`   - Active Member: ${winloseData.active_member}`);

    return {
      new_regist: newRegist,
      first_deposit: firstDeposit,
      total_deposit: totalDeposit,
      total_withdrawal: totalWithdrawal,
      active_member: winloseData.active_member,
      turnover: winloseData.turnover,
      winlose: winloseData.winlose,
      adjustment: adjustment
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
        {assetsData.map((item) => {
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
                      <td className="px-4 py-2">New Regist</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.new_regist)}</td>
                      <td className="px-4 py-2 text-right">-</td>
                    </tr>
                    <tr className="border-b border-[#FFD700]/10">
                      <td className="px-4 py-2">First Deposit</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.first_deposit.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.first_deposit.amount)}</td>
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
                      <td className="px-4 py-2">Adjustment</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.adjustment.count)}</td>
                      <td className="px-4 py-2 text-right">{formatNumber(data.adjustment.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {assetsData.length === 0 && assets.length === 0 && (
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