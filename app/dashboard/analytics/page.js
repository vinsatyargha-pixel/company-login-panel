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
      
      {/* MENU LINK KE ATTENDANCE & DIVISION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/analytics/attendance" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-blue-400">Attendance Overview</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Perbulan - offday 4 hari</p>
        </Link>
        <Link href="/dashboard/analytics/division" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-purple-400">Division Overview</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">CS, Deposit, WD Performance</p>
        </Link>
      </div>
    </div>
  );
}