// app/dashboard/data-bank/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DataBankPage() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('bank', { ascending: true });

      if (error) throw error;
      setBanks(data || []);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncStatus('syncing');
      const response = await fetch('/api/banks/sync', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus('success');
        fetchBanks();
        setTimeout(() => setSyncStatus(null), 3000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .update({ status: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBanks();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const stats = {
    total: banks.length,
    active: banks.filter(b => b.status === true).length,
    deposit: banks.filter(b => b.type === 'deposit' || b.type === 'both').length,
    withdrawal: banks.filter(b => b.type === 'withdrawal' || b.type === 'both').length
  };

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700] flex items-center gap-2">
            <span>🏦</span> Account Bank Management
          </h1>
          <p className="text-[#A7D8FF] mt-1">
            Kelola data bank dari spreadsheet dan dashboard
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg text-[#FFD700] hover:bg-[#2A3F5A] transition-all"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Sync Panel */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#FFD700]">🔄</span>
              <span className="text-white font-medium">Sinkronisasi Google Sheets</span>
            </div>
            <span className="text-xs text-[#A7D8FF]">
              Terakhir sync: {banks[0]?.last_sync_at ? new Date(banks[0].last_sync_at).toLocaleString('id-ID') : 'Belum pernah'}
            </span>
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncStatus === 'syncing'}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all
              ${syncStatus === 'syncing' 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-[#FFD700] text-[#0B1A33] hover:bg-[#FFD700]/80'
              }`}
          >
            {syncStatus === 'syncing' ? (
              <>
                <span className="animate-spin">⏳</span>
                Menyinkronkan...
              </>
            ) : (
              <>
                <span>🔄</span>
                Sync Now
              </>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {syncStatus === 'success' && (
          <div className="mt-2 text-sm text-green-400 flex items-center gap-2">
            <span>✅</span> Sinkronisasi berhasil!
          </div>
        )}
        {syncStatus === 'error' && (
          <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
            <span>❌</span> Gagal sync. Coba lagi.
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Total Bank</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Bank Aktif</div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Deposit Methods</div>
          <div className="text-2xl font-bold text-blue-400">{stats.deposit}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Withdrawal Methods</div>
          <div className="text-2xl font-bold text-purple-400">{stats.withdrawal}</div>
        </div>
      </div>

      {/* Tabel Bank */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
              <tr>
                <th className="text-left py-3 px-4 text-[#FFD700]">Status</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Bank</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Account Name</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Account Number</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Type</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#A7D8FF]">
                    Loading data bank...
                  </td>
                </tr>
              ) : banks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-[#A7D8FF]">
                    Belum ada data bank. Klik Sync Now untuk mengambil dari spreadsheet.
                  </td>
                </tr>
              ) : (
                banks.map((bank) => (
                  <tr key={bank.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${bank.status ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${bank.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {bank.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">{bank.bank}</td>
                    <td className="py-3 px-4 text-white">{bank.account_name || '-'}</td>
                    <td className="py-3 px-4 text-white font-mono">{bank.account_number || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="text-[#A7D8FF]">
                        {bank.type === 'deposit' && 'Deposit'}
                        {bank.type === 'withdrawal' && 'Withdrawal'}
                        {bank.type === 'both' && 'Both'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleStatusToggle(bank.id, bank.status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          bank.status 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                      >
                        Toggle {bank.status ? 'OFF' : 'ON'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}