'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AssetPerformancePage() {
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
  const [selectedChartType, setSelectedChartType] = useState('line');
  
  // ASSET LIST FROM SUPABASE
  const [assetList, setAssetList] = useState([]);
  
  // DATA STATES
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    avgValue: 0,
    peakHour: '-',
    peakValue: 0,
    chatTotal: 0,
    depositTotal: 0,
    withdrawalTotal: 0,
    approvedTotal: 0,
    rejectedTotal: 0,
    failedTotal: 0
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2024', '2025', '2026', '2027'];

  const statusOptions = [
    { value: 'all', label: 'All Status', color: '#FFD700' },
    { value: 'approved', label: 'Approved', color: '#10b981' },
    { value: 'rejected', label: 'Rejected', color: '#ef4444' },
    { value: 'failed', label: 'Failed', color: '#3b82f6' }
  ];

  // ===========================================
  // FETCH ASSET LIST FROM SUPABASE
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
  // FETCH HOURLY DATA (24 JAM) - REAL DATA
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
        label: period,
        hour: i,
        chat: 0, // CHAT KOSONG
        
        deposit: 0,
        withdrawal: 0,
        chatVolume: 0,
        depositVolume: 0,
        withdrawalVolume: 0,
        
        depositApproved: 0,
        depositRejected: 0,
        depositFailed: 0,
        withdrawalApproved: 0,
        withdrawalRejected: 0,
        withdrawalFailed: 0,
        
        transactions: 0,
        volume: 0,
        displayDate: new Date(date).toLocaleDateString('id-ID'),
        asset: 'XLY'
      };
    });
    
    // Proses deposits
    deposits.forEach(deposit => {
      const hour = new Date(deposit.approved_date).getHours();
      const hourData = hours[hour];
      
      hourData.deposit++;
      hourData.depositVolume += deposit.deposit_amount || 0;
      
      const status = deposit.status?.toLowerCase() || '';
      if (status === 'approved') {
        hourData.depositApproved++;
      } else if (status === 'rejected') {
        hourData.depositRejected++;
      } else if (status === 'fail') {
        hourData.depositFailed++;
      }
    });
    
    // Proses withdrawals
    withdrawals.forEach(withdrawal => {
      const hour = new Date(withdrawal.approved_date).getHours();
      const hourData = hours[hour];
      
      hourData.withdrawal++;
      hourData.withdrawalVolume += withdrawal.withdrawal_amount || 0;
      
      const status = withdrawal.status?.toLowerCase() || '';
      if (status === 'approved') {
        hourData.withdrawalApproved++;
      } else if (status === 'rejected') {
        hourData.withdrawalRejected++;
      }
    });
    
    hours.forEach(hour => {
      hour.transactions = hour.deposit + hour.withdrawal;
      hour.volume = hour.depositVolume + hour.withdrawalVolume;
    });
    
    return hours;
  };

  // ===========================================
  // FETCH DAILY DATA (1 BULAN) - REAL DATA
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
      const date = new Date(year, month - 1, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      return {
        label: `${monthName} ${day}`,
        day: day,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: isWeekend,
        chat: 0, // CHAT KOSONG
        
        deposit: 0,
        withdrawal: 0,
        chatVolume: 0,
        depositVolume: 0,
        withdrawalVolume: 0,
        
        depositApproved: 0,
        depositRejected: 0,
        depositFailed: 0,
        withdrawalApproved: 0,
        withdrawalRejected: 0,
        withdrawalFailed: 0,
        
        transactions: 0,
        volume: 0,
        fullDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        asset: 'XLY'
      };
    });
    
    // Proses deposits
    deposits.forEach(deposit => {
      const date = new Date(deposit.approved_date);
      const day = date.getDate() - 1;
      const dayData = days[day];
      
      if (dayData) {
        dayData.deposit++;
        dayData.depositVolume += deposit.deposit_amount || 0;
        
        const status = deposit.status?.toLowerCase() || '';
        if (status === 'approved') {
          dayData.depositApproved++;
        } else if (status === 'rejected') {
          dayData.depositRejected++;
        } else if (status === 'fail') {
          dayData.depositFailed++;
        }
      }
    });
    
    // Proses withdrawals
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.approved_date);
      const day = date.getDate() - 1;
      const dayData = days[day];
      
      if (dayData) {
        dayData.withdrawal++;
        dayData.withdrawalVolume += withdrawal.withdrawal_amount || 0;
        
        const status = withdrawal.status?.toLowerCase() || '';
        if (status === 'approved') {
          dayData.withdrawalApproved++;
        } else if (status === 'rejected') {
          dayData.withdrawalRejected++;
        }
      }
    });
    
    days.forEach(day => {
      day.transactions = day.deposit + day.withdrawal;
      day.volume = day.depositVolume + day.withdrawalVolume;
    });
    
    return days;
  };

  // ===========================================
  // FETCH MONTHLY DATA (6 BULAN) - REAL DATA
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
        label: months[monthIndex],
        month: months[monthIndex],
        monthNum: monthIndex + 1,
        chat: 0, // CHAT KOSONG
        
        deposit: 0,
        withdrawal: 0,
        chatVolume: 0,
        depositVolume: 0,
        withdrawalVolume: 0,
        
        depositApproved: 0,
        depositRejected: 0,
        depositFailed: 0,
        withdrawalApproved: 0,
        withdrawalRejected: 0,
        withdrawalFailed: 0,
        
        transactions: 0,
        volume: 0,
        period: period,
        year: year,
        asset: 'XLY'
      };
    });
    
    // Proses deposits
    deposits.forEach(deposit => {
      const date = new Date(deposit.approved_date);
      const month = date.getMonth();
      const monthIndex = month - startMonth;
      
      if (monthIndex >= 0 && monthIndex < 6) {
        const monthData = monthlyData[monthIndex];
        
        monthData.deposit++;
        monthData.depositVolume += deposit.deposit_amount || 0;
        
        const status = deposit.status?.toLowerCase() || '';
        if (status === 'approved') {
          monthData.depositApproved++;
        } else if (status === 'rejected') {
          monthData.depositRejected++;
        } else if (status === 'fail') {
          monthData.depositFailed++;
        }
      }
    });
    
    // Proses withdrawals
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.approved_date);
      const month = date.getMonth();
      const monthIndex = month - startMonth;
      
      if (monthIndex >= 0 && monthIndex < 6) {
        const monthData = monthlyData[monthIndex];
        
        monthData.withdrawal++;
        monthData.withdrawalVolume += withdrawal.withdrawal_amount || 0;
        
        const status = withdrawal.status?.toLowerCase() || '';
        if (status === 'approved') {
          monthData.withdrawalApproved++;
        } else if (status === 'rejected') {
          monthData.withdrawalRejected++;
        }
      }
    });
    
    monthlyData.forEach(month => {
      month.transactions = month.deposit + month.withdrawal;
      month.volume = month.depositVolume + month.withdrawalVolume;
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
        default:
          data = await fetchHourlyData(selectedDate, selectedAsset, selectedStatus);
      }
      
      setPerformanceData(data);
      
      // Hitung summary
      const totalTrans = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVol = data.reduce((sum, item) => sum + item.volume, 0);
      const avgVal = totalTrans > 0 ? totalVol / totalTrans : 0;
      const chatTotal = 0; // CHAT KOSONG
      const depositTotal = data.reduce((sum, item) => sum + item.deposit, 0);
      const withdrawalTotal = data.reduce((sum, item) => sum + item.withdrawal, 0);
      
      const approvedTotal = data.reduce((sum, item) => 
        sum + (item.depositApproved || 0) + (item.withdrawalApproved || 0), 0);
      const rejectedTotal = data.reduce((sum, item) => 
        sum + (item.depositRejected || 0) + (item.withdrawalRejected || 0), 0);
      const failedTotal = data.reduce((sum, item) => 
        sum + (item.depositFailed || 0) + (item.withdrawalFailed || 0), 0);
      
      let peakItem = null;
      let peakValue = 0;
      data.forEach(item => {
        if (item.transactions > peakValue) {
          peakValue = item.transactions;
          peakItem = item;
        }
      });
      
      setSummaryData({
        totalTransactions: totalTrans,
        totalVolume: totalVol,
        avgValue: avgVal,
        peakHour: peakItem?.label || '-',
        peakValue: peakValue,
        chatTotal: chatTotal,
        depositTotal: depositTotal,
        withdrawalTotal: withdrawalTotal,
        approvedTotal: approvedTotal,
        rejectedTotal: rejectedTotal,
        failedTotal: failedTotal
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

  const getDisplayTitle = (type = 'transaction') => {
    const assetName = selectedAsset === 'all' ? 'All Assets' : selectedAsset;
    const statusName = statusOptions.find(s => s.value === selectedStatus)?.label || 'All Status';
    const typeText = type === 'transaction' ? 'By Transaction' : 'By Value (IDR)';
    
    switch (filterType) {
      case 'hourly':
        const date = new Date(selectedDate);
        return `Hourly Performance (${typeText}) - ${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${assetName} | ${statusName}`;
      case 'daily':
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        return `Daily Performance (${typeText}) - ${fullMonths[selectedMonth - 1]} ${selectedYear} (${daysInMonth} days) | ${assetName} | ${statusName}`;
      case 'monthly':
        const periodLabel = selectedPeriod === 'jan-jun' ? 'January - June' : 'July - December';
        return `Monthly Performance (${typeText}) - ${periodLabel} ${selectedYear} (6 months) | ${assetName} | ${statusName}`;
      default:
        return 'Performance Data';
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#FFD700]">📈 TRAFFIC BREAKDOWN DETAIL</h1>
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

          <div className="flex items-center gap-2 bg-[#0B1A33] rounded-lg border border-[#FFD700]/30 p-1 ml-auto">
            <button
              onClick={() => setSelectedChartType('line')}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedChartType === 'line' ? 'bg-[#FFD700] text-black' : 'text-[#A7D8FF]'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setSelectedChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm ${
                selectedChartType === 'bar' ? 'bg-[#FFD700] text-black' : 'text-[#A7D8FF]'
              }`}
            >
              Bar
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* CARD TOTAL TRANSACTIONS - LINK KE BREAKDOWN */}
        <Link href="/dashboard/asset-performance/review-breakdown-transaction" className="block group">
          <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] hover:shadow-[0_0_20px_#FFD700] transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="text-[#A7D8FF] text-sm">Total Transactions</div>
              <div className="text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-[#FFD700]">{summaryData.totalTransactions.toLocaleString()}</div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-blue-400">DP: {summaryData.depositTotal}</span>
              <span className="text-red-400">WD: {summaryData.withdrawalTotal}</span>
            </div>
          </div>
        </Link>
        
        {/* CARD TOTAL VOLUME */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Volume</div>
          <div className="text-2xl font-bold text-green-400">{formatIDR(summaryData.totalVolume)}</div>
          <div className="text-xs text-[#A7D8FF] mt-2">Avg: {formatIDR(summaryData.avgValue)}/trans</div>
        </div>
        
        {/* CARD STATUS BREAKDOWN */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Status Breakdown</div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-green-400">✓ Approved</span>
              <span className="text-white">{summaryData.approvedTotal}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-400">✗ Rejected</span>
              <span className="text-white">{summaryData.rejectedTotal}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-blue-400">! Failed</span>
              <span className="text-white">{summaryData.failedTotal}</span>
            </div>
          </div>
        </div>
        
        {/* CARD PEAK */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Peak {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Day' : 'Month'}</div>
          <div className="text-lg font-bold text-purple-400">{summaryData.peakHour}</div>
          <div className="text-xs text-[#A7D8FF]">{summaryData.peakValue} transactions</div>
        </div>
      </div>

      {/* FIRST CHART - By Transaction */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">{getDisplayTitle('transaction')}</h2>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'line' ? (
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF" 
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                  angle={filterType === 'hourly' ? -45 : 0}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                
                {/* <Line yAxisId="left" type="monotone" dataKey="chat" stroke="#FFD700" name="CS" strokeWidth={2} dot={{ r: 4 }} /> */}
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="deposit" 
                  stroke="#3b82f6" 
                  name="Deposit" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#3b82f6", stroke: "#3b82f6", strokeWidth: 1 }}
                />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="withdrawal" 
                  stroke="#ef4444" 
                  name="Withdrawal" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#ef4444", stroke: "#ef4444", strokeWidth: 1 }}
                />
              </LineChart>
            ) : (
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF" 
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                  angle={filterType === 'hourly' ? -45 : 0}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                {/* <Bar yAxisId="left" dataKey="chat" fill="#FFD700" name="CS" /> */}
                <Bar yAxisId="left" dataKey="deposit" fill="#3b82f6" name="Deposit" />
                <Bar yAxisId="left" dataKey="withdrawal" fill="#ef4444" name="Withdrawal" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECOND CHART - By Value (IDR) */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">{getDisplayTitle('value')}</h2>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'line' ? (
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF" 
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                  angle={filterType === 'hourly' ? -45 : 0}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tickFormatter={(value) => `Rp${(value/1000000)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                  formatter={(value, name) => {
                    if (name === 'CS') return value;
                    return formatIDR(value);
                  }}
                />
                <Legend />
                
                {/* <Line yAxisId="left" type="monotone" dataKey="chat" stroke="#FFD700" name="CS" strokeWidth={2} dot={{ r: 4 }} /> */}
                
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="depositVolume" 
                  stroke="#3b82f6" 
                  name="Deposit Volume" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#3b82f6", stroke: "#3b82f6", strokeWidth: 1 }}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="withdrawalVolume" 
                  stroke="#ef4444" 
                  name="Withdrawal Volume" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: "#ef4444", stroke: "#ef4444", strokeWidth: 1 }}
                />
              </LineChart>
            ) : (
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF" 
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                  angle={filterType === 'hourly' ? -45 : 0}
                  textAnchor="end"
                  height={60}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tickFormatter={(value) => `Rp${(value/1000000)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                  formatter={(value, name) => {
                    if (name === 'CS') return value;
                    return formatIDR(value);
                  }}
                />
                <Legend />
                {/* <Bar yAxisId="left" dataKey="chat" fill="#FFD700" name="CS" /> */}
                <Bar yAxisId="right" dataKey="depositVolume" fill="#3b82f6" name="Deposit Volume" />
                <Bar yAxisId="right" dataKey="withdrawalVolume" fill="#ef4444" name="Withdrawal Volume" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}