// app/dashboard/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/DashboardCard';
import QuickLinks from '@/components/QuickLinks';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Cek auth
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth-token='))
      ?.split('=')[1];
    
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const dashboardData = {
    totalAsset: 1250000,
    transactionVolume: 15430,
    activeOfficers: 212,
    scheduleCoverage: 94.5
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* HEADER DENGAN LOGOUT BUTTON */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GROUP-X Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
        </div>
        <LogoutButton />
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <DashboardCard
          title="Total Asset (XLY)"
          value={`$${(dashboardData.totalAsset / 1000000).toFixed(1)}M`}
          change={+12.5}
          trend="up"
          icon="💰"
          color="blue"
        />
        <DashboardCard
          title="Transaction Volume"
          value={`${(dashboardData.transactionVolume / 1000).toFixed(1)}K TX`}
          change={-3.2}
          trend="down"
          icon="📊"
          color="green"
        />
        <DashboardCard
          title="Active Officers"
          value={dashboardData.activeOfficers.toString()}
          change={+2.1}
          trend="up"
          icon="👥"
          color="purple"
        />
        <DashboardCard
          title="Schedule Coverage"
          value={`${dashboardData.scheduleCoverage}%`}
          change={+0.5}
          trend="up"
          icon="📅"
          color="orange"
        />
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Quick Access</h2>
        <QuickLinks />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { icon: '➕', text: 'New transaction batch processed', time: '10 min ago', user: 'System' },
            { icon: '👋', text: 'Tamara Halim joined GROUP-X', time: '2 hours ago', user: 'Admin' },
            { icon: '📝', text: 'Schedule updated for March 15', time: '1 day ago', user: 'Manager' },
            { icon: '✅', text: 'Monthly report generated', time: '2 days ago', user: 'System' },
            { icon: '⚠️', text: 'Alert: Low coverage on March 20', time: '3 days ago', user: 'Monitor' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <span className="text-2xl">{activity.icon}</span>
              <div className="flex-1">
                <p className="text-gray-800 font-medium">{activity.text}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">by {activity.user}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 pt-6 border-t border-gray-200 text-center">
        <p className="text-gray-500 text-sm">
          © 2025 GROUP-X Dashboard • <span className="font-medium">gerbangmagnix.vercel.app</span> • Version 3.0
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Last updated: {new Date().toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}
        </p>
      </footer>
    </div>
  );
}