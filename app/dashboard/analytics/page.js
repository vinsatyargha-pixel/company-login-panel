'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function AnalyticsPage() {
  const { isAdmin } = useAuth();

  const analyticsMenus = [
    {
      title: 'Attendance Overview',
      description: 'Perbulan - offday 4 hari',
      icon: '📊',
      href: '/dashboard/analytics/attendance',
      filters: ['Monthly', 'Semester'],
      stats: '24% avg',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400'
    },
    {
      title: 'Division Overview',
      description: 'Customer Service Performance',
      icon: '📈',
      href: '/dashboard/analytics/division',
      filters: ['Daily', 'Monthly', 'Semester'],
      stats: '7 metrics',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400'
    },
    {
      title: 'Deposit Performance',
      description: 'Analisis deposit',
      icon: '💰',
      href: '/dashboard/analytics/deposit',
      filters: ['Daily', 'Monthly', 'Semester'],
      stats: '4 metrics',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400'
    },
    {
      title: 'Withdrawal Performance',
      description: 'Analisis withdrawal',
      icon: '💳',
      href: '/dashboard/analytics/withdrawal',
      filters: ['Daily', 'Monthly', 'Semester'],
      stats: '4 metrics',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-400'
    }
  ];

  const settingsMenus = [
    {
      title: 'Import CS Data Raw',
      description: 'Customer Service data import',
      icon: '📥',
      href: '/dashboard/settings/import-cs',
      role: 'admin'
    },
    {
      title: 'Import DP Data Raw',
      description: 'Deposit data import',
      icon: '📥',
      href: '/dashboard/settings/import-dp',
      role: 'admin'
    },
    {
      title: 'Import WD Data Raw',
      description: 'Withdrawal data import',
      icon: '📥',
      href: '/dashboard/settings/import-wd',
      role: 'admin'
    },
    {
      title: 'Access Role Editing',
      description: 'Edit user roles & permissions',
      icon: '👥',
      href: '/dashboard/settings/roles',
      role: 'admin'
    },
    {
      title: 'Reset Password Staff',
      description: 'Reset password for staff',
      icon: '🔑',
      href: '/dashboard/settings/reset-password',
      role: 'admin'
    }
  ];

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 mb-4 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          BACK TO DASHBOARD
        </Link>
        
        <div className="flex items-center gap-3">
          <span className="text-4xl text-[#FFD700]">📈</span>
          <h1 className="text-3xl font-bold text-[#FFD700]">Analytics Performance</h1>
        </div>
        <p className="text-[#A7D8FF] mt-2">Monitor dan analisis performa tim</p>
      </div>

      {/* Analytics Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {analyticsMenus.map((menu, index) => (
          <Link key={index} href={menu.href} className="block group">
            <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6 hover:border-[#FFD700] hover:shadow-[0_0_30px_#FFD700] transition-all duration-300">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-full ${menu.bgColor} flex items-center justify-center text-4xl`}>
                  {menu.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className={`text-xl font-bold ${menu.textColor} mb-1`}>{menu.title}</h2>
                    <span className="text-xs bg-[#0B1A33] px-2 py-1 rounded-full text-[#A7D8FF] border border-[#FFD700]/30">
                      {menu.stats}
                    </span>
                  </div>
                  <p className="text-[#A7D8FF] text-sm mb-3">{menu.description}</p>
                  
                  {/* Filter Tags */}
                  <div className="flex flex-wrap gap-2">
                    {menu.filters.map((filter, i) => (
                      <span key={i} className="text-xs bg-[#0B1A33] px-2 py-1 rounded-full text-[#FFD700] border border-[#FFD700]/30">
                        {filter}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Arrow */}
                <div className="ml-auto">
                  <svg className="w-6 h-6 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Settings Section - Admin Only */}
      {isAdmin && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-[#FFD700] mb-4 drop-shadow-[0_0_8px_#FFD700]">
            <span className="mr-2">⚙️</span>
            Settings / Data Import
          </h2>
          
          <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {settingsMenus.map((menu, index) => (
                <Link key={index} href={menu.href} className="block group">
                  <div className="bg-[#0B1A33] hover:bg-[#2A3F5A] p-4 rounded-lg border border-[#FFD700]/30 transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-[#FFD700]">{menu.icon}</span>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-[#FFD700] transition-colors">
                          {menu.title}
                        </h3>
                        <p className="text-xs text-[#A7D8FF] mt-1">{menu.description}</p>
                      </div>
                    </div>
                    {menu.role === 'admin' && (
                      <div className="mt-2">
                        <span className="text-xs bg-[#FFD700]/10 text-[#FFD700] px-2 py-0.5 rounded-full">
                          Admin only
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Section (Tetap) */}
      <div className="mt-8 bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4 drop-shadow-[0_0_8px_#FFD700]">
          Recent Activity Edit Database - By Admin
        </h2>
        
        {/* Di sini nanti konten recent activity yang sudah ada */}
        <div className="text-[#A7D8FF] text-center py-8">
          Recent activity akan ditampilkan di sini
        </div>
      </div>
    </div>
  );
}