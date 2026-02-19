'use client';

import Link from 'next/link';

export default function FinancialHomePage() {
  const menuItems = [
    {
      title: 'Meal Allowance',
      description: 'Uang Makan Officer',
      icon: '🍲',
      href: '/dashboard/financial/meal-allowance',
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-500'
    },
    {
      title: 'Laundry Allowance',
      description: 'Uang Laundry Officer',
      icon: '👕',  // baju aja
      href: '/dashboard/financial/laundry-allowance',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-500'
    },
    {
      title: 'Salary',
      description: 'Gaji Officer',
      icon: '💵',  // duit kertas
      href: '/dashboard/financial/salary',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-500'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      {/* Header dengan Tombol Back */}
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-[#FFD700]">FINANCIAL SUMMARY</h1>
      </div>

      {/* MENU VERTIKAL (KEBAWAH) - ICON GEDE */}
      <div className="space-y-4">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} className="block group">
            <div className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 hover:shadow-[0_0_30px_#FFD700] transition-all duration-500 flex items-center gap-6">
              {/* Icon gede di kiri */}
              <div className={`w-24 h-24 rounded-full ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-5xl ${item.textColor}`}>{item.icon}</span>
              </div>
              
              {/* Title & description di kanan icon */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-2">{item.title}</h2>
                <p className="text-[#A7D8FF] text-lg">{item.description}</p>
              </div>
              
              {/* Arrow di kanan */}
              <div className="ml-auto">
                <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}