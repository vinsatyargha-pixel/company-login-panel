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
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State untuk popup info login
  const [selectedBank, setSelectedBank] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  useEffect(() => {
    let filtered = [...banks];
    
    // Filter berdasarkan tab (all/deposit/withdrawal)
    if (activeTab === 'deposit') {
      filtered = filtered.filter(b => b.role?.toUpperCase() === 'DEPOSIT');
    } else if (activeTab === 'withdrawal') {
      filtered = filtered.filter(b => b.role?.toUpperCase() === 'WITHDRAW');
    }
    
    // Filter berdasarkan status (all/active/takedown)
    if (statusFilter === 'active') {
      filtered = filtered.filter(b => b.status === 'AKTIF');
    } else if (statusFilter === 'takedown') {
      filtered = filtered.filter(b => b.status === 'TAKEDOWN');
    }
    
    setFilteredBanks(filtered);
  }, [activeTab, statusFilter, banks]);

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
      const newStatus = currentStatus === 'AKTIF' ? 'TAKEDOWN' : 'AKTIF';
      const { error } = await supabase
        .from('bank_accounts')
        .update({ status: newStatus })
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

  const handleAccountClick = (bank) => {
    setSelectedBank(bank);
    setShowPopup(true);
  };

  const stats = {
    total: banks.length,
    active: banks.filter(b => b.status === 'AKTIF').length,
    takedown: banks.filter(b => b.status === 'TAKEDOWN').length,
    deposit: banks.filter(b => b.role?.toUpperCase() === 'DEPOSIT').length,
    withdrawal: banks.filter(b => b.role?.toUpperCase() === 'WITHDRAW').length,
    depositActive: banks.filter(b => b.role?.toUpperCase() === 'DEPOSIT' && b.status === 'AKTIF').length,
    withdrawalActive: banks.filter(b => b.role?.toUpperCase() === 'WITHDRAW' && b.status === 'AKTIF').length,
    displayYes: banks.filter(b => b.display_used === 'YES').length,
    usedYes: banks.filter(b => b.display_used === 'YES').length
  };

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700] flex items-center gap-2">
            <span>🏦</span> Account Bank Management
          </h1>
          <p className="text-[#A7D8FF] mt-1">Kelola data bank dari spreadsheet dan dashboard</p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg text-[#FFD700] hover:bg-[#2A3F5A] transition-all flex items-center gap-2">
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
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${syncStatus === 'syncing' ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#FFD700] text-[#0B1A33] hover:bg-[#FFD700]/80'}`}
          >
            {syncStatus === 'syncing' ? <><span className="animate-spin">⏳</span> Menyinkronkan...</> : <><span>🔄</span> Sync Now</>}
          </button>
        </div>
        {syncStatus === 'success' && <div className="mt-2 text-sm text-green-400 flex items-center gap-2"><span>✅</span> Sinkronisasi berhasil! {syncResult?.message}</div>}
        {syncStatus === 'error' && <div className="mt-2 text-sm text-red-400 flex items-center gap-2"><span>❌</span> Gagal sync. Coba lagi.</div>}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Total Bank</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Active</div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Takedown</div>
          <div className="text-2xl font-bold text-red-400">{stats.takedown}</div>
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
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-[#FFD700]/20 pb-2 flex-wrap">
        <button 
          onClick={() => setActiveTab('all')} 
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-[#FFD700] text-[#0B1A33]' : 'text-[#A7D8FF] hover:text-white'}`}
        >
          All Banks ({banks.length})
        </button>
        <button 
          onClick={() => setActiveTab('deposit')} 
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'deposit' ? 'bg-[#FFD700] text-[#0B1A33]' : 'text-[#A7D8FF] hover:text-white'}`}
        >
          💰 Deposit ({banks.filter(b => b.role?.toUpperCase() === 'DEPOSIT').length})
        </button>
        <button 
          onClick={() => setActiveTab('withdrawal')} 
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'withdrawal' ? 'bg-[#FFD700] text-[#0B1A33]' : 'text-[#A7D8FF] hover:text-white'}`}
        >
          💸 Withdrawal ({banks.filter(b => b.role?.toUpperCase() === 'WITHDRAW').length})
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-4 flex items-center gap-2 pb-2 flex-wrap">
        <span className="text-[#A7D8FF] text-sm mr-2">Status:</span>
        <button 
          onClick={() => setStatusFilter('all')} 
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#1A2F4A] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}
        >
          All
        </button>
        <button 
          onClick={() => setStatusFilter('active')} 
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${statusFilter === 'active' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500"></span> Active ({banks.filter(b => b.status === 'AKTIF').length})
        </button>
        <button 
          onClick={() => setStatusFilter('takedown')} 
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${statusFilter === 'takedown' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Takedown ({banks.filter(b => b.status === 'TAKEDOWN').length})
        </button>
      </div>

      {/* Tabel Bank */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
              <tr>
                <th className="text-left py-3 px-4 text-[#FFD700]">Status</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Display/Used</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Bank</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Account Name</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Account Number</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Role</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Type Bank</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Masa Aktif</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="text-center py-8 text-[#A7D8FF]"><span className="animate-spin inline-block mr-2">⏳</span>Loading data bank...</td></tr>
              ) : filteredBanks.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-[#A7D8FF]">{banks.length === 0 ? 'Belum ada data bank. Klik Sync Now untuk mengambil dari spreadsheet.' : 'Tidak ada bank dengan filter ini.'}</td></tr>
              ) : (
                filteredBanks.map((bank) => (
                  <tr key={bank.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${bank.status === 'AKTIF' ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${bank.status === 'AKTIF' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {bank.status || 'AKTIF'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {bank.display_used === 'YES' && (
                          <>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Display</span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Used</span>
                          </>
                        )}
                        {bank.display_used === 'NO' && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">No</span>
                        )}
                        {bank.display_used === 'TAKEDOWN' && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Takedown</span>
                        )}
                        {!bank.display_used && <span className="text-[#A7D8FF] text-xs">-</span>}
                      </div>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* Gambar Bank */}
                        {bank.bank?.toLowerCase().includes('bca') && (
                          <img src="/images/bca.png" alt="BCA" className="h-5 w-auto object-contain" />
                        )}
                        {bank.bank?.toLowerCase().includes('bni') && (
                          <img src="/images/bni.png" alt="BNI" className="h-5 w-auto object-contain" />
                        )}
                        {bank.bank?.toLowerCase().includes('bri') && (
                          <img src="/images/bri.png" alt="BRI" className="h-5 w-auto object-contain" />
                        )}
                        {bank.bank?.toLowerCase().includes('mandiri') && (
                          <img src="/images/mandiri.png" alt="Mandiri" className="h-5 w-auto object-contain" />
                        )}
                        <span className="text-white font-medium">{bank.bank}</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-white">{bank.account_name || '-'}</td>
                    
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleAccountClick(bank)} 
                        className="text-white font-mono hover:text-[#FFD700] transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {bank.account_number || '-'}
                      </button>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bank.role?.toUpperCase() === 'DEPOSIT' ? 'bg-blue-500/20 text-blue-400' : 
                        bank.role?.toUpperCase() === 'WITHDRAW' ? 'bg-purple-500/20 text-purple-400' : 
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {bank.role?.toUpperCase() === 'DEPOSIT' ? 'Deposit' : 
                         bank.role?.toUpperCase() === 'WITHDRAW' ? 'Withdrawal' : 
                         bank.role || 'Both'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                        {bank.type_bank || '-'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-[#A7D8FF] text-sm">{bank.masa_aktif || '-'}</td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStatusToggle(bank.id, bank.status)} 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bank.status === 'AKTIF' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {bank.status === 'AKTIF' ? '→ Takedown' : '→ Active'}
                        </button>
                        <button 
                          onClick={() => handleDelete(bank.id)} 
                          className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30" 
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

      {/* POPUP INFO LOGIN */}
      {showPopup && selectedBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] border-2 border-[#FFD700] rounded-xl p-6 max-w-2xl w-full mx-4 shadow-[0_0_50px_#FFD700] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1A2F4A] z-10 pb-2">
              <h3 className="text-xl font-bold text-[#FFD700]">🔐 Info Login {selectedBank.bank}</h3>
              <button onClick={() => setShowPopup(false)} className="text-[#A7D8FF] hover:text-white text-2xl">×</button>
            </div>
            
            <div className="bg-[#0B1A33] p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[#A7D8FF] text-xs">Bank</div><div className="text-white font-bold">{selectedBank.bank}</div></div>
                <div><div className="text-[#A7D8FF] text-xs">Account Name</div><div className="text-white font-bold">{selectedBank.account_name}</div></div>
                <div><div className="text-[#A7D8FF] text-xs">Account Number</div><div className="text-white font-mono">{selectedBank.account_number}</div></div>
                <div><div className="text-[#A7D8FF] text-xs">Role</div><div className={`px-2 py-1 inline-block rounded-full text-xs ${selectedBank.role?.toUpperCase() === 'DEPOSIT' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{selectedBank.role?.toUpperCase() === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</div></div>
              </div>
            </div>
            
            <button onClick={() => setShowPopup(false)} className="mt-6 w-full bg-[#FFD700] text-[#0B1A33] py-2 rounded-lg font-bold hover:bg-[#FFD700]/80 transition-colors">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-[#A7D8FF] flex items-center justify-end gap-4 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Takedown</span>
        <span className="flex items-center gap-1">💰 Deposit</span>
        <span className="flex items-center gap-1">💸 Withdrawal</span>
        <span className="flex items-center gap-1">📊 From Google Sheets</span>
        <span className="flex items-center gap-1">🔍 Klik No. Rekening</span>
      </div>
    </div>
  );
}