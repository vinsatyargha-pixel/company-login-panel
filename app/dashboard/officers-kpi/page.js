'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OfficersKPILayout({ children }) {
  const [activeMenu, setActiveMenu] = useState('summary');
  
  return (
    <div className="flex min-h-screen bg-[#0B1A33]">
      {/* SIDEBAR KIRI */}
      <div className="w-80 bg-[#1A2F4A] border-r border-[#FFD700]/30 p-6">
        {/* BACK TO DASHBOARD */}
        <Link 
          href="/dashboard"
          className="flex items-center gap-2 text-[#A7D8FF] hover:text-[#FFD700] transition-colors mb-8 text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO DASHBOARD
        </Link>
        
        {/* MENU ANALYTICS */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-[#FFD700] tracking-wider mb-3">ANALYTICS</h3>
          
          {/* MENU ALL SUMMARY KPI REVIEW */}
          <button
            onClick={() => setActiveMenu('summary')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all mb-1 ${
              activeMenu === 'summary' 
                ? 'bg-[#FFD700] text-[#0B1A33] font-bold' 
                : 'text-[#A7D8FF] hover:bg-[#FFD700]/10 hover:text-white'
            }`}
          >
            <div className="text-sm font-medium">All Summary KPI Review</div>
            <div className="text-xs opacity-80 mt-1">Attendance & Division Overview</div>
          </button>
          
          {/* MENU COMPARISON REVIEW KPI */}
          <button
            onClick={() => setActiveMenu('comparison')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
              activeMenu === 'comparison' 
                ? 'bg-[#FFD700] text-[#0B1A33] font-bold' 
                : 'text-[#A7D8FF] hover:bg-[#FFD700]/10 hover:text-white'
            }`}
          >
            <div className="text-sm font-medium">Comparison Review KPI</div>
            <div className="text-xs opacity-80 mt-1">CS, Deposit, WD Performance</div>
          </button>
        </div>
        
        {/* FOOTER SIDEBAR */}
        <div className="absolute bottom-6 left-6 text-xs text-[#A7D8FF]/50">
          KPI Review v1.0
        </div>
      </div>
      
      {/* CONTENT KANAN */}
      <div className="flex-1 p-8">
        {/* HEADER - SESUAI MENU ACTIVE */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700]">
            {activeMenu === 'summary' ? 'All Summary KPI Review' : 'Comparison Review KPI'}
          </h1>
          <p className="text-[#A7D8FF] mt-2">
            {activeMenu === 'summary' 
              ? 'Attendance Overview • Perbulan - offday 4 hari' 
              : 'Division Overview • CS, Deposit, WD Performance'}
          </p>
        </div>
        
        {/* CONTENT AREA - KOSONG DULU */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6 min-h-[600px]">
          {activeMenu === 'summary' ? (
            <div className="text-center text-[#A7D8FF] py-20">
              <p className="text-2xl mb-4">📊 All Summary KPI Review</p>
              <p>Attendance & Division Overview akan ditampilkan di sini</p>
              <p className="text-sm mt-4">Perbulan - offday 4 hari</p>
            </div>
          ) : (
            <div className="text-center text-[#A7D8FF] py-20">
              <p className="text-2xl mb-4">📈 Comparison Review KPI</p>
              <p>CS, Deposit, WD Performance akan ditampilkan di sini</p>
              <p className="text-sm mt-4">Perbandingan antar officer dan divisi</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}