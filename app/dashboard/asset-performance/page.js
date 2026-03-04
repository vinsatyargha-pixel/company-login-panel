'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
  const [filterType, setFilterType] = useState('hourly'); // hourly, daily, monthly, period
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPeriod, setSelectedPeriod] = useState('jan-jun'); // jan-jun, jul-dec
  const [selectedChartType, setSelectedChartType] = useState('line');
  
  // DATA STATES
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    avgValue: 0,
    peakHour: '-',
    peakValue: 0
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2024', '2025', '2026', '2027'];

  // ===========================================
  // GENERATE HOURLY DATA (24 JAM)
  // ===========================================
  const generateHourlyData = (date) => {
    const data = [];
    const selectedDateObj = new Date(date);
    const displayDate = selectedDateObj.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      
      // Pattern realistic: pagi (08-11), siang (13-16), malam (19-22) ramai
      let transBase = 25;
      if (hour >= 8 && hour <= 11) transBase = 45;
      else if (hour >= 13 && hour <= 16) transBase = 65;
      else if (hour >= 19 && hour <= 22) transBase = 55;
      else if (hour >= 23 || hour <= 4) transBase = 12;
      
      const transactions = Math.floor(Math.random() * 15) + transBase;
      const volume = transactions * (Math.floor(Math.random() * 25) + 25);
      
      data.push({
        label: `${hourStr}:00`,
        transactions: transactions,
        volume: volume,
        displayDate: displayDate
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE DAILY DATA (1 BULAN)
  // ===========================================
  const generateDailyData = (month, year) => {
    const data = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthName = months[month - 1];
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Pattern: akhir pekan lebih ramai
      const date = new Date(year, month - 1, day);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let transBase = isWeekend ? 150 : 100;
      const transactions = Math.floor(Math.random() * 50) + transBase;
      const volume = transactions * (Math.floor(Math.random() * 30) + 30);
      
      data.push({
        label: `${monthName} ${day}`,
        day: day,
        transactions: transactions,
        volume: volume,
        fullDate: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }
    return data;
  };

  // ===========================================
  // GENERATE MONTHLY DATA (1 PERIODE 6 BULAN)
  // ===========================================
  const generateMonthlyData = (period, year) => {
    const data = [];
    const startMonth = period === 'jan-jun' ? 0 : 6;
    const endMonth = period === 'jan-jun' ? 6 : 12;
    
    for (let i = startMonth; i < endMonth; i++) {
      // Pattern: bulan tertentu lebih ramai
      let transBase = 500;
      if (i === 2 || i === 3) transBase = 800; // Mar-Apr ramai
      if (i === 8 || i === 9) transBase = 750; // Sep-Oct ramai
      if (i === 11) transBase = 900; // Dec ramai
      
      const transactions = Math.floor(Math.random() * 200) + transBase;
      const volume = transactions * (Math.floor(Math.random() * 35) + 35);
      
      data.push({
        label: months[i],
        month: months[i],
        transactions: transactions,
        volume: volume,
        period: period,
        year: year
      });
    }
    return data;
  };

  // ===========================================
  // FETCH DATA
  // ===========================================
  useEffect(() => {
    fetchData();
  }, [filterType, selectedDate, selectedMonth, selectedYear, selectedPeriod]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let data = [];
      
      switch (filterType) {
        case 'hourly':
          data = generateHourlyData(selectedDate);
          break;
        case 'daily':
          data = generateDailyData(selectedMonth, selectedYear);
          break;
        case 'monthly':
        case 'period':
          data = generateMonthlyData(selectedPeriod, selectedYear);
          break;
        default:
          data = generateHourlyData(selectedDate);
      }
      
      setPerformanceData(data);
      
      // Calculate summary
      const totalTrans = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVol = data.reduce((sum, item) => sum + item.volume, 0);
      const avgVal = totalTrans > 0 ? totalVol / totalTrans : 0;
      
      // Find peak
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

  // Get max date for hourly filter (yesterday)
  const getMaxDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  // Format display title
  const getDisplayTitle = () => {
    switch (filterType) {
      case 'hourly':
        const date = new Date(selectedDate);
        return `Hourly Performance - ${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      case 'daily':
        return `Daily Performance - ${fullMonths[selectedMonth - 1]} ${selectedYear}`;
      case 'monthly':
      case 'period':
        const periodLabel = selectedPeriod === 'jan-jun' ? 'January - June' : 'July - December';
        return `Monthly Performance - ${periodLabel} ${selectedYear}`;
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
            <option value="hourly">⏱️ Hourly (per jam)</option>
            <option value="daily">📅 Daily (per hari)</option>
            <option value="period">📊 Period (6 bulan)</option>
          </select>

          {/* Dynamic Filters */}
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

          {filterType === 'period' && (
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
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Transactions</div>
          <div className="text-2xl font-bold text-[#FFD700]">{summaryData.totalTransactions.toLocaleString()}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Total Volume ($)</div>
          <div className="text-2xl font-bold text-green-400">${summaryData.totalVolume.toLocaleString()}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Average Value</div>
          <div className="text-2xl font-bold text-blue-400">${summaryData.avgValue.toLocaleString()}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Peak {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Day' : 'Month'}</div>
          <div className="text-lg font-bold text-purple-400">{summaryData.peakHour}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-[#A7D8FF] text-sm">Peak Transactions</div>
          <div className="text-2xl font-bold text-orange-400">{summaryData.peakValue}</div>
        </div>
      </div>

      {/* Chart */}
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
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" />
                <Tooltip contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#FFD700" name="Transactions" />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#10b981" name="Volume ($)" />
              </LineChart>
            ) : (
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF" 
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" />
                <Tooltip contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="transactions" fill="#FFD700" name="Transactions" />
                <Bar yAxisId="right" dataKey="volume" fill="#10b981" name="Volume ($)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30">
          <h2 className="text-lg font-bold text-[#FFD700]">Hourly Details - {getDisplayTitle()}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700]">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Volume ($)</th>
                <th className="px-4 py-3 text-right text-[#FFD700]">Average Value</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, idx) => (
                <tr key={idx} className="border-b border-[#FFD700]/10">
                  <td className="px-4 py-2 text-white">{item.label}</td>
                  <td className="px-4 py-2 text-right text-[#FFD700]">{item.transactions}</td>
                  <td className="px-4 py-2 text-right text-green-400">${item.volume}</td>
                  <td className="px-4 py-2 text-right text-blue-400">${Math.round(item.volume / item.transactions)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}