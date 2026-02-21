'use client';

import Link from 'next/link';

export default function SalaryPage() {
  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white flex items-center justify-center">
      {/* Card Coming Soon */}
      <div className="text-center">
        {/* Back button di dalam card */}
        <div className="mb-8">
          <Link 
            href="/dashboard/financial" 
            className="inline-flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Financial</span>
          </Link>
        </div>

        {/* Main Coming Soon Card */}
        <div className="bg-gradient-to-br from-[#1A2F4A] to-[#0B1A33] border-4 border-[#FFD700] rounded-3xl p-12 shadow-[0_0_50px_#FFD700] max-w-2xl">
          {/* Icon Animation */}
          <div className="relative mb-8">
            <div className="text-9xl animate-bounce">💰</div>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#FFD700] rounded-full opacity-20 animate-ping"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#FFD700] rounded-full opacity-20 animate-ping delay-100"></div>
          </div>

          {/* Title */}
          <h1 className="text-6xl font-bold text-[#FFD700] mb-4 animate-pulse">
            COMING SOON
          </h1>

          {/* Subtitle */}
          <div className="space-y-2 mb-8">
            <p className="text-2xl text-[#A7D8FF]">
              Halaman Salary sedang dalam pengembangan
            </p>
            <p className="text-lg text-[#A7D8FF]/70">
              Kami akan segera hadirkan fitur pengelolaan gaji officer
            </p>
          </div>

          {/* Progress Bar (optional) */}
          <div className="w-full bg-[#0B1A33] rounded-full h-3 mb-6 border border-[#FFD700]/30">
            <div className="bg-[#FFD700] h-3 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <p className="text-sm text-[#A7D8FF] mb-8">
            Progress: 75% • Target rilis: Q2 2026
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-[#FFD700]/30">
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-bold text-[#FFD700]">Gaji Pokok</div>
              <div className="text-xs text-[#A7D8FF]">Coming soon</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🧮</div>
              <div className="text-sm font-bold text-[#FFD700]">Kalkulasi</div>
              <div className="text-xs text-[#A7D8FF]">Coming soon</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-sm font-bold text-[#FFD700]">Laporan</div>
              <div className="text-xs text-[#A7D8FF]">Coming soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}