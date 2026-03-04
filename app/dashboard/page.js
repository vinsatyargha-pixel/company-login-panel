'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AssetPerformanceDetailPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Filter states
  const [filterType, setFilterType] = useState('hourly'); // hourly, daily, monthly, halfyear
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHalfYear, setSelectedHalfYear] = useState('jan-jun'); // jan-jun, jul-dec
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedChartType, setSelectedChartType] = useState('line'); // line, bar
  
  // Data states
  const [assetList, setAssetList] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    avgValue: 0,
    peakHour: '-',
    peakValue: 0
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const halfYearOptions = [
    { value: 'jan-jun', label: 'January - June' },
    { value: 'jul-dec', label: 'July - December' }
  ];

  // ===========================================
  // INITIAL SETUP
  // ===========================================
  useEffect(() => {
    setInitialLoad(false);
    fetchAssetList();
  }, []);

  // ===========================================
  // FETCH DATA KETIKA FILTER BERUBAH
  // ===========================================
  useEffect(() => {
    if (!initialLoad) {
      const timer = setTimeout(() => {
        fetchPerformanceData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filterType, selectedDate, selectedMonth, selectedYear, selectedHalfYear, selectedAsset]);

  // ===========================================
  // FETCH ASSET LIST
  // ===========================================
  const fetchAssetList = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('asset')
        .not('asset', 'is', null)
        .neq('asset', '');

      if (error) throw error;

      const uniqueAssets = [...new Set(data.map(item => item.asset))];
      setAssetList(['all', ...uniqueAssets]);
    } catch (error) {
      console.error('Error fetching asset list:', error);
    }
  };

  // ===========================================
  // GENERATE HOURLY DATA (24 JAM, MAKS KEMARIN)
  // ===========================================
  const generateHourlyData = () => {
    const data = [];
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      data.push({
        time: `${hour}:00`,
        label: `${hour}:00`,
        transactions: Math.floor(Math.random() * 50) + 10,
        volume: Math.floor(Math.random() * 5000) + 1000,
        date: dateStr
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE DAILY DATA (30 HARI)
  // ===========================================
  const generateDailyData = () => {
    const data = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      data.push({
        day: day,
        label: `${months[selectedMonth - 1]} ${day}`,
        transactions: Math.floor(Math.random() * 100) + 20,
        volume: Math.floor(Math.random() * 10000) + 2000,
        date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE MONTHLY DATA (12 BULAN)
  // ===========================================
  const generateMonthlyData = () => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        month: months[i],
        monthNum: i + 1,
        label: months[i],
        transactions: Math.floor(Math.random() * 500) + 100,
        volume: Math.floor(Math.random() * 50000) + 10000
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE HALF YEAR DATA (6 BULAN)
  // ===========================================
  const generateHalfYearData = () => {
    const data = [];
    const startMonth = selectedHalfYear === 'jan-jun' ? 0 : 6;
    const endMonth = selectedHalfYear === 'jan-jun' ? 6 : 12;
    
    for (let i = startMonth; i < endMonth; i++) {
      data.push({
        month: months[i],
        monthNum: i + 1,
        label: months[i],
        transactions: Math.floor(Math.random() * 500) + 100,
        volume: Math.floor(Math.random() * 50000) + 10000
      });
    }
    return data;
  };

  // ===========================================
  // FETCH PERFORMANCE DATA
  // ===========================================
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Simulasi loading
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let data = [];
      
      switch (filterType) {
        case 'hourly':
          data = generateHourlyData();
          break;
        case 'daily':
          data = generateDailyData();
          break;
        case 'monthly':
          data = generateMonthlyData();
          break;
        case 'halfyear':
          data = generateHalfYearData();
          break;
        default:
          data = generateHourlyData();
      }
      
      // Filter by asset jika bukan 'all'
      if (selectedAsset !== 'all') {
        // TODO: Implement actual filtering based on asset
        console.log('Filtering by asset:', selectedAsset);
      }
      
      setPerformanceData(data);
      
      // Calculate summary
      const totalTrans = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVol = data.reduce((sum, item) => sum + item.volume, 0);
      const avgVal = totalTrans > 0 ? totalVol / totalTrans : 0;
      
      // Find peak hour/day/month
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
        peakValue: peakValue
      });
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // HANDLE REFRESH
  // ===========================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceData();
    setRefreshing(false);
  };

  // ===========================================
  // GET MAX DATE FOR INPUT (KEMARIN)
  // ===========================================
  const getMaxDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // ===========================================
  // RENDER LOADING STATE
  // ===========================================
  if (loading && initialLoad) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD700] border-t-transparent mb-4"></div>
        <div className="text-[#FFD700] text-lg font-semibold animate-pulse">
          Loading Asset Performance Data...
        </div>
        <div className="text-[#A7D8FF] text-sm mt-2">
          Preparing charts and filters
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[#FFD700]">📈 ASSET PERFORMANCE DETAIL</h1>
          <p className="text-[#A7D8FF] mt-1">
            {isAdmin ? '👑 Admin Mode' : '👤 Staff Mode'} - Real-time analytics
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filter Type */}
          <div className="flex items-center gap-2">
            <span className="text-[#A7D8FF] text-sm">Period:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            >
              <option value="hourly">⏱️ Hourly (24h - Yesterday)</option>
              <option value="daily">📅 Daily (Full Month)</option>
              <option value="monthly">📆 Monthly (12 Months)</option>
              <option value="halfyear">📊 Half Year (6 Months)</option>
            </select>
          </div>

          {/* Dynamic Filters based on type */}
          {filterType === 'hourly' && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getMaxDate()}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
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
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(filterType === 'monthly' || filterType === 'halfyear') && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              >
                {[2024, 2025, 2026, 2027].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'halfyear' && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Period:</span>
              <select
                value={selectedHalfYear}
                onChange={(e) => setSelectedHalfYear(e.target.value)}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              >
                {halfYearOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Asset Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[#A7D8FF] text-sm">Asset:</span>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            >
              {assetList.map(asset => (
                <option key={asset} value={asset}>
                  {asset === 'all' ? 'All Assets' : asset}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2 bg-[#0B1A33] rounded-lg border border-[#FFD700]/30 p-1">
            <button
              onClick={() => setSelectedChartType('line')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                selectedChartType === 'line' 
                  ? 'bg-[#FFD700] text-black font-medium' 
                  : 'text-[#A7D8FF] hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setSelectedChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                selectedChartType === 'bar' 
                  ? 'bg-[#FFD700] text-black font-medium' 
                  : 'text-[#A7D8FF] hover:text-white'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Transactions</div>
          <div className="text-2xl font-bold text-[#FFD700]">{summaryData.totalTransactions.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Volume ($)</div>
          <div className="text-2xl font-bold text-green-400">${summaryData.totalVolume.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Average Value</div>
          <div className="text-2xl font-bold text-blue-400">${summaryData.avgValue.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Peak {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Day' : 'Month'}</div>
          <div className="text-lg font-bold text-purple-400">{summaryData.peakHour}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Peak Transactions</div>
          <div className="text-2xl font-bold text-orange-400">{summaryData.peakValue}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#FFD700]">
            {filterType === 'hourly' && `Hourly Performance - ${new Date(selectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} (Yesterday Data)`}
            {filterType === 'daily' && `Daily Performance - ${months[selectedMonth - 1]} ${selectedYear}`}
            {filterType === 'monthly' && `Monthly Performance - ${selectedYear}`}
            {filterType === 'halfyear' && `Half Year Performance - ${selectedHalfYear === 'jan-jun' ? 'Jan-Jun' : 'Jul-Dec'} ${selectedYear}`}
          </h2>
          <span className="text-xs text-[#A7D8FF]">
            {selectedAsset === 'all' ? 'All Assets' : `Asset: ${selectedAsset}`}
          </span>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'line' ? (
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF"
                  tick={{ fill: '#A7D8FF', fontSize: 12 }}
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#FFD700" name="Transactions" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#10b981" name="Volume ($)" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF"
                  tick={{ fill: '#A7D8FF', fontSize: 12 }}
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="transactions" fill="#FFD700" name="Transactions" />
                <Bar yAxisId="right" dataKey="volume" fill="#10b981" name="Volume ($)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#FFD700]">📋 Detailed Data</h2>
          <span className="text-xs text-[#A7D8FF]">{performanceData.length} entries</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700] font-bold border-b border-[#FFD700]/30">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Volume ($)</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Average Value</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, index) => (
                <tr key={index} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{item.label}</td>
                  <td className="px-4 py-3 text-right text-[#FFD700]">{item.transactions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400">${item.volume.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-400">
                    ${Math.round(item.volume / item.transactions).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 p-3 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 text-xs text-[#A7D8FF] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span>⏱️ Hourly: max yesterday data</span>
          <span>📅 Daily: full month view</span>
          <span>📆 Monthly: 12 months</span>
          <span>📊 Half Year: 6 months period</span>
        </div>
        <span>
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}