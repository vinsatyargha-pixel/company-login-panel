'use client';

import Link from 'next/link';

export default function OfficersKPIPage() {
  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* BACK TO DASHBOARD */}
      <div className="mb-6">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[#A7D8FF] hover:text-[#FFD700] transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO DASHBOARD
        </Link>
      </div>

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#FFD700] mb-8">ANALYTICS</h1>

      {/* GRID 2 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KOLOM KIRI - ATTENDANCE OVERVIEW */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h2 className="text-xl font-bold text-[#FFD700] mb-4">Attendance Overview</h2>
          
          {/* CHART PLACEHOLDER */}
          <div className="h-64 flex items-center justify-center border border-dashed border-[#FFD700]/20 rounded-lg">
            <p className="text-[#A7D8FF]/50">Chart & Data Summary akan ditampilkan</p>
          </div>
        </div>
        
        {/* KOLOM KANAN - DIVISION OVERVIEW */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h2 className="text-xl font-bold text-[#FFD700] mb-4">Division Overview</h2>
          
          {/* CHART PLACEHOLDER */}
          <div className="h-64 flex items-center justify-center border border-dashed border-[#FFD700]/20 rounded-lg">
            <p className="text-[#A7D8FF]/50">Chart & Data Comparison akan ditampilkan</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}