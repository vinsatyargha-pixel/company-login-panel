'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LastUpload {
  cs: string | null;
  dp: string | null;
  wd: string | null;
  adj: string | null;
  winlose: string | null;
  player: string | null;
}

export default function DataRawPage() {
  const { isAdmin } = useAuth();
  const [lastUploads, setLastUploads] = useState<LastUpload>({
    cs: null,
    dp: null,
    wd: null,
    adj: null,
    winlose: null,
    player: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLastUploadDates();
  }, []);

  const fetchLastUploadDates = async () => {
    try {
      setLoading(true);
      
      // CS Data - ambil upload_date terakhir
      const { data: csData } = await supabase
        .from('chat_uploads')
        .select('upload_date')
        .order('upload_date', { ascending: false })
        .limit(1);

      // DP Data - ambil upload_date terakhir
      const { data: dpData } = await supabase
        .from('deposit_uploads')
        .select('upload_date')
        .order('upload_date', { ascending: false })
        .limit(1);

      // WD Data - ambil upload_date terakhir
      const { data: wdData } = await supabase
        .from('withdrawal_uploads')
        .select('upload_date')
        .order('upload_date', { ascending: false })
        .limit(1);

      // Adjustment Data - ambil upload_date terakhir
      const { data: adjData } = await supabase
        .from('adjustment_uploads')
        .select('upload_date')
        .order('upload_date', { ascending: false })
        .limit(1);

      // Winlose Data - ambil max_date (tanggal data terakhir, bukan upload_date)
      const { data: winloseData } = await supabase
        .from('winlose_uploads')
        .select('max_date')
        .order('max_date', { ascending: false })
        .limit(1);

      // Player Listing - ambil max_date (tanggal registrasi terakhir, bukan upload_date)
      const { data: playerData } = await supabase
        .from('player_uploads')
        .select('max_date')
        .order('max_date', { ascending: false })
        .limit(1);

      setLastUploads({
        cs: csData?.[0]?.upload_date || null,
        dp: dpData?.[0]?.upload_date || null,
        wd: wdData?.[0]?.upload_date || null,
        adj: adjData?.[0]?.upload_date || null,
        winlose: winloseData?.[0]?.max_date || null,
        player: playerData?.[0]?.max_date || null
      });
      
    } catch (error) {
      console.error('Error fetching last upload dates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format tanggal saja, tanpa jam
  const formatDateOnly = (dateString: string | null) => {
    if (!dateString) return 'Belum ada data';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!isAdmin) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
        <Link href="/dashboard" className="text-[#FFD700] mb-4 inline-block">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-center py-20 text-red-400">Akses ditolak - Hanya untuk Admin</div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      <Link href="/dashboard" className="text-[#FFD700] mb-4 inline-block">
        ← BACK TO DASHBOARD
      </Link>
      <h1 className="text-3xl font-bold text-[#FFD700] mb-4">📥 DATA RAW</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
        <Link href="/dashboard/data-raw/cs" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-blue-400">CS Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Customer Service Data</p>
        </Link>
        
        <Link href="/dashboard/data-raw/dp" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-green-400">DP Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Deposit Data</p>
        </Link>
        
        <Link href="/dashboard/data-raw/wd" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-orange-400">WD Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Withdrawal Data</p>
        </Link>

        <Link href="/dashboard/data-raw/adj" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-purple-400">Adjustment Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Adjustment Data</p>
          <span className="inline-block mt-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">New</span>
        </Link>

        <Link href="/dashboard/data-raw/winlose" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-pink-400">Winlose Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Win/Lose Report</p>
          <span className="inline-block mt-2 text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">New</span>
        </Link>

        <Link href="/dashboard/data-raw/playerlisting" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-teal-400">Player Listing</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Player Listing Data</p>
          <span className="inline-block mt-2 text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded">New</span>
        </Link>
      </div>

      {/* INFO SECTION */}
      <div className="mt-8 bg-[#1A2F4A]/50 p-4 rounded-lg border border-[#FFD700]/20">
        <h3 className="text-[#FFD700] font-semibold mb-2">📋 Petunjuk:</h3>
        <ul className="text-[#A7D8FF] text-sm space-y-1 list-disc list-inside">
          <li>Pilih menu sesuai jenis data yang akan diupload</li>
          <li>Format file harus .xlsx, .xls, atau .csv</li>
          <li>Pastikan header sesuai dengan template masing-masing</li>
          <li>Data akan otomatis terdeteksi berdasarkan periode</li>
        </ul>
      </div>

      {/* LAST UPDATE STATS */}
      <div className="mt-6">
        <h3 className="text-[#FFD700] text-sm font-semibold mb-3">📅 Last Update</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-[#1A2F4A]/30 p-3 rounded-lg text-center">
            <div className="text-blue-400 font-medium mb-1">CS Data</div>
            <div className="text-[#A7D8FF] text-[10px]">{loading ? 'Loading...' : formatDateOnly(lastUploads.cs)}</div>
          </div>
          <div className="bg-[#1A2F4A]/30 p-3 rounded-lg text-center">
            <div className="text-green-400 font-medium mb-1">DP Data</div>
            <div className="text-[#A7D8FF] text-[10px]">{loading ? 'Loading...' : formatDateOnly(lastUploads.dp)}</div>
          </div>
          <div className="bg-[#1A2F4A]/30 p-3 rounded-lg text-center">
            <div className="text-orange-400 font-medium mb-1">WD Data</div>
            <div className="text-[#A7D8FF] text-[10px]">{loading ? 'Loading...' : formatDateOnly(lastUploads.wd)}</div>
          </div>
          <div className="bg-[#1A2F4A]/30 p-3 rounded-lg text-center">
            <div className="text-purple-400 font-medium mb-1">Adjustment</div>
            <div className="text-[#A7D8FF] text-[10px]">{loading ? 'Loading...' : formatDateOnly(lastUploads.adj)}</div>
          </div>
          <div className="bg-[#1A2F4A]/30 p-3 rounded-lg text-center">
            <div className="text-pink-400 font-medium mb-1">Winlose</div>
            <div className="text-[#A7D8FF] text-[10px]">{loading ? 'Loading...' : formatDateOnly(lastUploads.winlose)}</div>
          </div>
          <div className="bg-[#1A2F4A]/30 p-3 rounded-lg text-center">
            <div className="text-teal-400 font-medium mb-1">Player Listing</div>
            <div className="text-[#A7D8FF] text-[10px]">{loading ? 'Loading...' : formatDateOnly(lastUploads.player)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}