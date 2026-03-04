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
    totalTransactions: 0,
    totalVolume: 0,
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
  // GENERATE TRAFIC DATA
  // ===========================================
  const generateHourlyData = (date, asset, status) => {
    const data = [];
    const selectedDateObj = new Date(date);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      
      let chatBase = 5;
      let depositBase = 25;
      let withdrawalBase = 15;
      
      if (hour >= 8 && hour <= 11) {
        chatBase = 15; depositBase = 45; withdrawalBase = 30;
      } else if (hour >= 13 && hour <= 16) {
        chatBase = 20; depositBase = 65; withdrawalBase = 40;
      } else if (hour >= 19 && hour <= 22) {
        chatBase = 25; depositBase = 55; withdrawalBase = 35;
      } else if (hour >= 23 || hour <= 4) {
        chatBase = 3; depositBase = 12; withdrawalBase = 8;
      }
      
      let approvedMultiplier = 0.7;
      let rejectedMultiplier = 0.2;
      let failedMultiplier = 0.1;
      
      if (status === 'approved') {
        approvedMultiplier = 1; rejectedMultiplier = 0; failedMultiplier = 0;
      } else if (status === 'rejected') {
        approvedMultiplier = 0; rejectedMultiplier = 1; failedMultiplier = 0;
      } else if (status === 'failed') {
        approvedMultiplier = 0; rejectedMultiplier = 0; failedMultiplier = 1;
      }
      
      const chatTrans = Math.floor(Math.random() * 10) + chatBase;
      const depositApproved = Math.floor(Math.random() * 15) + depositBase;
      const depositRejected = Math.floor(Math.random() * 5);
      const depositFailed = Math.floor(Math.random() * 3);
      const withdrawalApproved = Math.floor(Math.random() * 12) + withdrawalBase;
      const withdrawalRejected = Math.floor(Math.random() * 4);
      const withdrawalFailed = Math.floor(Math.random() * 2);
      
      const depositTrans = Math.round((depositApproved * approvedMultiplier) + (depositRejected * rejectedMultiplier) + (depositFailed * failedMultiplier));
      const withdrawalTrans = Math.round((withdrawalApproved * approvedMultiplier) + (withdrawalRejected * rejectedMultiplier) + (withdrawalFailed * failedMultiplier));
      
      // Deposit Volume & Highest
      const depositVolume = depositTrans * 250000;
      const depositHighest = Math.floor(Math.random() * 5000000) + 1000000;
      
      // Withdrawal Volume & Highest
      const withdrawalVolume = withdrawalTrans * 180000;
      const withdrawalHighest = Math.floor(Math.random() * 4000000) + 800000;
      
      data.push({
        period: `${hourStr}:00`,
        type: 'hour',
        chat: Math.round(chatTrans),
        deposit: Math.round(depositTrans),
        depositVolume,
        depositHighest,
        withdrawal: Math.round(withdrawalTrans),
        withdrawalVolume,
        withdrawalHighest,
        depositApproved: Math.round(depositApproved),
        depositRejected: Math.round(depositRejected),
        depositFailed: Math.round(depositFailed),
        withdrawalApproved: Math.round(withdrawalApproved),
        withdrawalRejected: Math.round(withdrawalRejected),
        withdrawalFailed: Math.round(withdrawalFailed),
        total: Math.round(chatTrans + depositTrans + withdrawalTrans),
        totalVolume: depositVolume + withdrawalVolume,
      });
    }
    return data;
  };

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
      
      let approvedMultiplier = 0.7;
      let rejectedMultiplier = 0.2;
      let failedMultiplier = 0.1;
      
      if (status === 'approved') {
        approvedMultiplier = 1; rejectedMultiplier = 0; failedMultiplier = 0;
      } else if (status === 'rejected') {
        approvedMultiplier = 0; rejectedMultiplier = 1; failedMultiplier = 0;
      } else if (status === 'failed') {
        approvedMultiplier = 0; rejectedMultiplier = 0; failedMultiplier = 1;
      }
      
      const chatTrans = Math.floor(Math.random() * 30) + chatBase;
      const depositApproved = Math.floor(Math.random() * 50) + depositBase;
      const depositRejected = Math.floor(Math.random() * 15);
      const depositFailed = Math.floor(Math.random() * 8);
      const withdrawalApproved = Math.floor(Math.random() * 40) + withdrawalBase;
      const withdrawalRejected = Math.floor(Math.random() * 12);
      const withdrawalFailed = Math.floor(Math.random() * 6);
      
      const depositTrans = Math.round((depositApproved * approvedMultiplier) + (depositRejected * rejectedMultiplier) + (depositFailed * failedMultiplier));
      const withdrawalTrans = Math.round((withdrawalApproved * approvedMultiplier) + (withdrawalRejected * rejectedMultiplier) + (withdrawalFailed * failedMultiplier));
      
      // Deposit Volume & Highest
      const depositVolume = depositTrans * 250000;
      const depositHighest = Math.floor(Math.random() * 15000000) + 3000000;
      
      // Withdrawal Volume & Highest
      const withdrawalVolume = withdrawalTrans * 180000;
      const withdrawalHighest = Math.floor(Math.random() * 12000000) + 2500000;
      
      data.push({
        period: `${monthName} ${day}`,
        type: 'day',
        chat: Math.round(chatTrans),
        deposit: Math.round(depositTrans),
        depositVolume,
        depositHighest,
        withdrawal: Math.round(withdrawalTrans),
        withdrawalVolume,
        withdrawalHighest,
        depositApproved: Math.round(depositApproved),
        depositRejected: Math.round(depositRejected),
        depositFailed: Math.round(depositFailed),
        withdrawalApproved: Math.round(withdrawalApproved),
        withdrawalRejected: Math.round(withdrawalRejected),
        withdrawalFailed: Math.round(withdrawalFailed),
        total: Math.round(chatTrans + depositTrans + withdrawalTrans),
        totalVolume: depositVolume + withdrawalVolume,
      });
    }
    return data;
  };

  const generateMonthlyData = (period, year, asset, status) => {
    const data = [];
    const startMonth = period === 'jan-jun' ? 0 : 6;
    const endMonth = period === 'jan-jun' ? 6 : 12;
    
    for (let i = startMonth; i < endMonth; i++) {
      let chatBase = 400;
      let depositBase = 800;
      let withdrawalBase = 600;
      
      if (i === 2 || i === 3) {
        chatBase = 600; depositBase = 1200; withdrawalBase = 900;
      }
      if (i === 8 || i === 9) {
        chatBase = 550; depositBase = 1100; withdrawalBase = 850;
      }
      if (i === 11) {
        chatBase = 700; depositBase = 1400; withdrawalBase = 1100;
      }
      
      let approvedMultiplier = 0.7;
      let rejectedMultiplier = 0.2;
      let failedMultiplier = 0.1;
      
      if (status === 'approved') {
        approvedMultiplier = 1; rejectedMultiplier = 0; failedMultiplier = 0;
      } else if (status === 'rejected') {
        approvedMultiplier = 0; rejectedMultiplier = 1; failedMultiplier = 0;
      } else if (status === 'failed') {
        approvedMultiplier = 0; rejectedMultiplier = 0; failedMultiplier = 1;
      }
      
      const chatTrans = Math.floor(Math.random() * 200) + chatBase;
      const depositApproved = Math.floor(Math.random() * 300) + depositBase;
      const depositRejected = Math.floor(Math.random() * 80);
      const depositFailed = Math.floor(Math.random() * 40);
      const withdrawalApproved = Math.floor(Math.random() * 250) + withdrawalBase;
      const withdrawalRejected = Math.floor(Math.random() * 60);
      const withdrawalFailed = Math.floor(Math.random() * 30);
      
      const depositTrans = Math.round((depositApproved * approvedMultiplier) + (depositRejected * rejectedMultiplier) + (depositFailed * failedMultiplier));
      const withdrawalTrans = Math.round((withdrawalApproved * approvedMultiplier) + (withdrawalRejected * rejectedMultiplier) + (withdrawalFailed * failedMultiplier));
      
      // Deposit Volume & Highest
      const depositVolume = depositTrans * 250000;
      const depositHighest = Math.floor(Math.random() * 50000000) + 10000000;
      
      // Withdrawal Volume & Highest
      const withdrawalVolume = withdrawalTrans * 180000;
      const withdrawalHighest = Math.floor(Math.random() * 40000000) + 8000000;
      
      data.push({
        period: months[i],
        type: 'month',
        chat: Math.round(chatTrans),
        deposit: Math.round(depositTrans),
        depositVolume,
        depositHighest,
        withdrawal: Math.round(withdrawalTrans),
        withdrawalVolume,
        withdrawalHighest,
        depositApproved: Math.round(depositApproved),
        depositRejected: Math.round(depositRejected),
        depositFailed: Math.round(depositFailed),
        withdrawalApproved: Math.round(withdrawalApproved),
        withdrawalRejected: Math.round(withdrawalRejected),
        withdrawalFailed: Math.round(withdrawalFailed),
        total: Math.round(chatTrans + depositTrans + withdrawalTrans),
        totalVolume: depositVolume + withdrawalVolume,
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
      }
      
      setTraficData(data);
      
      // Hitung summary
      const chatTotal = data.reduce((sum, item) => sum + item.chat, 0);
      const depositTotal = data.reduce((sum, item) => sum + item.deposit, 0);
      const withdrawalTotal = data.reduce((sum, item) => sum + item.withdrawal, 0);
      const totalTrans = data.reduce((sum, item) => sum + item.total, 0);
      const totalVol = data.reduce((sum, item) => sum + item.totalVolume, 0);
      
      const approvedTotal = data.reduce((sum, item) => 
        sum + (item.depositApproved || 0) + (item.withdrawalApproved || 0), 0);
      const rejectedTotal = data.reduce((sum, item) => 
        sum + (item.depositRejected || 0) + (item.withdrawalRejected || 0), 0);
      const failedTotal = data.reduce((sum, item) => 
        sum + (item.depositFailed || 0) + (item.withdrawalFailed || 0), 0);
      
      setSummaryData({
        totalTransactions: totalTrans,
        totalVolume: totalVol,
        chatTotal,
        depositTotal,
        withdrawalTotal,
        approvedTotal,
        rejectedTotal,
        failedTotal
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
        return `Hourly Trafic - ${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} | ${assetName} | ${statusName}`;
      case 'daily':
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        return `Daily Trafic - ${fullMonths[selectedMonth - 1]} ${selectedYear} (${daysInMonth} days) | ${assetName} | ${statusName}`;
      case 'monthly':
        const periodLabel = selectedPeriod === 'jan-jun' ? 'January - June' : 'July - December';
        return `Monthly Trafic - ${periodLabel} ${selectedYear} (6 months) | ${assetName} | ${statusName}`;
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
            href="/dashboard/asset-performance" 
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

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Trafic</div>
          <div className="text-2xl font-bold text-[#FFD700]">{Math.round(summaryData.totalTransactions).toLocaleString()}</div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-yellow-400">CS: {Math.round(summaryData.chatTotal)}</span>
            <span className="text-blue-400">DP: {Math.round(summaryData.depositTotal)}</span>
            <span className="text-red-400">WD: {Math.round(summaryData.withdrawalTotal)}</span>
          </div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Volume</div>
          <div className="text-2xl font-bold text-green-400">{formatIDR(summaryData.totalVolume)}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Status Breakdown</div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-green-400">✓ Approved: {Math.round(summaryData.approvedTotal)}</span>
            <span className="text-red-400">✗ Rejected: {Math.round(summaryData.rejectedTotal)}</span>
            <span className="text-blue-400">! Failed: {Math.round(summaryData.failedTotal)}</span>
          </div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Data Points</div>
          <div className="text-lg font-bold text-purple-400">{traficData.length} entries</div>
          <div className="text-xs text-[#A7D8FF]">{getDisplayTitle()}</div>
        </div>
      </div>

      {/* MAIN TABLE - ALL IN ONE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30 bg-gradient-to-r from-[#FFD700]/10 to-transparent">
          <h2 className="text-xl font-bold text-[#FFD700]">📋 TRAFIC BREAKDOWN TABLE</h2>
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
                
                {/* CHAT SUBHEADERS */}
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
                // Hitung total untuk persentase
                const totalChat = traficData.reduce((sum, i) => sum + i.chat, 0);
                const totalDeposit = traficData.reduce((sum, i) => sum + i.deposit, 0);
                const totalWithdrawal = traficData.reduce((sum, i) => sum + i.withdrawal, 0);
                
                // Persentase dari total keseluruhan dalam rentang filter
                const chatPercentage = totalChat > 0 ? (item.chat / totalChat) * 100 : 0;
                const depositPercentage = totalDeposit > 0 ? (item.deposit / totalDeposit) * 100 : 0;
                const withdrawalPercentage = totalWithdrawal > 0 ? (item.withdrawal / totalWithdrawal) * 100 : 0;
                
                return (
                  <tr key={idx} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium border-r border-[#FFD700]/10">{item.period}</td>
                    
                    {/* CHAT DATA - Transaksi bulat */}
                    <td className="px-4 py-3 text-right text-yellow-400 border-r border-[#FFD700]/10">{Math.round(item.chat)}</td>
                    <td className="px-4 py-3 text-right text-[#A7D8FF] border-r border-[#FFD700]/10">{Math.round(chatPercentage)}%</td>
                    
                    {/* DEPOSIT DATA - Trans bulat, Volume, Highest, % */}
                    <td className="px-4 py-3 text-right text-blue-400 border-r border-[#FFD700]/10">{Math.round(item.deposit)}</td>
                    <td className="px-4 py-3 text-right text-blue-400 border-r border-[#FFD700]/10">{formatIDR(item.depositVolume)}</td>
                    <td className="px-4 py-3 text-right text-blue-400 border-r border-[#FFD700]/10">{formatIDR(item.depositHighest)}</td>
                    <td className="px-4 py-3 text-right text-[#A7D8FF] border-r border-[#FFD700]/10">{Math.round(depositPercentage)}%</td>
                    
                    {/* WITHDRAWAL DATA - Trans bulat, Volume, Highest, % */}
                    <td className="px-4 py-3 text-right text-red-400 border-r border-[#FFD700]/10">{Math.round(item.withdrawal)}</td>
                    <td className="px-4 py-3 text-right text-red-400 border-r border-[#FFD700]/10">{formatIDR(item.withdrawalVolume)}</td>
                    <td className="px-4 py-3 text-right text-red-400 border-r border-[#FFD700]/10">{formatIDR(item.withdrawalHighest)}</td>
                    <td className="px-4 py-3 text-right text-[#A7D8FF]">{Math.round(withdrawalPercentage)}%</td>
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