'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function FinancialHomePage() {
  const { user } = useAuth();

  const menuItems = [
    {
      title: 'Meal Allowance',
      description: 'Uang Makan Officer',
      icon: '🍲',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-500',
      href: '/dashboard/financial/meal-allowance',
      count: 'February 2026'
    },
    {
      title: 'Laundry Allowance',
      description: 'Uang Laundry Officer',
      icon: '👕',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500',
      href: '/dashboard/financial/laundry-allowance',
      count: 'Coming Soon'
    },
    {
      title: 'Salary',
      description: 'Gaji Officer',
      icon: '💰',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500',
      href: '/dashboard/financial/salary',
      count: 'Coming Soon'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      {/* Header dengan Tombol Back */}
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700]">FINANCIAL SUMMARY</h1>
          <p className="text-[#A7D8FF] mt-1">Pilih jenis perhitungan</p>
        </div>
      </div>

      {/* 3 Card Menu */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className="block group"
          >
            <div className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 hover:shadow-[0_0_30px_#FFD700] transition-all duration-500 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              
              <div className="relative z-10">
                {/* Icon besar */}
                <div className={`w-20 h-20 rounded-full ${item.iconBg} flex items-center justify-center mb-4 mx-auto`}>
                  <span className={`text-5xl ${item.iconColor}`}>{item.icon}</span>
                </div>
                
                {/* Title */}
                <h2 className="text-2xl font-bold text-[#FFD700] text-center mb-2">
                  {item.title}
                </h2>
                
                {/* Description */}
                <p className="text-[#A7D8FF] text-center mb-4">
                  {item.description}
                </p>
                
                {/* Status/Count */}
                <div className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg p-2 text-center">
                  <span className="text-white text-sm">{item.count}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info Footer */}
      <div className="mt-8 p-4 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg text-center">
        <p className="text-[#A7D8FF]">
          Pilih menu di atas untuk melihat detail perhitungan masing-masing
        </p>
      </div>
    </div>
  );
}