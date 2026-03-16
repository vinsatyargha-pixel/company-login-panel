'use client';

import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      <Link 
        href="/dashboard" 
        className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 mb-6 text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        BACK TO DASHBOARD
      </Link>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-4">📊 ANALYTICS</h1>
      
      {/* MENU LINK - 3 KOLOM SEKARANG */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ATTENDANCE OVERVIEW */}
        <Link href="/dashboard/analytics/attendance" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-blue-400">Attendance Overview</h2>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-[#A7D8FF] text-sm mt-2">Perbulan - offday 4 hari</p>
          <div className="mt-4 flex items-center text-xs text-blue-400/70">
            <span>Lihat detail →</span>
          </div>
        </Link>

        {/* DIVISION OVERVIEW */}
        <Link href="/dashboard/analytics/division" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-purple-400">Division Overview</h2>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-[#A7D8FF] text-sm mt-2">CS, Deposit, WD Performance</p>
          <div className="mt-4 flex items-center text-xs text-purple-400/70">
            <span>Lihat detail →</span>
          </div>
        </Link>

        {/* WIN/LOSE OVERVIEW - BARU! */}
        <Link href="/dashboard/analytics/winlose" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700] transition-all hover:scale-105">
          <div className="flex items-start justify-between">
            <h2 className="text-xl font-bold text-pink-400">Win/Lose Overview</h2>
            <span className="text-2xl">🎰</span>
          </div>
          <p className="text-[#A7D8FF] text-sm mt-2">Player Win/Lose, Turnover, Product Performance</p>
          <div className="mt-4 flex items-center text-xs text-pink-400/70">
            <span>Lihat detail →</span>
          </div>
        </Link>
      </div>

      {/* STATS RINGKASAN (OPSIONAL) */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A2F4A]/50 p-4 rounded-lg border border-[#FFD700]/20">
          <div className="text-sm text-[#A7D8FF]">Attendance</div>
          <div className="text-2xl font-bold text-blue-400">87%</div>
          <div className="text-xs text-green-400 mt-1">↑ 5% dari bulan lalu</div>
        </div>
        <div className="bg-[#1A2F4A]/50 p-4 rounded-lg border border-[#FFD700]/20">
          <div className="text-sm text-[#A7D8FF]">Division Performance</div>
          <div className="text-2xl font-bold text-purple-400">1,234</div>
          <div className="text-xs text-green-400 mt-1">Total Tickets</div>
        </div>
        <div className="bg-[#1A2F4A]/50 p-4 rounded-lg border border-[#FFD700]/20">
          <div className="text-sm text-[#A7D8FF]">Win/Lose</div>
          <div className="text-2xl font-bold text-pink-400">-5.75M</div>
          <div className="text-xs text-red-400 mt-1">Net Win/Lose</div>
        </div>
      </div>
    </div>
  );
}