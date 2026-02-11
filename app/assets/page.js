// app/assets/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Format IDR
const formatIDR = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Helper untuk date range
const getDateRange = (filter) => {
  const today = new Date();
  const start = new Date();
  
  switch(filter) {
    case 'month':
      start.setMonth(today.getMonth() - 1);
      break;
    case '6month':
      start.setMonth(today.getMonth() - 6);
      break;
    case 'year':
      start.setFullYear(today.getFullYear() - 1);
      break;
    default: // 'today' atau custom
      return {
        start: today.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
  }
  
  return {
    start: start.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  };
};

export default function AssetsPage() {
  const [assets, setAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

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
      let dateRange;
      if (dateFilter === 'custom' && customStartDate && customEndDate) {
        dateRange = { start: customStartDate, end: customEndDate };
      } else {
        dateRange = getDateRange(dateFilter);
      }

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
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics for an asset
  const calculateAssetStats = (assetId) => {
    const assetTrans = transactions.filter(t => t.asset_id === assetId);
    const totalTrans = assetTrans.length;
    
    const stats = {
      deposit: { approved: 0, rejected: 0, failed: 0 },
      withdrawal: { approved: 0, rejected: 0, failed: 0 }
    };

    // Calculate amounts
    assetTrans.forEach(trans => {
      const type = trans.transaction_type.toLowerCase(); // 'deposit' or 'withdrawal'
      const status = trans.transaction_status.toLowerCase(); // 'approved', 'rejected', 'failed'
      
      if (stats[type] && stats[type][status] !== undefined) {
        stats[type][status] += trans.amount;
      }
    });

    // Count forms
    const countForms = (type, status) => {
      return assetTrans.filter(t => 
        t.transaction_type === type.toUpperCase() && 
        t.transaction_status === status.toUpperCase()
      ).length;
    };

    return {
      totalForms: totalTrans,
      deposit: {
        approved: {
          forms: countForms('DEPOSIT', 'APPROVED'),
          amount: stats.deposit.approved,
          percentage: totalTrans > 0 ? (countForms('DEPOSIT', 'APPROVED') / totalTrans * 100).toFixed(1) : 0
        },
        rejected: {
          forms: countForms('DEPOSIT', 'REJECTED'),
          amount: stats.deposit.rejected,
          percentage: totalTrans > 0 ? (countForms('DEPOSIT', 'REJECTED') / totalTrans * 100).toFixed(1) : 0
        },
        failed: {
          forms: countForms('DEPOSIT', 'FAILED'),
          amount: stats.deposit.failed,
          percentage: totalTrans > 0 ? (countForms('DEPOSIT', 'FAILED') / totalTrans * 100).toFixed(1) : 0
        }
      },
      withdrawal: {
        approved: {
          forms: countForms('WITHDRAWAL', 'APPROVED'),
          amount: stats.withdrawal.approved,
          percentage: totalTrans > 0 ? (countForms('WITHDRAWAL', 'APPROVED') / totalTrans * 100).toFixed(1) : 0
        },
        rejected: {
          forms: countForms('WITHDRAWAL', 'REJECTED'),
          amount: stats.withdrawal.rejected,
          percentage: totalTrans > 0 ? (countForms('WITHDRAWAL', 'REJECTED') / totalTrans * 100).toFixed(1) : 0
        },
        failed: {
          forms: countForms('WITHDRAWAL', 'FAILED'),
          amount: stats.withdrawal.failed,
          percentage: totalTrans > 0 ? (countForms('WITHDRAWAL', 'FAILED') / totalTrans * 100).toFixed(1) : 0
        }
      }
    };
  };

  // Calculate overall statistics
  const calculateOverallStats = () => {
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

  const overallStats = calculateOverallStats();

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading asset data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Asset Group-X</h1>
        <p className="text-gray-600 mt-2">Monitoring semua transaksi deposit dan withdrawal</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Filter Tanggal</h2>
            <div className="flex flex-wrap gap-2">
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border rounded-lg px-4 py-2"
              >
                <option value="today">Hari Ini</option>
                <option value="month">1 Bulan Terakhir</option>
                <option value="6month">6 Bulan Terakhir</option>
                <option value="year">1 Tahun Terakhir</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === 'custom' && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                  />
                  <span className="self-center">s/d</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border rounded-lg px-4 py-2"
                  />
                  <button
                    onClick={fetchData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {assets.length} Assets
            </div>
            <p className="text-gray-600">Total asset dalam GROUP-X</p>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* APPROVED */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-green-700 mb-4">TOTAL APPROVED</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Deposit</p>
              <p className="text-2xl font-bold">{formatIDR(overallStats.deposit.approved)}</p>
              <p className="text-sm text-gray-500">
                {transactions.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'APPROVED').length} forms
              </p>
            </div>
            <div>
              <p className="text-gray-600">Withdrawal</p>
              <p className="text-2xl font-bold">{formatIDR(overallStats.withdrawal.approved)}</p>
              <p className="text-sm text-gray-500">
                {transactions.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'APPROVED').length} forms
              </p>
            </div>
          </div>
        </div>

        {/* REJECTED */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-red-700 mb-4">TOTAL REJECTED</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Deposit</p>
              <p className="text-2xl font-bold">{formatIDR(overallStats.deposit.rejected)}</p>
              <p className="text-sm text-gray-500">
                {transactions.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'REJECTED').length} forms
              </p>
            </div>
            <div>
              <p className="text-gray-600">Withdrawal</p>
              <p className="text-2xl font-bold">{formatIDR(overallStats.withdrawal.rejected)}</p>
              <p className="text-sm text-gray-500">
                {transactions.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'REJECTED').length} forms
              </p>
            </div>
          </div>
        </div>

        {/* FAILED */}
        <div className="bg-white rounded-xl shadow p-6 border-l-4 border-orange-500">
          <h3 className="text-lg font-bold text-orange-700 mb-4">TOTAL FAILED</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600">Deposit</p>
              <p className="text-2xl font-bold">{formatIDR(overallStats.deposit.failed)}</p>
              <p className="text-sm text-gray-500">
                {transactions.filter(t => t.transaction_type === 'DEPOSIT' && t.transaction_status === 'FAILED').length} forms
              </p>
            </div>
            <div>
              <p className="text-gray-600">Withdrawal</p>
              <p className="text-2xl font-bold">{formatIDR(overallStats.withdrawal.failed)}</p>
              <p className="text-sm text-gray-500">
                {transactions.filter(t => t.transaction_type === 'WITHDRAWAL' && t.transaction_status === 'FAILED').length} forms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Asset Button */}
      <div className="mb-6">
        <Link
          href="/assets/add"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Asset Baru
        </Link>
      </div>

      {/* Assets List */}
      <div className="space-y-6">
        {assets.map(asset => {
          const stats = calculateAssetStats(asset.id);
          
          return (
            <div key={asset.id} className="bg-white rounded-xl shadow overflow-hidden">
              {/* Asset Header */}
              <div className="bg-gray-50 px-6 py-4 border-b">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {asset.asset_name} 
                      {asset.wlb_code && <span className="ml-2 text-blue-600">({asset.wlb_code})</span>}
                    </h3>
                    <p className="text-gray-600">Asset Code: {asset.asset_code}</p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Asset Statistics */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* APPROVED */}
                  <div className="border rounded-lg p-4 border-green-200 bg-green-50">
                    <h4 className="font-bold text-green-700 mb-3">APPROVED</h4>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 font-medium">Deposit</p>
                      <p className="text-lg font-bold">{formatIDR(stats.deposit.approved.amount)}</p>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{stats.deposit.approved.forms} forms</span>
                        <span>{stats.deposit.approved.percentage}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-700 font-medium">Withdrawal</p>
                      <p className="text-lg font-bold">{formatIDR(stats.withdrawal.approved.amount)}</p>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{stats.withdrawal.approved.forms} forms</span>
                        <span>{stats.withdrawal.approved.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* REJECTED */}
                  <div className="border rounded-lg p-4 border-red-200 bg-red-50">
                    <h4 className="font-bold text-red-700 mb-3">REJECTED</h4>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 font-medium">Deposit</p>
                      <p className="text-lg font-bold">{formatIDR(stats.deposit.rejected.amount)}</p>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{stats.deposit.rejected.forms} forms</span>
                        <span>{stats.deposit.rejected.percentage}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-700 font-medium">Withdrawal</p>
                      <p className="text-lg font-bold">{formatIDR(stats.withdrawal.rejected.amount)}</p>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{stats.withdrawal.rejected.forms} forms</span>
                        <span>{stats.withdrawal.rejected.percentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* FAILED */}
                  <div className="border rounded-lg p-4 border-orange-200 bg-orange-50">
                    <h4 className="font-bold text-orange-700 mb-3">FAILED</h4>
                    
                    <div className="mb-4">
                      <p className="text-gray-700 font-medium">Deposit</p>
                      <p className="text-lg font-bold">{formatIDR(stats.deposit.failed.amount)}</p>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{stats.deposit.failed.forms} forms</span>
                        <span>{stats.deposit.failed.percentage}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-700 font-medium">Withdrawal</p>
                      <p className="text-lg font-bold">{formatIDR(stats.withdrawal.failed.amount)}</p>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>{stats.withdrawal.failed.forms} forms</span>
                        <span>{stats.withdrawal.failed.percentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Details Button */}
                <div className="mt-6 text-right">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Lihat Detail Transaksi
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Belum ada asset</h3>
          <p className="text-gray-600 mb-6">Tambahkan asset pertama Anda untuk mulai melacak transaksi</p>
          <Link
            href="/assets/add"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Asset Pertama
          </Link>
        </div>
      )}
    </div>
  );
}