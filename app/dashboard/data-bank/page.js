'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DataBankPage() {
  const [banks, setBanks] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      setFilteredBanks(banks);
    } else if (activeTab === 'deposit') {
      setFilteredBanks(banks.filter(b => b.type === 'deposit' || b.type === 'both'));
    } else if (activeTab === 'withdrawal') {
      setFilteredBanks(banks.filter(b => b.type === 'withdrawal' || b.type === 'both'));
    }
  }, [activeTab, banks]);

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
      setSyncResult(null);
      
      const response = await fetch('/api/banks/sync', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus('success');
        setSyncResult(result);
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

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data bank ini?')) return;
    
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBanks();
    } catch (error) {
      console.error('Error deleting bank:', error);
    }
  };

  const stats = {
    total: banks.length,
    active: banks.filter(b => b.status === true).length,
    deposit: banks.filter(b => b.type === 'deposit' || b.type === 'both').length,
    withdrawal: banks.filter(b => b.type === 'withdrawal' || b.type === 'both').length,
    depositActive: banks.filter(b => (b.type === 'deposit' || b.type === 'both') && b.status === true).length,
    withdrawalActive: banks.filter(b => (b.type === 'withdrawal' || b.type === 'both') && b.status === true).length,
    displayYes: banks.filter(b => b.display).length,
    usedYes: banks.filter(b => b.used).length
  };

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
          className="px-4 py-2 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg text-[#FFD700] hover:bg-[#2A3F5A] transition-all flex items-center gap-2"
        >
          <span>←</span> Back to Dashboard
        </Link>
      </div>

      {/* Sync Panel */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#FFD700]">🔄</span>
              <span className="text-white font-medium">Sinkronisasi Google Sheets</span>
            </div>
            <span className="text-xs bg-[#0B1A33] px-3 py-1 rounded-full text-[#A7D8FF]">
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

        {/* Sync Summary */}
        {syncResult && (
          <div className="mt-4 bg-[#0B1A33] rounded-lg border border-[#FFD700]/30 p-4">
            <h4 className="text-[#FFD700] font-medium mb-3 flex items-center gap-2">
              <span>📊</span> Sync Summary
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="bg-[#1A2F4A] p-3 rounded">
                <div className="text-[#A7D8FF] text-xs">Total Sheet</div>
                <div className="text-white font-bold text-lg">{syncResult.summary.total_from_sheet}</div>
              </div>
              <div className="bg-green-500/10 p-3 rounded border border-green-500/20">
                <div className="text-green-400 text-xs">🆕 Bank Baru</div>
                <div className="text-white font-bold text-lg">{syncResult.summary.new_banks}</div>
              </div>
              <div className="bg-blue-500/10 p-3 rounded border border-blue-500/20">
                <div className="text-blue-400 text-xs">🔄 Bank Update</div>
                <div className="text-white font-bold text-lg">{syncResult.summary.updated_banks}</div>
              </div>
              <div className="bg-gray-500/10 p-3 rounded border border-gray-500/20">
                <div className="text-gray-400 text-xs">⏺️ Tidak Berubah</div>
                <div className="text-white font-bold text-lg">{syncResult.summary.unchanged_banks}</div>
              </div>
              <div className="bg-purple-500/10 p-3 rounded border border-purple-500/20">
                <div className="text-purple-400 text-xs">✋ Manual Only</div>
                <div className="text-white font-bold text-lg">{syncResult.summary.manual_banks}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Total Bank</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Bank Aktif</div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Deposit</div>
          <div className="text-2xl font-bold text-blue-400">{stats.deposit}</div>
          <div className="text-xs text-green-400">{stats.depositActive} Aktif</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Withdrawal</div>
          <div className="text-2xl font-bold text-purple-400">{stats.withdrawal}</div>
          <div className="text-xs text-green-400">{stats.withdrawalActive} Aktif</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Display YES</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.displayYes}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Used YES</div>
          <div className="text-2xl font-bold text-orange-400">{stats.usedYes}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Source</div>
          <div className="text-sm font-bold">
            <span className="text-purple-400">📊 {banks.filter(b => b.source === 'google_sheets').length}</span>
            <span className="text-yellow-400 ml-2">✋ {banks.filter(b => b.source === 'manual').length}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-[#FFD700]/20 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'all' 
              ? 'bg-[#FFD700] text-[#0B1A33]' 
              : 'text-[#A7D8FF] hover:text-white'
          }`}
        >
          All Banks ({banks.length})
        </button>
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'deposit' 
              ? 'bg-[#FFD700] text-[#0B1A33]' 
              : 'text-[#A7D8FF] hover:text-white'
          }`}
        >
          💰 Deposit ({banks.filter(b => b.type === 'deposit' || b.type === 'both').length})
        </button>
        <button
          onClick={() => setActiveTab('withdrawal')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'withdrawal' 
              ? 'bg-[#FFD700] text-[#0B1A33]' 
              : 'text-[#A7D8FF] hover:text-white'
          }`}
        >
          💸 Withdrawal ({banks.filter(b => b.type === 'withdrawal' || b.type === 'both').length})
        </button>
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
                <th className="text-left py-3 px-4 text-[#FFD700]">Display/Used</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Source</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-[#A7D8FF]">
                    <span className="animate-spin inline-block mr-2">⏳</span>
                    Loading data bank...
                  </td>
                </tr>
              ) : filteredBanks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-[#A7D8FF]">
                    {banks.length === 0 
                      ? 'Belum ada data bank. Klik Sync Now untuk mengambil dari spreadsheet.'
                      : 'Tidak ada bank dengan filter ini.'}
                  </td>
                </tr>
              ) : (
                filteredBanks.map((bank) => (
                  <tr key={bank.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${bank.status ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${bank.status ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {bank.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">{bank.bank}</td>
                    <td className="py-3 px-4 text-white">{bank.account_name || '-'}</td>
                    <td className="py-3 px-4 text-white font-mono">{bank.account_number || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bank.type === 'deposit' ? 'bg-blue-500/20 text-blue-400' :
                        bank.type === 'withdrawal' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {bank.type === 'deposit' && 'Deposit'}
                        {bank.type === 'withdrawal' && 'Withdrawal'}
                        {bank.type === 'both' && 'Both'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {bank.display && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Display</span>
                        )}
                        {bank.used && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Used</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bank.source === 'google_sheets' 
                          ? 'bg-purple-500/20 text-purple-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {bank.source === 'google_sheets' ? '📊 Sheets' : '✋ Manual'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStatusToggle(bank.id, bank.status)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            bank.status 
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                              : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          Toggle {bank.status ? 'OFF' : 'ON'}
                        </button>
                        <button
                          onClick={() => handleDelete(bank.id)}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 text-xs text-[#A7D8FF] flex items-center justify-end gap-4">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Inactive</span>
        <span className="flex items-center gap-1">📊 Google Sheets</span>
        <span className="flex items-center gap-1">✋ Manual Input</span>
      </div>
    </div>
  );
}