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
  const [username, setUsername] = useState(''); // GANTI panelId jadi username
  const [userData, setUserData] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // Cari user berdasarkan USERNAME
  // Cari user berdasarkan USERNAME (case insensitive)
const handleSearchUser = async () => {
  if (!username.trim()) {
    setMessage({ type: 'error', text: 'Masukkan USERNAME' });
    return;
  }

  setSearchLoading(true);
  setMessage({ type: '', text: '' });
  setUserData(null);

  try {
    console.log('🔍 Searching for username (case insensitive):', username.trim());
    
    // PAKE ILIKE BIAR CASE INSENSITIVE
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username.trim()) // ILIKE bukan eq
      .maybeSingle();

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    console.log('📊 Query result:', data);

    if (data) {
      setUserData(data);
      setMessage({ type: 'success', text: '✅ User ditemukan!' });
    } else {
      setMessage({ type: 'error', text: `❌ User dengan USERNAME "${username.trim()}" tidak ditemukan` });
    }
  } catch (error) {
    console.error('Search error:', error);
    setMessage({ type: 'error', text: 'Terjadi kesalahan saat mencari user' });
  } finally {
    setSearchLoading(false);
  }
};

  // Reset password via API route
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
    console.log('🔄 Resetting password for user:', userData.email);

    // PANGGIL API ROUTE
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userData.email,        // PAKAI EMAIL (lebih aman)
        newPassword: newPassword
        // atau kalo mau pake user_id:
        // userId: userData.user_id,
        // newPassword: newPassword
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // Update timestamp di tabel users (opsional)
    await supabase
      .from('users')
      .update({ 
        updated_at: new Date().toISOString(),
        updated_by: user?.email 
      })
      .eq('id', userData.id);

    setMessage({ 
      type: 'success', 
      text: `✅ Password untuk ${userData.full_name || userData.username} berhasil direset!` 
    });

    // Reset form
    setNewPassword('');
    setConfirmPassword('');
    
  } catch (error) {
    console.error('Reset password error:', error);
    setMessage({ 
      type: 'error', 
      text: error.message || 'Gagal mereset password' 
    });
  } finally {
    setLoading(false);
  }
};

  // Clear user data
  const handleClear = () => {
    setUserData(null);
    setUsername('');
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
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan USERNAME (contoh: zakiyxops)"
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

            {/* INFO KOLOM YANG DIGUNAKAN */}
            <div className="mt-4 p-3 bg-[#0B1A33] rounded-lg border border-blue-500/30 text-xs text-[#A7D8FF]">
              <p className="font-bold text-blue-400 mb-1">ℹ️ INFO:</p>
              <p>Mencari user berdasarkan kolom <span className="text-yellow-400 font-mono">username</span> (PANEL ID)</p>
            </div>
          </div>

          {/* USER INFO SECTION */}
          {userData && (
            <div className="mb-6 pb-6 border-b border-[#FFD700]/20">
              <h2 className="text-lg font-semibold text-[#FFD700] mb-4">👤 Data User</h2>
              
              <div className="bg-[#0B1A33] rounded-lg p-4 space-y-3">
                <div className="flex justify-between border-b border-[#FFD700]/10 pb-2">
                  <span className="text-[#A7D8FF]">User ID:</span>
                  <span className="text-white font-mono text-sm">{userData.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#FFD700]/10 pb-2">
                  <span className="text-[#A7D8FF]">Auth ID:</span>
                  <span className="text-white font-mono text-sm">{userData.user_id || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-[#FFD700]/10 pb-2">
                  <span className="text-[#A7D8FF]">Username:</span>
                  <span className="text-yellow-400 font-mono">{userData.username}</span>
                </div>
                <div className="flex justify-between border-b border-[#FFD700]/10 pb-2">
                  <span className="text-[#A7D8FF]">Email:</span>
                  <span className="text-white">{userData.email || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-[#FFD700]/10 pb-2">
                  <span className="text-[#A7D8FF]">Nama:</span>
                  <span className="text-white">{userData.full_name || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-[#FFD700]/10 pb-2">
                  <span className="text-[#A7D8FF]">Department:</span>
                  <span className="text-white">{userData.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A7D8FF]">Role:</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    userData.role?.toLowerCase() === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {userData.role || '-'}
                  </span>
                </div>
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