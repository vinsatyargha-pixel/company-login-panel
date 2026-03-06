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
      <h1 className="text-3xl font-bold text-[#FFD700] mb-8">KEY PERFORMANCE INDICATOR</h1>

      {/* GRID 2 KOLOM - CARD YANG BISA DI KLIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CARD KIRI - SUMMARY KPI DATA (BISA DI KLIK) */}
        <Link href="/dashboard/officers-kpi/summary-kpi-data">
          <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6 hover:border-[#FFD700] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all cursor-pointer group">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#FFD700] group-hover:text-[#FFD700]">Summary KPI data</h2>
              <svg className="w-5 h-5 text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-[#A7D8FF] text-sm mb-4">Chart & Data Summary akan ditampilkan</p>
            
            {/* CHART PLACEHOLDER */}
            <div className="h-48 flex items-center justify-center border border-dashed border-[#FFD700]/20 rounded-lg bg-[#0B1A33]/50">
              <p className="text-[#A7D8FF]/50">📊 Summary Chart</p>
            </div>
          </div>
        </Link>
        
        {/* CARD KANAN - COMPARISON PERIODE KPI (BISA DI KLIK) */}
        <Link href="/dashboard/officers-kpi/comparison-periode-kpi">
          <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6 hover:border-[#FFD700] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all cursor-pointer group">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#FFD700] group-hover:text-[#FFD700]">COMPARISON PERIODE KPI</h2>
              <svg className="w-5 h-5 text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-[#A7D8FF] text-sm mb-4">Chart & Data Comparison akan ditampilkan</p>
            
            {/* CHART PLACEHOLDER */}
            <div className="h-48 flex items-center justify-center border border-dashed border-[#FFD700]/20 rounded-lg bg-[#0B1A33]/50">
              <p className="text-[#A7D8FF]/50">📈 Comparison Chart</p>
            </div>
          </div>
        </Link>
        
      </div>

      {/* FOOTER */}
      <p className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        KPI Review • Pilih menu untuk melihat detail
      </p>
    </div>
  );
}