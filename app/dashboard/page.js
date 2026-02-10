// app/dashboard/page.js
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardCard from '@/components/DashboardCard';
import QuickLinks from '@/components/QuickLinks';
import LogoutButton from '@/components/LogoutButton'; // ← IMPORT LOGOUT BUTTON

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
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER DENGAN LOGOUT BUTTON */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GROUP-X Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
        </div>
        <LogoutButton /> {/* ← LOGOUT BUTTON DISINI */}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* ... isi card sama seperti sebelumnya ... */}
      </div>

      {/* ... sisa konten ... */}
    </div>
  );
}