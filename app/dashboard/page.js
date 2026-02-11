// app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import QuickLinks from '@/components/QuickLinks';
import LogoutButton from '@/components/LogoutButton';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    activeOfficers: 0,
    // Tambah data lain jika perlu
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Total Assets di GROUP-X
      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact' });
      
      // 2. Active Officers (REGULAR + TRAINING)
      const { count: activeOfficers } = await supabase
        .from('officers')
        .select('*', { count: 'exact' })
        .in('status', ['REGULAR', 'TRAINING']);
      
      setDashboardData({
        totalAssets: totalAssets || 0,
        activeOfficers: activeOfficers || 0
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GROUP-X Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
        </div>
        <LogoutButton />
      </header>

      {/* 4 MAIN MENU CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 1. Asset Group-X */}
        <DashboardCard
          title="Asset Group-X"
          value={`${dashboardData.totalAssets} Asset${dashboardData.totalAssets !== 1 ? 's' : ''}`}
          change={12.5}
          trend="up"
          icon="🚚"
          color="blue"
          href="/assets" // LINK ke halaman Asset Group-X
        />
        
        {/* 2. Active Officers */}
        <DashboardCard
        title="Active Officers"
        value={`${activeOfficersCount} Officers`}
        change={2.1}
        trend="up"
        icon="👤"
        color="green"
        href="/officers/active"
        />
        
        {/* 3. Schedule Officers */}
        <DashboardCard
          title="Schedule Officers"
          value="Calendar"
          change={0.5}
          trend="up"
          icon="📅"
          color="purple"
          href="/schedules" // LINK ke halaman Schedule
        />
        
        {/* 4. Working Plan Officer */}
        <DashboardCard
          title="Working Plan Officer"
          value="Planner"
          change={1.2}
          trend="up"
          icon="📋"
          color="orange"
          href="/working-plans" // LINK ke halaman Working Plan
        />
      </div>

      {/* QUICK ACCESS SECTION */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Access</h2>
        <QuickLinks />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="font-medium">New transaction batch processed</p>
            <p className="text-sm text-gray-500">by System • 10 min ago</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <p className="font-medium">Tamara Halim joined GROUP-X</p>
            <p className="text-sm text-gray-500">by Admin • 2 hours ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}