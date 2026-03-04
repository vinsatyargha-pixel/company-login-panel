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
  const [filterType, setFilterType] = useState('hourly'); // hourly, daily, monthly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('jan-jun'); // jan-jun, jul-dec
  const [selectedAsset, setSelectedAsset] = useState('all'); // Filter Asset
  const [selectedStatus, setSelectedStatus] = useState('all'); // Filter Status: all, approved, rejected, failed
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

  // Status options
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
  // GENERATE HOURLY DATA (00:00 - 23:00) - 24 JAM
  // ===========================================
  const generateHourlyData = (date, asset, status) => {
    const data = [];
    const selectedDateObj = new Date(date);
    const displayDate = selectedDateObj.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      
      // Base pattern
      let chatBase = 5;
      let depositBase = 25;
      let withdrawalBase = 15;
      
      if (hour >= 8 && hour <= 11) {
        chatBase = 15;
        depositBase = 45;
        withdrawalBase = 30;
      } else if (hour >= 13 && hour <= 16) {
        chatBase = 20;
        depositBase = 65;
        withdrawalBase = 40;
      } else if (hour >= 19 && hour <= 22) {
        chatBase = 25;
        depositBase = 55;
        withdrawalBase = 35;
      } else if (hour >= 23 || hour <= 4) {
        chatBase = 3;
        depositBase = 12;
        withdrawalBase = 8;
      }
      
      // Apply status multipliers
      let approvedMultiplier = 0.7;
      let rejectedMultiplier = 0.2;
      let failedMultiplier = 0.1;
      
      if (status === 'approved') {
        approvedMultiplier = 1;
        rejectedMultiplier = 0;
        failedMultiplier = 0;
      } else if (status === 'rejected') {
        approvedMultiplier = 0;
        rejectedMultiplier = 1;
        failedMultiplier = 0;
      } else if (status === 'failed') {
        approvedMultiplier = 0;
        rejectedMultiplier = 0;
        failedMultiplier = 1;
      }
      
      const chatTrans = Math.floor(Math.random() * 10) + chatBase;
      const depositApproved = Math.floor(Math.random() * 15) + depositBase;
      const depositRejected = Math.floor(Math.random() * 5);
      const depositFailed = Math.floor(Math.random() * 3);
      const withdrawalApproved = Math.floor(Math.random() * 12) + withdrawalBase;
      const withdrawalRejected = Math.floor(Math.random() * 4);
      const withdrawalFailed = Math.floor(Math.random() * 2);
      
      // Apply status filter
      const depositTrans = 
        (depositApproved * approvedMultiplier) + 
        (depositRejected * rejectedMultiplier) + 
        (depositFailed * failedMultiplier);
      
      const withdrawalTrans = 
        (withdrawalApproved * approvedMultiplier) + 
        (withdrawalRejected * rejectedMultiplier) + 
        (withdrawalFailed * failedMultiplier);
      
      const totalTrans = chatTrans + depositTrans + withdrawalTrans;
      
      // Volume dalam IDR
      const depositVolume = depositTrans * 250000;
      const withdrawalVolume = withdrawalTrans * 180000;
      const totalVolume = depositVolume + withdrawalVolume;
      
      data.push({
        label: `${hourStr}:00`,
        hour: hour,
        chat: chatTrans,
        deposit: depositTrans,
        withdrawal: withdrawalTrans,
        depositApproved: depositApproved,
        depositRejected: depositRejected,
        depositFailed: depositFailed,
        withdrawalApproved: withdrawalApproved,
        withdrawalRejected: withdrawalRejected,
        withdrawalFailed: withdrawalFailed,
        transactions: totalTrans,
        volume: totalVolume,
        displayDate: displayDate,
        asset: asset
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE DAILY DATA
  // ===========================================
  const generateDailyData = (month, year, asset, status) => {
    const data = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = months[month - 1];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let chatBase = isWeekend ? 50 : 30;
      let depositBase = isWeekend ? 200 : 150;
      let withdrawalBase = isWeekend ? 150 : 100;
      
      // Apply status multipliers
      let approvedMultiplier = 0.7;
      let rejectedMultiplier = 0.2;
      let failedMultiplier = 0.1;
      
      if (status === 'approved') {
        approvedMultiplier = 1;
        rejectedMultiplier = 0;
        failedMultiplier = 0;
      } else if (status === 'rejected') {
        approvedMultiplier = 0;
        rejectedMultiplier = 1;
        failedMultiplier = 0;
      } else if (status === 'failed') {
        approvedMultiplier = 0;
        rejectedMultiplier = 0;
        failedMultiplier = 1;
      }
      
      const chatTrans = Math.floor(Math.random() * 30) + chatBase;
      const depositApproved = Math.floor(Math.random() * 50) + depositBase;
      const depositRejected = Math.floor(Math.random() * 15);
      const depositFailed = Math.floor(Math.random() * 8);
      const withdrawalApproved = Math.floor(Math.random() * 40) + withdrawalBase;
      const withdrawalRejected = Math.floor(Math.random() * 12);
      const withdrawalFailed = Math.floor(Math.random() * 6);
      
      const depositTrans = 
        (depositApproved * approvedMultiplier) + 
        (depositRejected * rejectedMultiplier) + 
        (depositFailed * failedMultiplier);
      
      const withdrawalTrans = 
        (withdrawalApproved * approvedMultiplier) + 
        (withdrawalRejected * rejectedMultiplier) + 
        (withdrawalFailed * failedMultiplier);
      
      const totalTrans = chatTrans + depositTrans + withdrawalTrans;
      const depositVolume = depositTrans * 250000;
      const withdrawalVolume = withdrawalTrans * 180000;
      const totalVolume = depositVolume + withdrawalVolume;
      
      data.push({
        label: `${monthName} ${day}`,
        day: day,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        isWeekend: isWeekend,
        chat: chatTrans,
        deposit: depositTrans,
        withdrawal: withdrawalTrans,
        depositApproved: depositApproved,
        depositRejected: depositRejected,
        depositFailed: depositFailed,
        withdrawalApproved: withdrawalApproved,
        withdrawalRejected: withdrawalRejected,
        withdrawalFailed: withdrawalFailed,
        transactions: totalTrans,
        volume: totalVolume,
        fullDate: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        asset: asset
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE MONTHLY DATA (6 BULAN)
  // ===========================================
  const generateMonthlyData = (period, year, asset, status) => {
    const data = [];
    const startMonth = period === 'jan-jun' ? 0 : 6;
    const endMonth = period === 'jan-jun' ? 6 : 12;
    
    for (let i = startMonth; i < endMonth; i++) {
      let chatBase = 400;
      let depositBase = 800;
      let withdrawalBase = 600;
      
      if (i === 2 || i === 3) {
        chatBase = 600;
        depositBase = 1200;
        withdrawalBase = 900;
      }
      if (i === 8 || i === 9) {
        chatBase = 550;
        depositBase = 1100;
        withdrawalBase = 850;
      }
      if (i === 11) {
        chatBase = 700;
        depositBase = 1400;
        withdrawalBase = 1100;
      }
      
      // Apply status multipliers
      let approvedMultiplier = 0.7;
      let rejectedMultiplier = 0.2;
      let failedMultiplier = 0.1;
      
      if (status === 'approved') {
        approvedMultiplier = 1;
        rejectedMultiplier = 0;
        failedMultiplier = 0;
      } else if (status === 'rejected') {
        approvedMultiplier = 0;
        rejectedMultiplier = 1;
        failedMultiplier = 0;
      } else if (status === 'failed') {
        approvedMultiplier = 0;
        rejectedMultiplier = 0;
        failedMultiplier = 1;
      }
      
      const chatTrans = Math.floor(Math.random() * 200) + chatBase;
      const depositApproved = Math.floor(Math.random() * 300) + depositBase;
      const depositRejected = Math.floor(Math.random() * 80);
      const depositFailed = Math.floor(Math.random() * 40);
      const withdrawalApproved = Math.floor(Math.random() * 250) + withdrawalBase;
      const withdrawalRejected = Math.floor(Math.random() * 60);
      const withdrawalFailed = Math.floor(Math.random() * 30);
      
      const depositTrans = 
        (depositApproved * approvedMultiplier) + 
        (depositRejected * rejectedMultiplier) + 
        (depositFailed * failedMultiplier);
      
      const withdrawalTrans = 
        (withdrawalApproved * approvedMultiplier) + 
        (withdrawalRejected * rejectedMultiplier) + 
        (withdrawalFailed * failedMultiplier);
      
      const totalTrans = chatTrans + depositTrans + withdrawalTrans;
      const depositVolume = depositTrans * 250000;
      const withdrawalVolume = withdrawalTrans * 180000;
      const totalVolume = depositVolume + withdrawalVolume;
      
      data.push({
        label: months[i],
        month: months[i],
        monthNum: i + 1,
        chat: chatTrans,
        deposit: depositTrans,
        withdrawal: withdrawalTrans,
        depositApproved: depositApproved,
        depositRejected: depositRejected,
        depositFailed: depositFailed,
        withdrawalApproved: withdrawalApproved,
        withdrawalRejected: withdrawalRejected,
        withdrawalFailed: withdrawalFailed,
        transactions: totalTrans,
        volume: totalVolume,
        period: period,
        year: year,
        asset: asset
      });
    }
    return data;
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
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let data = [];
      
      switch (filterType) {
        case 'hourly':
          data = generateHourlyData(selectedDate, selectedAsset, selectedStatus);
          break;
        case 'daily':
          data = generateDailyData(selectedMonth, selectedYear, selectedAsset, selectedStatus);
          break;
        case 'monthly':
          data = generateMonthlyData(selectedPeriod, selectedYear, selectedAsset, selectedStatus);
          break;
        default:
          data = generateHourlyData(selectedDate, selectedAsset, selectedStatus);
      }
      
      // Filter by asset if not 'all'
      if (selectedAsset !== 'all') {
        data = data.filter(item => item.asset === selectedAsset);
      }
      
      setPerformanceData(data);
      
      // Calculate summary
      const totalTrans = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVol = data.reduce((sum, item) => sum + item.volume, 0);
      const avgVal = totalTrans > 0 ? totalVol / totalTrans : 0;
      const chatTotal = data.reduce((sum, item) => sum + item.chat, 0);
      const depositTotal = data.reduce((sum, item) => sum + item.deposit, 0);
      const withdrawalTotal = data.reduce((sum, item) => sum + item.withdrawal, 0);
      
      // Status totals
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
        avgValue: Math.round(avgVal),
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

  const getDisplayTitle = () => {
    const assetName = selectedAsset === 'all' ? 'All Assets' : selectedAsset;
    const statusName = statusOptions.find(s => s.value === selectedStatus)?.label || 'All Status';
    
    switch (filterType) {
      case 'hourly':
        const date = new Date(selectedDate);
        return `Hourly Performance (24 Hours) - ${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${assetName} | ${statusName}`;
      case 'daily':
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        return `Daily Performance - ${fullMonths[selectedMonth - 1]} ${selectedYear} (${daysInMonth} days) | ${assetName} | ${statusName}`;
      case 'monthly':
        const periodLabel = selectedPeriod === 'jan-jun' ? 'January - June' : 'July - December';
        return `Monthly Performance - ${periodLabel} ${selectedYear} (6 months) | ${assetName} | ${statusName}`;
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
      {/* Header with Back Button */}
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
          <h1 className="text-2xl font-bold text-[#FFD700]">📈 ASSET PERFORMANCE DETAIL</h1>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="mb-6 bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="hourly">⏱️ Hourly (24 Jam)</option>
            <option value="daily">📅 Daily (1 Bulan)</option>
            <option value="monthly">📊 Monthly (6 Bulan)</option>
          </select>

          {/* Asset Filter */}
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

          {/* Status Filter */}
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

          {/* Dynamic Date Filters */}
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

          {/* Chart Type Toggle */}
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

          {/* Refresh Button */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Transactions</div>
          <div className="text-2xl font-bold text-[#FFD700]">{summaryData.totalTransactions.toLocaleString()}</div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-yellow-400">CS: {summaryData.chatTotal}</span>
            <span className="text-blue-400">DP: {summaryData.depositTotal}</span>
            <span className="text-red-400">WD: {summaryData.withdrawalTotal}</span>
          </div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Volume</div>
          <div className="text-2xl font-bold text-green-400">{formatIDR(summaryData.totalVolume)}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Status Breakdown</div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-green-400">✓ Approved: {summaryData.approvedTotal}</span>
            <span className="text-red-400">✗ Rejected: {summaryData.rejectedTotal}</span>
            <span className="text-blue-400">! Failed: {summaryData.failedTotal}</span>
          </div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Peak {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Day' : 'Month'}</div>
          <div className="text-lg font-bold text-purple-400">{summaryData.peakHour}</div>
          <div className="text-xs text-[#A7D8FF]">{summaryData.peakValue} transactions</div>
        </div>
      </div>

      {/* Chart with 3 Lines and Dots */}
<div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-6 mb-6">
  <h2 className="text-xl font-bold text-[#FFD700] mb-4">{getDisplayTitle()}</h2>
  
  <div className="h-96">
    <ResponsiveContainer width="100%" height="100%">
      {selectedChartType === 'line' ? (
        <LineChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
          <XAxis 
            dataKey="label" 
            stroke="#A7D8FF" 
            interval={filterType === 'hourly' ? 2 : filterType === 'daily' ? 5 : 0}
          />
          <YAxis yAxisId="left" stroke="#A7D8FF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
            labelStyle={{ color: '#FFD700' }}
          />
          <Legend />
          
          {/* CS Line - Kuning dengan titik */}
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="chat" 
            stroke="#FFD700" 
            name="CS" 
            strokeWidth={2} 
            dot={{ r: 4, fill: "#FFD700", stroke: "#FFD700", strokeWidth: 1 }}
            activeDot={{ r: 6, fill: "#FFD700", stroke: "#fff", strokeWidth: 2 }}
          />
          
          {/* Deposit Line - Biru dengan titik */}
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="deposit" 
            stroke="#3b82f6" 
            name="Deposit" 
            strokeWidth={2} 
            dot={{ r: 4, fill: "#3b82f6", stroke: "#3b82f6", strokeWidth: 1 }}
            activeDot={{ r: 6, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
          />
          
          {/* Withdrawal Line - Merah dengan titik */}
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="withdrawal" 
            stroke="#ef4444" 
            name="Withdrawal" 
            strokeWidth={2} 
            dot={{ r: 4, fill: "#ef4444", stroke: "#ef4444", strokeWidth: 1 }}
            activeDot={{ r: 6, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      ) : (
        <BarChart data={performanceData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
          <XAxis 
            dataKey="label" 
            stroke="#A7D8FF" 
            interval={filterType === 'hourly' ? 2 : filterType === 'daily' ? 5 : 0}
          />
          <YAxis yAxisId="left" stroke="#A7D8FF" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
            labelStyle={{ color: '#FFD700' }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="chat" fill="#FFD700" name="CS" />
          <Bar yAxisId="left" dataKey="deposit" fill="#3b82f6" name="Deposit" />
          <Bar yAxisId="left" dataKey="withdrawal" fill="#ef4444" name="Withdrawal" />
        </BarChart>
      )}
    </ResponsiveContainer>
  </div>
</div>

      {/* CHAT PERFORMANCE TABLE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden mb-6">
        <div className="p-4 border-b border-[#FFD700]/30 bg-yellow-500/10">
          <h2 className="text-lg font-bold text-yellow-400">💬 CHAT PERFORMANCE</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700]">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Chat Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, idx) => (
                <tr key={`chat-${idx}`} className="border-b border-[#FFD700]/10">
                  <td className="px-4 py-2 text-white">{item.label}</td>
                  <td className="px-4 py-2 text-right text-yellow-400">{item.chat}</td>
                  <td className="px-4 py-2 text-right text-[#A7D8FF]">
                    {Math.round((item.chat / item.transactions) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DEPOSIT PERFORMANCE TABLE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden mb-6">
        <div className="p-4 border-b border-[#FFD700]/30 bg-blue-500/10">
          <h2 className="text-lg font-bold text-blue-400">💰 DEPOSIT PERFORMANCE</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700]">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Deposit Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Volume (IDR)</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Average Value</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, idx) => {
                const depositVolume = item.deposit * 250000;
                return (
                  <tr key={`deposit-${idx}`} className="border-b border-[#FFD700]/10">
                    <td className="px-4 py-2 text-white">{item.label}</td>
                    <td className="px-4 py-2 text-right text-blue-400">{item.deposit}</td>
                    <td className="px-4 py-2 text-right text-blue-400">{formatIDR(depositVolume)}</td>
                    <td className="px-4 py-2 text-right text-blue-400">{formatIDR(depositVolume / item.deposit)}</td>
                    <td className="px-4 py-2 text-right text-[#A7D8FF]">
                      {Math.round((item.deposit / item.transactions) * 100)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* WITHDRAWAL PERFORMANCE TABLE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30 bg-red-500/10">
          <h2 className="text-lg font-bold text-red-400">💸 WITHDRAWAL PERFORMANCE</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700]">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Withdrawal Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Volume (IDR)</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Average Value</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, idx) => {
                const withdrawalVolume = item.withdrawal * 180000;
                return (
                  <tr key={`withdrawal-${idx}`} className="border-b border-[#FFD700]/10">
                    <td className="px-4 py-2 text-white">{item.label}</td>
                    <td className="px-4 py-2 text-right text-red-400">{item.withdrawal}</td>
                    <td className="px-4 py-2 text-right text-red-400">{formatIDR(withdrawalVolume)}</td>
                    <td className="px-4 py-2 text-right text-red-400">{formatIDR(withdrawalVolume / item.withdrawal)}</td>
                    <td className="px-4 py-2 text-right text-[#A7D8FF]">
                      {Math.round((item.withdrawal / item.transactions) * 100)}%
                    </td>
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