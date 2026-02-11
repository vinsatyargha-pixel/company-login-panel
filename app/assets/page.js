// app/assets/page.js - WITH CUSTOM DATE FILTER
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Format IDR - SIMPLIFIED
const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('yesterday'); // Default ke yesterday
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [dateFilter, customStartDate, customEndDate]);

  const getDateRange = (filter) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    let start = new Date();
    let end = today;
    
    switch(filter) {
      case 'yesterday':
        start = yesterday;
        end = yesterday;
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setDate(today.getDate() - 30);
        break;
      case '3month':
        start.setMonth(today.getMonth() - 3);
        break;
      case '6month':
        start.setMonth(today.getMonth() - 6);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: customStartDate,
            end: customEndDate
          };
        }
        // Fallback to yesterday if custom not set
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
      
      // Fetch assets
      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: true });
      
      setAssets(assetsData || []);

      // Determine date range
      const dateRange = getDateRange(dateFilter);

      // Fetch transactions within date range
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          asset:assets(asset_code, asset_name, wlb_code)
        `)
        .gte('transaction_date', dateRange.start)
        .lte('transaction_date', dateRange.end)
        .order('transaction_date', { ascending: false });
      
      setTransactions(transactionsData || []);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall stats
  const calculateStats = () => {
    const stats = {
      deposit: { approved: 0, rejected: 0, failed: 0 },
      withdrawal: { approved: 0, rejected: 0, failed: 0 }
    };

    transactions.forEach(trans => {
      const type = trans.transaction_type.toLowerCase();
      const status = trans.transaction_status.toLowerCase();
      if (stats[type] && stats[type][status] !== undefined) {
        stats[type][status] += trans.amount;
      }
    });

    return stats;
  };

  const stats = calculateStats();

  // Get current date range for display
  const currentDateRange = getDateRange(dateFilter);
  const displayDateRange = dateFilter === 'custom' && customStartDate && customEndDate 
    ? `${customStartDate} to ${customEndDate}`
    : `${currentDateRange.start}${currentDateRange.start !== currentDateRange.end ? ` to ${currentDateRange.end}` : ''}`;

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white">
      {/* HEADER WITH BACK BUTTON */}
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK
        </button>
        
        <h1 className="text-3xl font-bold text-black">ASSET GROUP-X</h1>
        <p className="text-gray-700 mt-2">Monitoring transaksi deposit & withdrawal</p>
        <p className="text-sm text-blue-600 mt-1">Date Range: {displayDateRange}</p>
      </div>

      {/* FILTER - ENHANCED WITH CUSTOM DATE */}
      <div className="mb-8 p-4 border border-gray-300 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-bold text-black mb-2 block">FILTER DATE RANGE:</span>
            
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setDateFilter('yesterday')}
                className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                Kemarin
              </button>
              <button
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                7 Hari
              </button>
              <button
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                30 Hari
              </button>
              <button
                onClick={() => setDateFilter('3month')}
                className={`px-3 py-1.5 rounded text-sm ${dateFilter === '3month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                3 Bulan
              </button>
              <button
                onClick={() => setDateFilter('6month')}
                className={`px-3 py-1.5 rounded text-sm ${dateFilter === '6month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                6 Bulan
              </button>
              <button
                onClick={() => setDateFilter('year')}
                className={`px-3 py-1.5 rounded text-sm ${dateFilter === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
              >
                1 Tahun
              </button>
            </div>
            
            {/* Custom Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-3 border-t border-gray-200">
              <span className="text-gray-700 font-medium">Custom Range:</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  className="border border-gray-400 rounded px-3 py-1.5 text-black bg-white"
                  placeholder="Start date"
                />
                <span className="text-gray-700">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setDateFilter('custom');
                  }}
                  className="border border-gray-400 rounded px-3 py-1.5 text-black bg-white"
                  placeholder="End date"
                />
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setCustomStartDate(today);
                    setCustomEndDate(today);
                    setDateFilter('custom');
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-black rounded text-sm hover:bg-gray-300"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{assets.length} ASSETS</div>
            <p className="text-sm text-gray-600">in GROUP-X</p>
          </div>
        </div>
      </div>

      {/* 3 STATS CARDS - BLACK, RED, BLUE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* APPROVED - BLACK */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-4">APPROVED</h3>
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="text-gray-700">Deposit</p>
              <p className="text-xl font-bold text-black">{formatIDR(stats.deposit.approved)}</p>
              <p className="text-sm text-gray-600">
                {transactions.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'APPROVED').length} forms
              </p>
            </div>
            <div>
              <p className="text-gray-700">Withdrawal</p>
              <p className="text-xl font-bold text-black">{formatIDR(stats.withdrawal.approved)}</p>
              <p className="text-sm text-gray-600">
                {transactions.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'APPROVED').length} forms
              </p>
            </div>
          </div>
        </div>

        {/* REJECTED - RED */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-red-600 mb-4">REJECTED</h3>
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="text-gray-700">Deposit</p>
              <p className="text-xl font-bold text-red-600">{formatIDR(stats.deposit.rejected)}</p>
              <p className="text-sm text-gray-600">
                {transactions.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'REJECTED').length} forms
              </p>
            </div>
            <div>
              <p className="text-gray-700">Withdrawal</p>
              <p className="text-xl font-bold text-red-600">{formatIDR(stats.withdrawal.rejected)}</p>
              <p className="text-sm text-gray-600">
                {transactions.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'REJECTED').length} forms
              </p>
            </div>
          </div>
        </div>

        {/* FAILED - BLUE */}
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-blue-600 mb-4">FAILED</h3>
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="text-gray-700">Deposit</p>
              <p className="text-xl font-bold text-blue-600">{formatIDR(stats.deposit.failed)}</p>
              <p className="text-sm text-gray-600">
                {transactions.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'FAILED').length} forms
              </p>
            </div>
            <div>
              <p className="text-gray-700">Withdrawal</p>
              <p className="text-xl font-bold text-blue-600">{formatIDR(stats.withdrawal.failed)}</p>
              <p className="text-sm text-gray-600">
                {transactions.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'FAILED').length} forms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ADD BUTTON - BLUE */}
      <div className="mb-6">
        <Link
          href="/assets/add"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded"
        >
          <span className="text-xl">+</span>
          TAMBAH ASSET BARU
        </Link>
      </div>

      {/* ASSETS LIST */}
      <div className="space-y-6">
        {assets.map(asset => {
          const assetTrans = transactions.filter(t => t.asset_id === asset.id);
          const total = assetTrans.length;
          
          const assetStats = {
            deposit: { approved: 0, rejected: 0, failed: 0 },
            withdrawal: { approved: 0, rejected: 0, failed: 0 }
          };

          assetTrans.forEach(trans => {
            const type = trans.transaction_type.toLowerCase();
            const status = trans.transaction_status.toLowerCase();
            if (assetStats[type] && assetStats[type][status] !== undefined) {
              assetStats[type][status] += trans.amount;
            }
          });

          return (
            <div key={asset.id} className="border border-gray-300 rounded-lg overflow-hidden">
              {/* ASSET HEADER - BLACK */}
              <div className="bg-gray-100 px-6 py-4 border-b border-gray-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-black">
                      {asset.asset_name}
                      {asset.wlb_code && <span className="ml-2 text-blue-600">({asset.wlb_code})</span>}
                    </h3>
                    <p className="text-gray-700">Code: {asset.asset_code}</p>
                  </div>
                  <span className="px-3 py-1 bg-black text-white text-sm font-bold rounded">
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* ASSET STATS - 3 COLUMNS */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* APPROVED COLUMN */}
                  <div>
                    <h4 className="font-bold text-black mb-3 text-lg border-b pb-2">APPROVED</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-700 font-medium">Deposit</p>
                        <p className="text-2xl font-bold text-black">{formatIDR(assetStats.deposit.approved)}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{assetTrans.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'APPROVED').length} forms</span>
                          <span>{total > 0 ? ((assetTrans.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'APPROVED').length / total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">Withdrawal</p>
                        <p className="text-2xl font-bold text-black">{formatIDR(assetStats.withdrawal.approved)}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{assetTrans.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'APPROVED').length} forms</span>
                          <span>{total > 0 ? ((assetTrans.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'APPROVED').length / total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REJECTED COLUMN */}
                  <div>
                    <h4 className="font-bold text-red-600 mb-3 text-lg border-b pb-2">REJECTED</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-700 font-medium">Deposit</p>
                        <p className="text-2xl font-bold text-red-600">{formatIDR(assetStats.deposit.rejected)}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{assetTrans.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'REJECTED').length} forms</span>
                          <span>{total > 0 ? ((assetTrans.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'REJECTED').length / total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">Withdrawal</p>
                        <p className="text-2xl font-bold text-red-600">{formatIDR(assetStats.withdrawal.rejected)}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{assetTrans.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'REJECTED').length} forms</span>
                          <span>{total > 0 ? ((assetTrans.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'REJECTED').length / total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FAILED COLUMN */}
                  <div>
                    <h4 className="font-bold text-blue-600 mb-3 text-lg border-b pb-2">FAILED</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-700 font-medium">Deposit</p>
                        <p className="text-2xl font-bold text-blue-600">{formatIDR(assetStats.deposit.failed)}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{assetTrans.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'FAILED').length} forms</span>
                          <span>{total > 0 ? ((assetTrans.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'FAILED').length / total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">Withdrawal</p>
                        <p className="text-2xl font-bold text-blue-600">{formatIDR(assetStats.withdrawal.failed)}</p>
                        <div className="flex justify-between text-sm text-gray-600 mt-1">
                          <span>{assetTrans.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'FAILED').length} forms</span>
                          <span>{total > 0 ? ((assetTrans.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'FAILED').length / total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIEW DETAILS LINK */}
                <div className="mt-6 pt-6 border-t border-gray-300 text-right">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-bold"
                  >
                    LIHAT DETAIL →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {assets.length === 0 && (
        <div className="border border-gray-300 rounded-lg p-12 text-center">
          <div className="w-16 h-16 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚚</span>
          </div>
          <h3 className="text-xl font-bold text-black mb-2">BELUM ADA ASSET</h3>
          <p className="text-gray-700 mb-6">Tambahkan asset pertama Anda</p>
          <Link
            href="/assets/add"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded"
          >
            <span className="text-xl">+</span>
            TAMBAH ASSET PERTAMA
          </Link>
        </div>
      )}
    </div>
  );
}