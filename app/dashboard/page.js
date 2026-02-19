'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import QuickLinks from '@/components/QuickLinks';
import LogoutButton from '@/components/LogoutButton';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    activeOfficers: 0,
  });

  const { user, userJobRole, isAdmin } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

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
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
        <p className="mt-4 text-[#FFD700]">Loading dashboard data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700]">GROUP-X Dashboard</h1>
          <p className="text-[#A7D8FF] mt-2">Welcome back! Here's your overview for today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-[#0B1A33] rounded-lg shadow-lg border border-[#FFD700]/30 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user?.email || 'Loading...'}</div>
              <div className="text-xs text-[#A7D8FF]">
                {isAdmin ? 'Admin' : userJobRole || 'Staff'}
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="text-xs text-[#FFD700] hover:text-[#FFD700]/80 font-medium mt-1 flex items-center gap-1"
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

      {/* ROYAL GOLD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Asset Group-X"
          value={`${dashboardData.totalAssets} Asset${dashboardData.totalAssets !== 1 ? 's' : ''}`}
          icon="💎"
          color="gold"
          href="/dashboard/assets"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
        <DashboardCard
          title="Active Officers"
          value={`${dashboardData.activeOfficers} Officer${dashboardData.activeOfficers !== 1 ? 's' : ''}`}
          icon="👤"
          color="gold"
          href="/dashboard/officers/active"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
        <DashboardCard
          title="Schedule Officers"
          value="Calendar"
          icon="📅"
          color="gold"
          href="/dashboard/schedule"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
        <DashboardCard
        title="Financial Summary"
        value="Management"  {/* Teks "Management" biar beda sendiri */}
        icon="💰"           {/* Icon uang */}
        color="gold"
        href="/dashboard/financial"
        className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />

      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">Quick Access</h2>
        <QuickLinks />
      </div>

      <div className="bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="border-l-4 border-[#32CD32] pl-4 py-2">
            <p className="font-medium text-white">New transaction batch processed</p>
            <p className="text-sm text-[#A7D8FF]">by System • 10 min ago</p>
          </div>
          <div className="border-l-4 border-[#FFD700] pl-4 py-2">
            <p className="font-medium text-white">Tamara Halim joined GROUP-X</p>
            <p className="text-sm text-[#A7D8FF]">by Admin • 2 hours ago</p>
          </div>
        </div>
      </div>

      {showResetModal && (
        <ResetPasswordModal
          user={user}
          onClose={() => setShowResetModal(false)}
          onSuccess={() => {
            setShowResetModal(false);
          }}
        />
      )}
    </div>
  );
}