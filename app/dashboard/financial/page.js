'use client';

import Link from 'next/link';

export default function FinancialHomePage() {
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
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700]">FINANCIAL SUMMARY</h1>
          <p className="text-[#A7D8FF] mt-1">Pilih jenis perhitungan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} className="block group">
            <div className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 hover:shadow-[0_0_30px_#FFD700] transition-all duration-500">
              <div className={`w-20 h-20 rounded-full ${item.iconBg} flex items-center justify-center mb-4 mx-auto`}>
                <span className={`text-5xl ${item.iconColor}`}>{item.icon}</span>
              </div>
              <h2 className="text-2xl font-bold text-[#FFD700] text-center mb-2">{item.title}</h2>
              <p className="text-[#A7D8FF] text-center mb-4">{item.description}</p>
              <div className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg p-2 text-center">
                <span className="text-white text-sm">{item.count}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}