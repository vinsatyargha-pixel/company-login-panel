'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DataRawPage() {
  const { isAdmin } = useAuth();

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
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
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

        {/* 🆕 MENU WINLOSE DATA RAW - BARU! */}
        <Link href="/dashboard/data-raw/winlose" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <h2 className="text-xl font-bold text-pink-400">Winlose Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Win/Lose Report</p>
          <span className="inline-block mt-2 text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">New</span>
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

      {/* STATS ROW - OPSIONAL */}
      <div className="mt-6 grid grid-cols-5 gap-4 text-xs text-[#A7D8FF]">
        <div className="bg-[#1A2F4A]/30 p-2 rounded text-center">CS: 5 files</div>
        <div className="bg-[#1A2F4A]/30 p-2 rounded text-center">DP: 3 files</div>
        <div className="bg-[#1A2F4A]/30 p-2 rounded text-center">WD: 4 files</div>
        <div className="bg-[#1A2F4A]/30 p-2 rounded text-center">Adj: 2 files</div>
        <div className="bg-[#1A2F4A]/30 p-2 rounded text-center">Winlose: 0 files</div>
      </div>
    </div>
  );
}