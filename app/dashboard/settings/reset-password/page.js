'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Form states
  const [panelId, setPanelId] = useState('');
  const [userData, setUserData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Debug: cek struktur tabel users
  useEffect(() => {
    const checkTableStructure = async () => {
      try {
        // Ambil 1 row untuk lihat struktur
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(1);

        if (error) {
          console.error('Error checking table:', error);
        } else {
          console.log('📊 Table structure - column names:', data && data[0] ? Object.keys(data[0]) : 'No data');
          console.log('📊 Sample data:', data);
        }
      } catch (err) {
        console.error('Check error:', err);
      }
    };

    if (isAdmin) {
      checkTableStructure();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
        <Link href="/dashboard/settings" className="text-[#FFD700] mb-4 inline-block">
          ← BACK TO SETTINGS
        </Link>
        <div className="text-center py-20 text-red-400 text-xl font-semibold bg-[#1A2F4A] rounded-lg border border-red-500/30 p-8">
          ⚠️ AKSES DITOLAK
          <p className="text-sm text-[#A7D8FF] mt-2">Halaman ini hanya untuk Administrator</p>
        </div>
      </div>
    );
  }

  // Cari user berdasarkan PANEL ID
  const handleSearchUser = async () => {
    if (!panelId.trim()) {
      setMessage({ type: 'error', text: 'Masukkan PANEL ID' });
      return;
    }

    setSearchLoading(true);
    setMessage({ type: '', text: '' });
    setUserData(null);

    try {
      console.log('🔍 Searching for panel_id:', panelId.trim());
      
      // Coba cari dengan berbagai kemungkinan nama kolom
      // Pertama: coba cari semua users dulu
      const { data: allUsers, error: allError } = await supabase
        .from('users')
        .select('*')
        .limit(10);

      if (allError) {
        console.error('Error fetching all users:', allError);
      } else {
        console.log('📊 All users (first 10):', allUsers);
        
        // Cari manual di JavaScript berdasarkan panel_id
        const foundUser = allUsers?.find(u => 
          u.panel_id === panelId.trim() || 
          u.panelid === panelId.trim() || 
          u.panelId === panelId.trim() ||
          u.id === panelId.trim()
        );

        if (foundUser) {
          console.log('✅ User found manually:', foundUser);
          setUserData(foundUser);
          setMessage({ type: 'success', text: '✅ User ditemukan!' });
          setSearchLoading(false);
          return;
        }
      }

      // Coba dengan query yang lebih fleksibel
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`panel_id.eq.${panelId.trim()},panelid.eq.${panelId.trim()},id.eq.${panelId.trim()}`)
        .maybeSingle();

      if (error) {
        console.error('Supabase query error:', error);
        
        // Coba query simple tanpa filter dulu
        const { data: simpleData, error: simpleError } = await supabase
          .from('users')
          .select('*')
          .limit(5);

        if (simpleError) {
          throw simpleError;
        }

        console.log('📊 Sample users:', simpleData);
        setMessage({ 
          type: 'error', 
          text: `Error query. Cek console untuk sample data. Panel ID yang dicari: ${panelId.trim()}` 
        });
        return;
      }

      console.log('📊 Query result:', data);

      if (data) {
        setUserData(data);
        setMessage({ type: 'success', text: '✅ User ditemukan!' });
      } else {
        setMessage({ type: 'error', text: `❌ User dengan PANEL ID "${panelId.trim()}" tidak ditemukan` });
      }
    } catch (error) {
      console.error('Search error:', error);
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat mencari user: ' + error.message });
    } finally {
      setSearchLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!userData) {
      setMessage({ type: 'error', text: 'Cari user terlebih dahulu' });
      return;
    }

    if (userData.role?.toLowerCase() === 'admin') {
      setMessage({ type: 'error', text: 'Tidak bisa reset password untuk Admin' });
      return;
    }

    if (!newPassword) {
      setMessage({ type: 'error', text: 'Masukkan password baru' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password minimal 6 karakter' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Password tidak cocok' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔄 Resetting password for user:', userData.id);

      // Update password di tabel users
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: newPassword,
          updated_at: new Date().toISOString(),
          updated_by: user?.email 
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      setMessage({ 
        type: 'success', 
        text: `✅ Password untuk ${userData.full_name || userData.email || userData.panel_id || 'user'} berhasil direset!` 
      });

      // Reset form
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.error('Reset password error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Gagal mereset password: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear user data
  const handleClear = () => {
    setUserData(null);
    setPanelId('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      <Link 
        href="/dashboard/settings" 
        className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 mb-6 text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        BACK TO SETTINGS
      </Link>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#FFD700] mb-2">🔑 Reset Password Staff</h1>
        <p className="text-[#A7D8FF] mb-8">Admin dapat mereset password staff yang lupa</p>

        {/* CARD UTAMA */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          
          {/* SEARCH USER SECTION */}
          <div className="mb-6 pb-6 border-b border-[#FFD700]/20">
            <h2 className="text-lg font-semibold text-[#FFD700] mb-4">🔍 Cari User</h2>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={panelId}
                onChange={(e) => setPanelId(e.target.value)}
                placeholder="Masukkan PANEL ID (contoh: zakiyxops)"
                className="flex-1 bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white placeholder-[#A7D8FF]/50 focus:outline-none focus:border-[#FFD700]"
                disabled={userData !== null}
              />
              
              {!userData ? (
                <button
                  onClick={handleSearchUser}
                  disabled={searchLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors min-w-[100px] justify-center"
                >
                  {searchLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </>
                  ) : 'Cari'}
                </button>
              ) : (
                <button
                  onClick={handleClear}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Cari Ulang
                </button>
              )}
            </div>

            {/* DEBUG INFO - BISA DIHAPUS NANTI */}
            <div className="mt-4 p-3 bg-[#0B1A33] rounded-lg border border-yellow-500/30 text-xs text-[#A7D8FF]">
              <p className="font-bold text-yellow-400 mb-1">🔧 DEBUG:</p>
              <p>Cek console browser (F12) untuk melihat struktur tabel dan sample data</p>
            </div>
          </div>

          {/* USER INFO SECTION */}
          {userData && (
            <div className="mb-6 pb-6 border-b border-[#FFD700]/20">
              <h2 className="text-lg font-semibold text-[#FFD700] mb-4">👤 Data User</h2>
              
              <div className="bg-[#0B1A33] rounded-lg p-4 space-y-3">
                {Object.entries(userData).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-[#FFD700]/10 pb-2 last:border-0">
                    <span className="text-[#A7D8FF] text-sm">{key}:</span>
                    <span className="text-white text-sm font-mono">
                      {value === null ? '-' : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RESET PASSWORD FORM */}
          {userData && userData.role?.toLowerCase() !== 'admin' && (
            <form onSubmit={handleResetPassword}>
              <h2 className="text-lg font-semibold text-[#FFD700] mb-4">🔐 Reset Password</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[#A7D8FF] text-sm mb-2">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white placeholder-[#A7D8FF]/50 focus:outline-none focus:border-[#FFD700]"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-[#A7D8FF] text-sm mb-2">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-3 text-white placeholder-[#A7D8FF]/50 focus:outline-none focus:border-[#FFD700]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors mt-4"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Mereset...</span>
                    </>
                  ) : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          {/* MESSAGE NOTIFICATION */}
          {message.text && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}