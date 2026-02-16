'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import QuickLinks from '@/components/QuickLinks';
import LogoutButton from '@/components/LogoutButton';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { supabase } from '@/lib/supabase';

export default function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [officerData, setOfficerData] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    activeOfficers: 0,
  });

  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch officer data based on email
      if (user?.email) {
        const { data: officer, error: officerError } = await supabase
          .from('officers')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();

        if (!officerError && officer) {
          setOfficerData(officer);
        }
      }

      // Fetch dashboard stats
      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact' });

      const { count: activeOfficers, error: officersError } = await supabase
        .from('officers')
        .select('*', { count: 'exact' })
        .or('status.eq.TRAINING,status.eq.REGULAR,status.eq.regular,status.eq.training,status.eq.active');

      if (officersError) console.error('Officers query error:', officersError);

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

  if (loading) return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading dashboard data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-gray-50">
      {/* HEADER dengan Profile Card */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">GROUP-X Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's your overview for today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* PROFILE CARD - Email & Reset Password */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{user?.email || 'Loading...'}</div>
              <div className="text-xs text-gray-500">{officerData?.department || officerData?.role || 'Admin'}</div>
              <button
                onClick={() => setShowResetModal(true)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Reset password
              </button>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Asset Group-X"
          value={`${dashboardData.totalAssets} Asset${dashboardData.totalAssets !== 1 ? 's' : ''}`}
          change={12.5}
          trend="up"
          icon="🚚"
          color="blue"
          href="/dashboard/assets"
        />
        <DashboardCard
          title="Active Officers"
          value={`${dashboardData.activeOfficers} Officer${dashboardData.activeOfficers !== 1 ? 's' : ''}`}
          change={2.1}
          trend="up"
          icon="👤"
          color="green"
          href="/dashboard/officers/active"
        />
        <DashboardCard
          title="Schedule Officers"
          value="Calendar"
          change={0.5}
          trend="up"
          icon="📅"
          color="purple"
          href="/dashboard/schedule"
        />
        <DashboardCard
          title="Working Plan Officer"
          value="Planner"
          change={1.2}
          trend="up"
          icon="📋"
          color="orange"
          href="/dashboard/working-plans"
        />
      </div>

      {/* QUICK ACCESS */}
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

      {/* RESET PASSWORD MODAL - HANYA MUNCUL KETIKA TOMBOL DIKLIK */}
      {showResetModal && (
        <ResetPasswordModal
          user={user}
          onClose={() => setShowResetModal(false)}
          onSuccess={() => {
            setShowResetModal(false);
            // Optional: kasih notifikasi sukses
          }}
        />
      )}
    </div>
  );
}