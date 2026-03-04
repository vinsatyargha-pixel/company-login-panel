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
  const [selectedChartType, setSelectedChartType] = useState('line');
  
  // Data untuk yesterday hourly
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    avgValue: 0,
    peakHour: '-',
    peakValue: 0
  });

  // ===========================================
  // GENERATE YESTERDAY HOURLY DATA
  // ===========================================
  const generateYesterdayHourlyData = () => {
    const data = [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const displayDate = `${day}/${month}/${year}`;
    
    // Generate data untuk 24 jam dengan pola realistic
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      
      // Pola: pagi (08-11), siang (13-16), malam (19-22) ramai
      // Tengah malam (00-04) sepi
      let transBase = 25; // default
      if (hour >= 8 && hour <= 11) transBase = 45; // Pagi ramai
      else if (hour >= 13 && hour <= 16) transBase = 65; // Siang ramai
      else if (hour >= 19 && hour <= 22) transBase = 55; // Malam ramai
      else if (hour >= 23 || hour <= 4) transBase = 12; // Tengah malam sepi
      
      const transactions = Math.floor(Math.random() * 15) + transBase;
      const volume = transactions * (Math.floor(Math.random() * 25) + 25); // $25-50 per transaksi
      
      data.push({
        hour: hourStr,
        label: `${hourStr}:00`,
        transactions: transactions,
        volume: volume,
        date: dateStr,
        displayDate: displayDate
      });
    }
    return data;
  };

  // ===========================================
  // FETCH DATA
  // ===========================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Simulasi loading
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const data = generateYesterdayHourlyData();
      setPerformanceData(data);
      
      // Hitung summary
      const totalTrans = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVol = data.reduce((sum, item) => sum + item.volume, 0);
      const avgVal = totalTrans > 0 ? totalVol / totalTrans : 0;
      
      // Cari peak hour (jam dengan transaksi tertinggi)
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

  // Format tanggal yesterday
  const getYesterdayDisplay = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toLocaleDateString('id-ID', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD700] border-t-transparent mb-4"></div>
        <div className="text-[#FFD700] text-lg font-semibold animate-pulse">
          Loading Asset Performance...
        </div>
        <div className="text-[#A7D8FF] text-sm mt-2">
          Preparing yesterday hourly data
        </div>
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
            className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          
          <h1 className="text-2xl font-bold text-[#FFD700]">📈 ASSET PERFORMANCE DETAIL</h1>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Info Card - Yesterday Data */}
      <div className="mb-6 bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[#FFD700] font-medium">📊 HOURLY PERFORMANCE - YESTERDAY ({getYesterdayDisplay()})</span>
          <span className="text-xs text-[#A7D8FF] ml-auto">(maximum data: yesterday)</span>
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
          <div className="text-[#A7D8FF] text-sm">Peak Hour</div>
          <div className="text-lg font-bold text-purple-400">{summaryData.peakHour}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Peak Transactions</div>
          <div className="text-2xl font-bold text-orange-400">{summaryData.peakValue}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-6 mb-6">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">
          Hourly Transactions & Volume - Yesterday ({getYesterdayDisplay()})
        </h2>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'line' ? (
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF"
                  tick={{ fill: '#A7D8FF', fontSize: 12 }}
                  interval={2}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#FFD700" name="Transactions" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#10b981" name="Volume ($)" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF"
                  tick={{ fill: '#A7D8FF', fontSize: 12 }}
                  interval={2}
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
          <h2 className="text-xl font-bold text-[#FFD700]">📋 Hourly Details - Yesterday</h2>
          <span className="text-xs text-[#A7D8FF]">{performanceData.length} entries</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700] font-bold border-b border-[#FFD700]/30">Hour</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Volume ($)</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Average Value</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, index) => (
                <tr key={index} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{item.label}</td>
                  <td className="px-4 py-3 text-right text-[#FFD700]">{item.transactions}</td>
                  <td className="px-4 py-3 text-right text-green-400">${item.volume}</td>
                  <td className="px-4 py-3 text-right text-blue-400">
                    ${Math.round(item.volume / item.transactions)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-[#A7D8FF] text-right">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}