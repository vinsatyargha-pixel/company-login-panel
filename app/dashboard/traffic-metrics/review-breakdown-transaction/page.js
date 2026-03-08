'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ReviewBreakdownTransactionPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // FILTER STATES
  const [filterType, setFilterType] = useState('hourly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('jan-jun');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // ASSET LIST
  const [assetList, setAssetList] = useState([]);
  
  // DATA
  const [traficData, setTraficData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    // Chat - KOSONGIN DULU
    chatTotal: 0,
    
    // Deposit
    depositApproved: 0,
    depositRejected: 0,
    depositFailed: 0,
    depositApprovedAmount: 0,
    depositRejectedAmount: 0,
    depositFailedAmount: 0,
    
    // Withdrawal
    withdrawalApproved: 0,
    withdrawalRejected: 0,
    withdrawalFailed: 0,
    withdrawalApprovedAmount: 0,
    withdrawalRejectedAmount: 0,
    withdrawalFailedAmount: 0,
    
    // Total
    totalTransactions: 0,
    totalVolume: 0
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2024', '2025', '2026', '2027'];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'failed', label: 'Failed' }
  ];

  // ===========================================
  // FETCH ASSET LIST
  // ===========================================
  useEffect(() => {
    fetchAssetList();
  }, []);

  const fetchAssetList = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('asset_code, asset_name')
        .order('asset_code', { ascending: true });

      if (error) throw error;
      setAssetList(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  // Format IDR
  const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // ===========================================
  // FETCH HOURLY DATA (24 JAM)
  // ===========================================
  const fetchHourlyData = async (date, asset, status) => {
    try {
      const startDate = `${date} 00:00:00`;
      const endDate = `${date} 23:59:59`;
      
      const assetCode = asset === 'all' ? 'XLY' : asset;
      
      // Fetch deposits
      let depositQuery = supabase
        .from('deposit_transactions')
        .select('approved_date, status, deposit_amount, brand')
        .eq('brand', assetCode)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      if (status !== 'all') {
        const dbStatus = status === 'failed' ? 'Fail' : 
                        status.charAt(0).toUpperCase() + status.slice(1);
        depositQuery = depositQuery.eq('status', dbStatus);
      }
      
      const { data: deposits, error: depositError } = await depositQuery;
      if (depositError) throw depositError;
      
      // Fetch withdrawals
      let withdrawalQuery = supabase
        .from('withdrawal_transactions')
        .select('approved_date, status, withdrawal_amount, brand')
        .eq('brand', assetCode)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      if (status !== 'all' && status !== 'failed') {
        const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);
        withdrawalQuery = withdrawalQuery.eq('status', dbStatus);
      } else if (status === 'failed') {
        withdrawalQuery = withdrawalQuery.eq('status', 'NO_RESULT');
      }
      
      const { data: withdrawals, error: withdrawalError } = await withdrawalQuery;
      if (withdrawalError) throw withdrawalError;
      
      return processHourlyData(deposits || [], withdrawals || [], date);
      
    } catch (error) {
      console.error('Error fetching hourly data:', error);
      return [];
    }
  };

  const processHourlyData = (deposits, withdrawals, date) => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const startHour = i.toString().padStart(2, '0');
      const endHour = (i + 1).toString().padStart(2, '0');
      const period = i === 23 ? `${startHour}:00 - 00:00` : `${startHour}:00 - ${endHour}:00`;
      
      return {
        period: period,
        type: 'hour',
        chat: 0, // CHAT KOSONG
        
        depositApproved: 0,
        depositRejected: 0,
        depositFailed: 0,
        depositApprovedAmount: 0,
        depositRejectedAmount: 0,
        depositFailedAmount: 0,
        depositVolume: 0,
        depositHighest: 0,
        depositTotal: 0,
        
        withdrawalApproved: 0,
        withdrawalRejected: 0,
        withdrawalFailed: 0,
        withdrawalApprovedAmount: 0,
        withdrawalRejectedAmount: 0,
        withdrawalFailedAmount: 0,
        withdrawalVolume: 0,
        withdrawalHighest: 0,
        withdrawalTotal: 0,
        
        total: 0,
        totalVolume: 0,
        asset: 'XLY'
      };
    });
    
    // Proses deposits (CHAT TETAP 0)
    deposits.forEach(deposit => {
      const hour = new Date(deposit.approved_date).getHours();
      const hourData = hours[hour];
      
      // hourData.chat++; // COMMENT - CHAT KOSONG
      hourData.depositTotal++;
      hourData.depositVolume += deposit.deposit_amount || 0;
      
      if (deposit.deposit_amount > hourData.depositHighest) {
        hourData.depositHighest = deposit.deposit_amount;
      }
      
      const status = deposit.status?.toLowerCase() || '';
      if (status === 'approved') {
        hourData.depositApproved++;
        hourData.depositApprovedAmount += deposit.deposit_amount || 0;
      } else if (status === 'rejected') {
        hourData.depositRejected++;
        hourData.depositRejectedAmount += deposit.deposit_amount || 0;
      } else if (status === 'fail') {
        hourData.depositFailed++;
        hourData.depositFailedAmount += deposit.deposit_amount || 0;
      }
    });
    
    // Proses withdrawals (CHAT TETAP 0)
    withdrawals.forEach(withdrawal => {
      const hour = new Date(withdrawal.approved_date).getHours();
      const hourData = hours[hour];
      
      // hourData.chat++; // COMMENT - CHAT KOSONG
      hourData.withdrawalTotal++;
      hourData.withdrawalVolume += withdrawal.withdrawal_amount || 0;
      
      if (withdrawal.withdrawal_amount > hourData.withdrawalHighest) {
        hourData.withdrawalHighest = withdrawal.withdrawal_amount;
      }
      
      const status = withdrawal.status?.toLowerCase() || '';
      if (status === 'approved') {
        hourData.withdrawalApproved++;
        hourData.withdrawalApprovedAmount += withdrawal.withdrawal_amount || 0;
      } else if (status === 'rejected') {
        hourData.withdrawalRejected++;
        hourData.withdrawalRejectedAmount += withdrawal.withdrawal_amount || 0;
      }
    });
    
    hours.forEach(hour => {
      hour.total = hour.depositTotal + hour.withdrawalTotal; // TOTAL TANPA CHAT
      hour.totalVolume = hour.depositVolume + hour.withdrawalVolume;
    });
    
    return hours;
  };

  // ===========================================
  // FETCH DAILY DATA (1 BULAN)
  // ===========================================
  const fetchDailyData = async (month, year, asset, status) => {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01 00:00:00`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()} 23:59:59`;
      
      const assetCode = asset === 'all' ? 'XLY' : asset;
      
      // Fetch deposits
      let depositQuery = supabase
        .from('deposit_transactions')
        .select('approved_date, status, deposit_amount, brand')
        .eq('brand', assetCode)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      if (status !== 'all') {
        const dbStatus = status === 'failed' ? 'Fail' : 
                        status.charAt(0).toUpperCase() + status.slice(1);
        depositQuery = depositQuery.eq('status', dbStatus);
      }
      
      const { data: deposits, error: depositError } = await depositQuery;
      if (depositError) throw depositError;
      
      // Fetch withdrawals
      let withdrawalQuery = supabase
        .from('withdrawal_transactions')
        .select('approved_date, status, withdrawal_amount, brand')
        .eq('brand', assetCode)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      if (status !== 'all' && status !== 'failed') {
        const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);
        withdrawalQuery = withdrawalQuery.eq('status', dbStatus);
      } else if (status === 'failed') {
        withdrawalQuery = withdrawalQuery.eq('status', 'NO_RESULT');
      }
      
      const { data: withdrawals, error: withdrawalError } = await withdrawalQuery;
      if (withdrawalError) throw withdrawalError;
      
      return processDailyData(deposits || [], withdrawals || [], month, year);
      
    } catch (error) {
      console.error('Error fetching daily data:', error);
      return [];
    }
  };

  const processDailyData = (deposits, withdrawals, month, year) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = months[month - 1];
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        period: `${monthName} ${day}`,
        type: 'day',
        chat: 0, // CHAT KOSONG
        
        depositApproved: 0,
        depositRejected: 0,
        depositFailed: 0,
        depositApprovedAmount: 0,
        depositRejectedAmount: 0,
        depositFailedAmount: 0,
        depositVolume: 0,
        depositHighest: 0,
        depositTotal: 0,
        
        withdrawalApproved: 0,
        withdrawalRejected: 0,
        withdrawalFailed: 0,
        withdrawalApprovedAmount: 0,
        withdrawalRejectedAmount: 0,
        withdrawalFailedAmount: 0,
        withdrawalVolume: 0,
        withdrawalHighest: 0,
        withdrawalTotal: 0,
        
        total: 0,
        totalVolume: 0,
        asset: 'XLY'
      };
    });
    
    // Proses deposits (CHAT TETAP 0)
    deposits.forEach(deposit => {
      const date = new Date(deposit.approved_date);
      const day = date.getDate() - 1;
      const dayData = days[day];
      
      if (dayData) {
        // dayData.chat++; // COMMENT - CHAT KOSONG
        dayData.depositTotal++;
        dayData.depositVolume += deposit.deposit_amount || 0;
        
        if (deposit.deposit_amount > dayData.depositHighest) {
          dayData.depositHighest = deposit.deposit_amount;
        }
        
        const status = deposit.status?.toLowerCase() || '';
        if (status === 'approved') {
          dayData.depositApproved++;
          dayData.depositApprovedAmount += deposit.deposit_amount || 0;
        } else if (status === 'rejected') {
          dayData.depositRejected++;
          dayData.depositRejectedAmount += deposit.deposit_amount || 0;
        } else if (status === 'fail') {
          dayData.depositFailed++;
          dayData.depositFailedAmount += deposit.deposit_amount || 0;
        }
      }
    });
    
    // Proses withdrawals (CHAT TETAP 0)
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.approved_date);
      const day = date.getDate() - 1;
      const dayData = days[day];
      
      if (dayData) {
        // dayData.chat++; // COMMENT - CHAT KOSONG
        dayData.withdrawalTotal++;
        dayData.withdrawalVolume += withdrawal.withdrawal_amount || 0;
        
        if (withdrawal.withdrawal_amount > dayData.withdrawalHighest) {
          dayData.withdrawalHighest = withdrawal.withdrawal_amount;
        }
        
        const status = withdrawal.status?.toLowerCase() || '';
        if (status === 'approved') {
          dayData.withdrawalApproved++;
          dayData.withdrawalApprovedAmount += withdrawal.withdrawal_amount || 0;
        } else if (status === 'rejected') {
          dayData.withdrawalRejected++;
          dayData.withdrawalRejectedAmount += withdrawal.withdrawal_amount || 0;
        }
      }
    });
    
    days.forEach(day => {
      day.total = day.depositTotal + day.withdrawalTotal; // TOTAL TANPA CHAT
      day.totalVolume = day.depositVolume + day.withdrawalVolume;
    });
    
    return days;
  };

  // ===========================================
  // FETCH MONTHLY DATA (6 BULAN)
  // ===========================================
  const fetchMonthlyData = async (period, year, asset, status) => {
    try {
      const startMonth = period === 'jan-jun' ? 1 : 7;
      const endMonth = period === 'jan-jun' ? 6 : 12;
      
      const startDate = `${year}-${String(startMonth).padStart(2, '0')}-01 00:00:00`;
      const endDate = `${year}-${String(endMonth).padStart(2, '0')}-${new Date(year, endMonth, 0).getDate()} 23:59:59`;
      
      const assetCode = asset === 'all' ? 'XLY' : asset;
      
      // Fetch deposits
      let depositQuery = supabase
        .from('deposit_transactions')
        .select('approved_date, status, deposit_amount, brand')
        .eq('brand', assetCode)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      if (status !== 'all') {
        const dbStatus = status === 'failed' ? 'Fail' : 
                        status.charAt(0).toUpperCase() + status.slice(1);
        depositQuery = depositQuery.eq('status', dbStatus);
      }
      
      const { data: deposits, error: depositError } = await depositQuery;
      if (depositError) throw depositError;
      
      // Fetch withdrawals
      let withdrawalQuery = supabase
        .from('withdrawal_transactions')
        .select('approved_date, status, withdrawal_amount, brand')
        .eq('brand', assetCode)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      if (status !== 'all' && status !== 'failed') {
        const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);
        withdrawalQuery = withdrawalQuery.eq('status', dbStatus);
      } else if (status === 'failed') {
        withdrawalQuery = withdrawalQuery.eq('status', 'NO_RESULT');
      }
      
      const { data: withdrawals, error: withdrawalError } = await withdrawalQuery;
      if (withdrawalError) throw withdrawalError;
      
      return processMonthlyData(deposits || [], withdrawals || [], period, year);
      
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      return [];
    }
  };

  const processMonthlyData = (deposits, withdrawals, period, year) => {
    const startMonth = period === 'jan-jun' ? 0 : 6;
    const endMonth = period === 'jan-jun' ? 6 : 12;
    
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = startMonth + i;
      return {
        period: months[monthIndex],
        type: 'month',
        chat: 0, // CHAT KOSONG
        
        depositApproved: 0,
        depositRejected: 0,
        depositFailed: 0,
        depositApprovedAmount: 0,
        depositRejectedAmount: 0,
        depositFailedAmount: 0,
        depositVolume: 0,
        depositHighest: 0,
        depositTotal: 0,
        
        withdrawalApproved: 0,
        withdrawalRejected: 0,
        withdrawalFailed: 0,
        withdrawalApprovedAmount: 0,
        withdrawalRejectedAmount: 0,
        withdrawalFailedAmount: 0,
        withdrawalVolume: 0,
        withdrawalHighest: 0,
        withdrawalTotal: 0,
        
        total: 0,
        totalVolume: 0,
        asset: 'XLY'
      };
    });
    
    // Proses deposits (CHAT TETAP 0)
    deposits.forEach(deposit => {
      const date = new Date(deposit.approved_date);
      const month = date.getMonth();
      const monthIndex = month - startMonth;
      
      if (monthIndex >= 0 && monthIndex < 6) {
        const monthData = monthlyData[monthIndex];
        
        // monthData.chat++; // COMMENT - CHAT KOSONG
        monthData.depositTotal++;
        monthData.depositVolume += deposit.deposit_amount || 0;
        
        if (deposit.deposit_amount > monthData.depositHighest) {
          monthData.depositHighest = deposit.deposit_amount;
        }
        
        const status = deposit.status?.toLowerCase() || '';
        if (status === 'approved') {
          monthData.depositApproved++;
          monthData.depositApprovedAmount += deposit.deposit_amount || 0;
        } else if (status === 'rejected') {
          monthData.depositRejected++;
          monthData.depositRejectedAmount += deposit.deposit_amount || 0;
        } else if (status === 'fail') {
          monthData.depositFailed++;
          monthData.depositFailedAmount += deposit.deposit_amount || 0;
        }
      }
    });
    
    // Proses withdrawals (CHAT TETAP 0)
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.approved_date);
      const month = date.getMonth();
      const monthIndex = month - startMonth;
      
      if (monthIndex >= 0 && monthIndex < 6) {
        const monthData = monthlyData[monthIndex];
        
        // monthData.chat++; // COMMENT - CHAT KOSONG
        monthData.withdrawalTotal++;
        monthData.withdrawalVolume += withdrawal.withdrawal_amount || 0;
        
        if (withdrawal.withdrawal_amount > monthData.withdrawalHighest) {
          monthData.withdrawalHighest = withdrawal.withdrawal_amount;
        }
        
        const status = withdrawal.status?.toLowerCase() || '';
        if (status === 'approved') {
          monthData.withdrawalApproved++;
          monthData.withdrawalApprovedAmount += withdrawal.withdrawal_amount || 0;
        } else if (status === 'rejected') {
          monthData.withdrawalRejected++;
          monthData.withdrawalRejectedAmount += withdrawal.withdrawal_amount || 0;
        }
      }
    });
    
    monthlyData.forEach(month => {
      month.total = month.depositTotal + month.withdrawalTotal; // TOTAL TANPA CHAT
      month.totalVolume = month.depositVolume + month.withdrawalVolume;
    });
    
    return monthlyData;
  };

  // ===========================================
  // FETCH DATA
  // ===========================================
  useEffect(() => {
    fetchData();
  }, [filterType, selectedDate, selectedMonth, selectedYear, selectedPeriod, selectedAsset, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let data = [];
      
      switch (filterType) {
        case 'hourly':
          data = await fetchHourlyData(selectedDate, selectedAsset, selectedStatus);
          break;
        case 'daily':
          data = await fetchDailyData(selectedMonth, selectedYear, selectedAsset, selectedStatus);
          break;
        case 'monthly':
          data = await fetchMonthlyData(selectedPeriod, selectedYear, selectedAsset, selectedStatus);
          break;
      }
      
      setTraficData(data);
      
      // Hitung summary - CHAT TETAP 0
      const chatTotal = 0; // CHAT KOSONG
      
      const depositApproved = data.reduce((sum, item) => sum + item.depositApproved, 0);
      const depositRejected = data.reduce((sum, item) => sum + item.depositRejected, 0);
      const depositFailed = data.reduce((sum, item) => sum + item.depositFailed, 0);
      
      const depositApprovedAmount = data.reduce((sum, item) => sum + item.depositApprovedAmount, 0);
      const depositRejectedAmount = data.reduce((sum, item) => sum + item.depositRejectedAmount, 0);
      const depositFailedAmount = data.reduce((sum, item) => sum + item.depositFailedAmount, 0);
      
      const withdrawalApproved = data.reduce((sum, item) => sum + item.withdrawalApproved, 0);
      const withdrawalRejected = data.reduce((sum, item) => sum + item.withdrawalRejected, 0);
      const withdrawalFailed = data.reduce((sum, item) => sum + item.withdrawalFailed, 0);
      
      const withdrawalApprovedAmount = data.reduce((sum, item) => sum + item.withdrawalApprovedAmount, 0);
      const withdrawalRejectedAmount = data.reduce((sum, item) => sum + item.withdrawalRejectedAmount, 0);
      const withdrawalFailedAmount = data.reduce((sum, item) => sum + item.withdrawalFailedAmount, 0);
      
      const totalTrans = data.reduce((sum, item) => sum + item.total, 0);
      const totalVol = data.reduce((sum, item) => sum + item.totalVolume, 0);
      
      setSummaryData({
        chatTotal, // 0
        
        depositApproved,
        depositRejected,
        depositFailed,
        depositApprovedAmount,
        depositRejectedAmount,
        depositFailedAmount,
        
        withdrawalApproved,
        withdrawalRejected,
        withdrawalFailed,
        withdrawalApprovedAmount,
        withdrawalRejectedAmount,
        withdrawalFailedAmount,
        
        totalTransactions: totalTrans,
        totalVolume: totalVol
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getMaxDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const getDisplayTitle = () => {
    const assetName = selectedAsset === 'all' ? 'All Assets' : selectedAsset;
    const statusName = statusOptions.find(s => s.value === selectedStatus)?.label || 'All Status';
    
    switch (filterType) {
      case 'hourly':
        const date = new Date(selectedDate);
        return `Hourly Traffic - ${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${assetName} | ${statusName}`;
      case 'daily':
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        return `Daily Traffic - ${fullMonths[selectedMonth - 1]} ${selectedYear} (${daysInMonth} days) | ${assetName} | ${statusName}`;
      case 'monthly':
        const periodLabel = selectedPeriod === 'jan-jun' ? 'January - June' : 'July - December';
        return `Monthly Traffic - ${periodLabel} ${selectedYear} (6 months) | ${assetName} | ${statusName}`;
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  // Hitung nilai tertinggi - PASTIKAN CHAT TIDAK TERHITUNG
  const maxChat = 0; // CHAT KOSONG
  const maxDeposit = Math.max(...traficData.map(item => item.depositTotal), 0);
  const maxDepositVolume = Math.max(...traficData.map(item => item.depositVolume), 0);
  const maxDepositHighest = Math.max(...traficData.map(item => item.depositHighest), 0);
  const maxWithdrawal = Math.max(...traficData.map(item => item.withdrawalTotal), 0);
  const maxWithdrawalVolume = Math.max(...traficData.map(item => item.withdrawalVolume), 0);
  const maxWithdrawalHighest = Math.max(...traficData.map(item => item.withdrawalHighest), 0);

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/traffic-metrics" 
            className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Asset Performance</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#FFD700]">📊 REVIEW BREAKDOWN TRANSACTION</h1>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="mb-6 bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="hourly">⏱️ Hourly (24 Jam)</option>
            <option value="daily">📅 Daily (1 Bulan)</option>
            <option value="monthly">📊 Monthly (6 Bulan)</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-[#A7D8FF] text-sm">Asset:</span>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value="all">All Assets</option>
              {assetList.map(asset => (
                <option key={asset.asset_code} value={asset.asset_code}>
                  {asset.asset_code} - {asset.asset_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#A7D8FF] text-sm">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {filterType === 'hourly' && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getMaxDate()}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
              />
              <span className="text-xs text-[#A7D8FF]">(max: yesterday)</span>
            </div>
          )}

          {filterType === 'daily' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {fullMonths.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filterType === 'monthly' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Period:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="jan-jun">January - June</option>
                  <option value="jul-dec">July - December</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 ml-auto"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* RESUME TOTAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* CS CHAT CARD - TETAP 0 */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm font-semibold mb-2">💬 CS CHAT</div>
          <div className="text-3xl font-bold text-yellow-400">0</div>
          <div className="text-xs text-[#A7D8FF] mt-1">Total Chat Transactions</div>
        </div>

        {/* DEPOSIT CARD */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm font-semibold mb-2">💰 DEPOSIT</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-sm">✓ Approved</span>
              <div className="text-right">
                <span className="text-white font-bold">{Math.round(summaryData.depositApproved).toLocaleString()} forms</span>
                <span className="text-green-400 ml-2">{formatIDR(summaryData.depositApprovedAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400 text-sm">✗ Rejected</span>
              <div className="text-right">
                <span className="text-white font-bold">{Math.round(summaryData.depositRejected).toLocaleString()} forms</span>
                <span className="text-red-400 ml-2">{formatIDR(summaryData.depositRejectedAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-400 text-sm">! Failed</span>
              <div className="text-right">
                <span className="text-white font-bold">{Math.round(summaryData.depositFailed).toLocaleString()} forms</span>
                <span className="text-blue-400 ml-2">{formatIDR(summaryData.depositFailedAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WITHDRAWAL CARD */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm font-semibold mb-2">💸 WITHDRAWAL</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-green-400 text-sm">✓ Approved</span>
              <div className="text-right">
                <span className="text-white font-bold">{Math.round(summaryData.withdrawalApproved).toLocaleString()} forms</span>
                <span className="text-green-400 ml-2">{formatIDR(summaryData.withdrawalApprovedAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-400 text-sm">✗ Rejected</span>
              <div className="text-right">
                <span className="text-white font-bold">{Math.round(summaryData.withdrawalRejected).toLocaleString()} forms</span>
                <span className="text-red-400 ml-2">{formatIDR(summaryData.withdrawalRejectedAmount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-400 text-sm">! Failed</span>
              <div className="text-right">
                <span className="text-white font-bold">{Math.round(summaryData.withdrawalFailed).toLocaleString()} forms</span>
                <span className="text-blue-400 ml-2">{formatIDR(summaryData.withdrawalFailedAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INFO ROW */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-xs">Total Volume</div>
          <div className="text-xl font-bold text-green-400">{formatIDR(summaryData.totalVolume)}</div>
        </div>
        <div className="bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-xs">Data Points</div>
          <div className="text-lg font-bold text-purple-400">{traficData.length} entries</div>
          <div className="text-xs text-[#A7D8FF]">{getDisplayTitle()}</div>
        </div>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30 bg-gradient-to-r from-[#FFD700]/10 to-transparent">
          <h2 className="text-xl font-bold text-[#FFD700]">📋 TRAFFIC BREAKDOWN TABLE</h2>
          <p className="text-xs text-[#A7D8FF] mt-1">{getDisplayTitle()}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700] border-r border-[#FFD700]/20">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th colSpan="2" className="px-4 py-3 text-center text-[#FFD700] border-r border-[#FFD700]/20">CHAT</th>
                <th colSpan="4" className="px-4 py-3 text-center text-[#FFD700] border-r border-[#FFD700]/20">DEPOSIT</th>
                <th colSpan="4" className="px-4 py-3 text-center text-[#FFD700]">WITHDRAWAL</th>
              </tr>
              <tr className="border-b border-[#FFD700]/20">
                <th className="px-4 py-2 text-left text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20"></th>
                
                {/* CHAT SUBHEADERS - TETAP 0 */}
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Trans</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">%</th>
                
                {/* DEPOSIT SUBHEADERS */}
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Trans</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Volume</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Highest</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">%</th>
                
                {/* WITHDRAWAL SUBHEADERS */}
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Trans</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Volume</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal border-r border-[#FFD700]/20">Highest</th>
                <th className="px-4 py-2 text-right text-[#A7D8FF] text-xs font-normal">%</th>
              </tr>
            </thead>
            <tbody>
              {traficData.map((item, idx) => {
                const totalChat = 0; // CHAT KOSONG
                const totalDeposit = traficData.reduce((sum, i) => sum + i.depositTotal, 0);
                const totalWithdrawal = traficData.reduce((sum, i) => sum + i.withdrawalTotal, 0);
                
                const chatPercentage = 0; // CHAT KOSONG
                const depositPercentage = totalDeposit > 0 ? (item.depositTotal / totalDeposit) * 100 : 0;
                const withdrawalPercentage = totalWithdrawal > 0 ? (item.withdrawalTotal / totalWithdrawal) * 100 : 0;
                
                const isMaxChat = false; // CHAT KOSONG
                const isMaxDeposit = item.depositTotal === maxDeposit && maxDeposit > 0;
                const isMaxDepositVolume = item.depositVolume === maxDepositVolume && maxDepositVolume > 0;
                const isMaxDepositHighest = item.depositHighest === maxDepositHighest && maxDepositHighest > 0;
                const isMaxWithdrawal = item.withdrawalTotal === maxWithdrawal && maxWithdrawal > 0;
                const isMaxWithdrawalVolume = item.withdrawalVolume === maxWithdrawalVolume && maxWithdrawalVolume > 0;
                const isMaxWithdrawalHighest = item.withdrawalHighest === maxWithdrawalHighest && maxWithdrawalHighest > 0;
                
                return (
                  <tr key={idx} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium border-r border-[#FFD700]/10">{item.period}</td>
                    
                    {/* CHAT DATA - KOSONG */}
                    <td className="px-4 py-3 text-right border-r border-[#FFD700]/10 text-yellow-400">0</td>
                    <td className="px-4 py-3 text-right text-[#A7D8FF] border-r border-[#FFD700]/10">0%</td>
                    
                    {/* DEPOSIT DATA */}
                    <td className={`px-4 py-3 text-right border-r border-[#FFD700]/10 ${isMaxDeposit ? 'bg-yellow-300 text-black font-bold' : 'text-blue-400'}`}>
                      {Math.round(item.depositTotal)}
                    </td>
                    <td className={`px-4 py-3 text-right border-r border-[#FFD700]/10 ${isMaxDepositVolume ? 'bg-yellow-300 text-black font-bold' : 'text-blue-400'}`}>
                      {formatIDR(item.depositVolume)}
                    </td>
                    <td className={`px-4 py-3 text-right border-r border-[#FFD700]/10 ${isMaxDepositHighest ? 'bg-yellow-300 text-black font-bold' : 'text-blue-400'}`}>
                      {formatIDR(item.depositHighest)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#A7D8FF] border-r border-[#FFD700]/10">{depositPercentage.toFixed(2)}%</td>
                    
                    {/* WITHDRAWAL DATA */}
                    <td className={`px-4 py-3 text-right border-r border-[#FFD700]/10 ${isMaxWithdrawal ? 'bg-yellow-300 text-black font-bold' : 'text-red-400'}`}>
                      {Math.round(item.withdrawalTotal)}
                    </td>
                    <td className={`px-4 py-3 text-right border-r border-[#FFD700]/10 ${isMaxWithdrawalVolume ? 'bg-yellow-300 text-black font-bold' : 'text-red-400'}`}>
                      {formatIDR(item.withdrawalVolume)}
                    </td>
                    <td className={`px-4 py-3 text-right border-r border-[#FFD700]/10 ${isMaxWithdrawalHighest ? 'bg-yellow-300 text-black font-bold' : 'text-red-400'}`}>
                      {formatIDR(item.withdrawalHighest)}
                    </td>
                    <td className="px-4 py-3 text-right text-[#A7D8FF]">{withdrawalPercentage.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}