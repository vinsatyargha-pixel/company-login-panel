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
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const { user, userJobRole, isAdmin } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
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

  // ===========================================
  // FUNGSI RECENT ACTIVITY
  // ===========================================
  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      
      // Ambil 10 aktivitas terakhir dari meal allowance
      const { data, error } = await supabase
        .from('meal_allowance_snapshot')
        .select(`
          officer_name,
          kasbon,
          etc,
          etc_note,
          cuti_count,
          last_edited_by,
          last_edited_at,
          bulan
        `)
        .not('last_edited_at', 'is', null)
        .order('last_edited_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Format data
      const formattedActivities = (data || []).map(item => ({
        id: item.last_edited_at,
        officer: item.officer_name,
        bulan: item.bulan,
        timestamp: item.last_edited_at,
        changes: formatChanges(item),
        raw: item
      }));

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const formatChanges = (item) => {
    const changes = [];
    if (item.kasbon > 0) changes.push(`kasbon $${item.kasbon}`);
    if (item.cuti_count > 0) changes.push(`cuti ${item.cuti_count} hari`);
    if (item.etc !== 0) {
      changes.push(`etc ${item.etc > 0 ? '+' : ''}${item.etc}`);
    }
    if (item.etc_note && item.etc_note.trim() !== '') {
      changes.push(`"${item.etc_note}"`);
    }
    return changes;
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getActivityIcon = (changes) => {
    if (changes.some(c => c.includes('kasbon'))) return '💰';
    if (changes.some(c => c.includes('cuti'))) return '🏖️';
    if (changes.some(c => c.includes('etc'))) return '🔄';
    return '📝';
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
          title="Asset GROUP-X"
          value={`${dashboardData.totalAssets} Asset${dashboardData.totalAssets !== 1 ? 's' : ''}`}
          icon="💎"
          color="gold"
          href="/dashboard/assets"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
        
        <DashboardCard
          title="Data Officers GROUP-X"
          value={`${dashboardData.activeOfficers} Officer${dashboardData.activeOfficers !== 1 ? 's' : ''}`}
          icon={<span className="text-2xl">👨‍💼</span>}
          color="gold"
          href="/dashboard/officers/active"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
        
        <DashboardCard
          title="Schedule Officers GROUP-X"
          value="Calendar"
          icon="📅"
          color="gold"
          href="/dashboard/schedule"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
        
        <DashboardCard
          title="Financial Summary GROUP-X"
          value="Management"
          icon="💰"
          color="gold"
          href="/dashboard/financial"
          className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
        />
      </div>

      {/* Quick Access section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">Quick Access</h2>
        <QuickLinks />
      </div>

      {/* RECENT ACTIVITY - REAL DATA FROM MEAL ALLOWANCE */}
      <div className="bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#FFD700]">Recent Activity</h2>
          {activities.length > 0 && (
            <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded-full">
              {activities.length} updates
            </span>
          )}
        </div>
        
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#FFD700]/20 scrollbar-track-transparent">
          {loadingActivities ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <div key={i} className="border-l-4 border-[#FFD700]/30 pl-4 py-2 animate-pulse">
                <div className="h-4 bg-[#1A2F4A] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#1A2F4A] rounded w-1/2"></div>
              </div>
            ))
          ) : activities.length > 0 ? (
            activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className="border-l-4 border-[#FFD700] pl-4 py-2 hover:bg-[#1A2F4A]/30 transition-colors rounded-r-lg"
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getActivityIcon(activity.changes)}</span>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      <span className="text-[#FFD700]">{activity.officer}</span>
                      {activity.changes.length > 0 ? (
                        <> • {activity.changes.join(' • ')}</>
                      ) : (
                        ' • updated data'
                      )}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#A7D8FF] mt-1">
                      <span>by Admin</span>
                      <span>•</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                      <span>•</span>
                      <span className="text-xs bg-[#1A2F4A] px-2 py-0.5 rounded-full">
                        {activity.bulan}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#A7D8FF]">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Belum ada aktivitas terbaru</p>
              <p className="text-sm mt-1">Edit data Meal Allowance untuk memulai</p>
            </div>
          )}
        </div>

        {/* Footer dengan link ke halaman activity (opsional) */}
        {activities.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#FFD700]/20 text-right">
            <button 
              onClick={() => window.location.href = '/dashboard/activity-log'}
              className="text-sm text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
            >
              View all activity →
            </button>
          </div>
        )}
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