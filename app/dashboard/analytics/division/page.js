'use client';

import Link from 'next/link';

export default function DivisionPage() {
  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      <Link 
        href="/dashboard/analytics" 
        className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 mb-6 text-sm font-medium"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        BACK TO ANALYTICS
      </Link>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-4">📊 Division Overview</h1>
      <p className="text-[#A7D8FF]">Customer Service, Deposit & Withdrawal Performance</p>

      {/* Placeholder content */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30">
          <h2 className="text-xl font-bold text-blue-400 mb-4">Customer Service</h2>
          <div className="h-32 flex items-center justify-center text-[#A7D8FF]">
            Data CS akan ditampilkan di sini
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30">
          <h2 className="text-xl font-bold text-green-400 mb-4">Deposit</h2>
          <div className="h-32 flex items-center justify-center text-[#A7D8FF]">
            Data Deposit akan ditampilkan di sini
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30">
          <h2 className="text-xl font-bold text-orange-400 mb-4">Withdrawal</h2>
          <div className="h-32 flex items-center justify-center text-[#A7D8FF]">
            Data Withdrawal akan ditampilkan di sini
          </div>
        </div>
      </div>
    </div>
  );
}