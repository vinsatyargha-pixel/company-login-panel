'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import LogoutButton from '@/components/LogoutButton';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import SpinningX from '@/components/SpinningX';

export default function DashboardContent() {
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    activeOfficers: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showActivityTooltip, setShowActivityTooltip] = useState(false);
  
  // STATE UNTUK NOTIFIKASI
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);

  // STATE UNTUK FILTER CHARTS
  const [chartFilter, setChartFilter] = useState('weekly');
  const [chartYear, setChartYear] = useState('2026');

  const { user, userJobRole, isAdmin } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
  }, []);

  // LOAD LAST READ TIMESTAMP DARI LOCALSTORAGE
  useEffect(() => {
    const saved = localStorage.getItem('lastReadActivity');
    if (saved) {
      setLastReadTimestamp(saved);
    }
  }, []);

  // CEK APAKAH ADA AKTIVITAS BARU
  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = new Date(activities[0].timestamp).getTime();
      const lastRead = lastReadTimestamp ? new Date(lastReadTimestamp).getTime() : 0;
      
      console.log('🔍 DEBUG NOTIFIKASI:');
      console.log('📌 Latest Activity:', new Date(latestActivity).toLocaleString());
      console.log('📌 Last Read:', lastReadTimestamp ? new Date(lastReadTimestamp).toLocaleString() : 'Tidak ada');
      console.log('📌 Has New:', latestActivity > lastRead);
      
      setHasNewActivity(latestActivity > lastRead);
    }
  }, [activities, lastReadTimestamp]);

  // LISTEN EVENT DARI ACTIVITY LOG
  useEffect(() => {
    const handleActivityRead = () => {
      const saved = localStorage.getItem('lastReadActivity');
      if (saved) {
        setLastReadTimestamp(saved);
      }
    };
    window.addEventListener('activityRead', handleActivityRead);
    return () => window.removeEventListener('activityRead', handleActivityRead);
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
      
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          officers!changed_by (full_name, email)
        `)
        .order('changed_at', { ascending: false, nullsFirst: false })
        .limit(20);

      if (auditError) console.error('Audit Error:', auditError);

      const auditActivities = (auditData || []).map(item => {
        let changes = [];
        let icon = '👤';
        
        if (item.action === 'UPDATE') {
          changes = formatOfficerChanges(item.old_data, item.new_data);
          icon = '✏️';
        } else if (item.action === 'DELETE') {
          changes = [`❌ Deleted officer: ${item.old_data?.full_name || 'Unknown'}`];
          icon = '❌';
        } else if (item.action === 'INSERT') {
          changes = [`➕ Added new officer: ${item.new_data?.full_name || 'Unknown'}`];
          icon = '➕';
        }

        return {
          id: `audit-${item.changed_at}-${item.old_data?.full_name || item.new_data?.full_name || 'unknown'}`,
          module: 'Officers',
          officer: item.new_data?.full_name || item.old_data?.full_name || 'Unknown',
          bulan: new Date(item.changed_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          timestamp: item.changed_at,
          adminName: item.officers?.full_name || item.officers?.email || 'Admin',
          changes: changes,
          icon: icon
        };
      });

      setActivities(auditActivities);
      
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  // ===========================================
  // FORMAT CHANGES UNTUK OFFICERS
  // ===========================================
  const formatOfficerChanges = (oldData, newData) => {
    if (!oldData || !newData) return ['📝 Updated data'];
    
    const changes = [];
    
    if (oldData.room !== newData.room) {
      changes.push(`🏠 Room: ${oldData.room || 'empty'} → ${newData.room || 'empty'}`);
    }
    if (oldData.status !== newData.status) {
      changes.push(`📊 Status: ${oldData.status || 'empty'} → ${newData.status || 'empty'}`);
    }
    if (oldData.department !== newData.department) {
      changes.push(`🏢 Department: ${oldData.department || 'empty'} → ${newData.department || 'empty'}`);
    }
    if (oldData.join_date !== newData.join_date) {
      const oldDate = oldData.join_date ? new Date(oldData.join_date).toLocaleDateString('id-ID') : 'empty';
      const newDate = newData.join_date ? new Date(newData.join_date).toLocaleDateString('id-ID') : 'empty';
      changes.push(`📅 Join date: ${oldDate} → ${newDate}`);
    }
    if (oldData.full_name !== newData.full_name) {
      changes.push(`👤 Name: ${oldData.full_name || 'empty'} → ${newData.full_name || 'empty'}`);
    }
    if (oldData.panel_id !== newData.panel_id) {
      changes.push(`🆔 Panel ID: ${oldData.panel_id || 'empty'} → ${newData.panel_id || 'empty'}`);
    }
    if (oldData.nationality !== newData.nationality) {
      changes.push(`🌏 Nationality: ${oldData.nationality || 'empty'} → ${newData.nationality || 'empty'}`);
    }
    if (oldData.gender !== newData.gender) {
      changes.push(`⚥ Gender: ${oldData.gender || 'empty'} → ${newData.gender || 'empty'}`);
    }
    if (oldData.bank_account !== newData.bank_account) {
      changes.push(`💰 Bank account: updated`);
    }
    if (oldData.phone !== newData.phone) {
      changes.push(`📱 Phone: ${oldData.phone || 'empty'} → ${newData.phone || 'empty'}`);
    }
    if (oldData.telegram_id !== newData.telegram_id) {
      changes.push(`✈️ Telegram: ${oldData.telegram_id || 'empty'} → ${newData.telegram_id || 'empty'}`);
    }
    if (oldData.email !== newData.email) {
      changes.push(`📧 Email: ${oldData.email || 'empty'} → ${newData.email || 'empty'}`);
    }
    
    return changes.length > 0 ? changes : ['📝 Updated data'];
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

  // Menu items untuk performance & settings (URUTAN SUDAH DITUKAR)
  const menuItems = [
    {
      title: '📊 ANALYTICS',
      description: 'Attendance & Division Overview',
      href: '/dashboard/analytics',
      icon: '📊',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      adminOnly: false
    },
    {
      title: '📈 OFFICERS KPI',
      description: 'Officers Key Performance Indicators',
      href: '/dashboard/officers-kpi',
      icon: '📈',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      adminOnly: false
    },
    {
      title: '📥 DATA RAW',
      description: 'Import CS, DP, WD Data',
      href: '/dashboard/data-raw',
      icon: '📥',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      adminOnly: true
    },
    {
      title: '⚙️ SETTINGS',
      description: 'Access Role & Reset Password',
      href: '/dashboard/settings',
      icon: '⚙️',
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      adminOnly: true
    }
  ];

  const filterOptions = [
    { value: 'daily', label: 'Daily (Kemarin)' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'semester', label: 'Semester' },
    { value: 'yearly', label: 'Tahunan' }
  ];

  const yearOptions = ['2024', '2025', '2026', '2027', '2028'];

  if (loading) return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
        <p className="mt-4 text-[#FFD700]">Loading dashboard data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* LEFT SIDE - Title & Welcome */}
        <div>
          <h1 className="relative text-5xl font-bold">
            <span className="absolute inset-0 text-[#FFD700] blur-2xl opacity-70 animate-pulse flex items-center">
              GROUP<SpinningX size={16} /> Dashboard
            </span>
            <span className="relative text-[#FFD700] drop-shadow-[0_0_15px_#FFD700] flex items-center">
              GROUP<SpinningX size={16} /> Dashboard
            </span>
          </h1>
          <p className="text-[#A7D8FF] mt-2 drop-shadow-[0_0_8px_#A7D8FF]">
            Welcome back! Here's your overview for today.
          </p>
        </div>
        
        {/* RIGHT SIDE - User Profile & Recent Activity */}
        <div className="flex items-center gap-4">
          {/* RECENT ACTIVITY NOTIFICATION */}
          <div className="relative">
            <button
              onClick={() => window.location.href = '/dashboard/activity-log'}
              onMouseEnter={() => setShowActivityTooltip(true)}
              onMouseLeave={() => setShowActivityTooltip(false)}
              className="relative bg-[#1A2F4A] hover:bg-[#2A3F5A] p-3 rounded-lg border border-[#FFD700]/30 transition-all group"
              title="View all activity"
            >
              <svg className="w-6 h-6 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              
              {/* NOTIFICATION BADGE - muncul kalau ada aktivitas baru BELUM DIBACA */}
              {hasNewActivity && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                  1
                </span>
              )}
            </button>
            
            {/* TOOLTIP - muncul pas hover */}
            {showActivityTooltip && activities.length > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg p-3 z-50 shadow-xl">
                <p className="text-[#FFD700] text-sm font-bold mb-2 flex items-center gap-2">
                  <span>🔔 Recent Updates</span>
                  <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-0.5 rounded-full">
                    {activities.length} total
                  </span>
                </p>
                {activities.slice(0, 3).map((act, idx) => (
                  <div key={idx} className="text-xs text-[#A7D8FF] mb-2 pb-2 border-b border-[#FFD700]/20 last:border-0">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{act.officer}</span>
                      <span className="text-[10px] text-[#A7D8FF]">• {formatTimeAgo(act.timestamp)}</span>
                    </div>
                    <div className="text-[10px] mt-1 text-white bg-[#0B1A33] p-1 rounded">
                      {act.changes?.[0] || 'Updated data'}
                    </div>
                  </div>
                ))}
                <div className="text-center mt-2 pt-2 border-t border-[#FFD700]/20">
                  <span className="text-xs text-[#FFD700] hover:text-[#FFD700]/80 cursor-pointer" onClick={() => window.location.href = '/dashboard/activity-log'}>
                    View all activity →
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* USER PROFILE CARD */}
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

      {/* DASHBOARD CHARTS SECTION - BARU */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#FFD700] drop-shadow-[0_0_8px_#FFD700]">
            📈 Performance Overview
          </h2>
          
          {/* FILTER CONTROLS */}
          <div className="flex gap-2">
            <select 
              value={chartFilter}
              onChange={(e) => setChartFilter(e.target.value)}
              className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white text-sm"
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select 
              value={chartYear}
              onChange={(e) => setChartYear(e.target.value)}
              className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white text-sm"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* PLACEHOLDER CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Bar Chart Placeholder */}
          <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-3">📊</div>
              <p className="text-[#A7D8FF]">Bar Chart - Performance Metrics</p>
              <p className="text-xs text-[#FFD700] mt-2">Filter: {filterOptions.find(f => f.value === chartFilter)?.label} {chartYear}</p>
            </div>
          </div>
          
          {/* Line Chart Placeholder */}
          <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6 h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-3">📈</div>
              <p className="text-[#A7D8FF]">Line Chart - Trends</p>
              <p className="text-xs text-[#FFD700] mt-2">(Coming Soon)</p>
            </div>
          </div>
        </div>
        
        {/* Table Placeholder */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#FFD700]">Detailed Performance Table</h3>
            <span className="text-xs bg-[#0B1A33] text-[#A7D8FF] px-3 py-1 rounded-full">
              {filterOptions.find(f => f.value === chartFilter)?.label} {chartYear}
            </span>
          </div>
          <div className="h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-[#A7D8FF]">Performance data table</p>
              <p className="text-xs text-[#FFD700] mt-2">(Coming Soon)</p>
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE & SETTINGS MENU - DIPINDAH KE BAWAH DENGAN BORDER */}
      <div className="mt-12 pt-6 border-t border-[#FFD700]/20">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4 drop-shadow-[0_0_8px_#FFD700]">Performance & Settings Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, index) => {
            if (item.adminOnly && !isAdmin) return null;
            
            return (
              <a
                key={index}
                href={item.href}
                className="bg-[#1A2F4A] p-5 rounded-xl border border-[#FFD700]/30 hover:border-[#FFD700] hover:shadow-[0_0_25px_#FFD700] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${item.bgColor} flex items-center justify-center text-3xl`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-lg ${item.color} group-hover:text-[#FFD700] transition-colors`}>
                      {item.title}
                    </div>
                    <div className="text-xs text-[#A7D8FF] mt-1">
                      {item.description}
                    </div>
                    {item.adminOnly && (
                      <span className="inline-block mt-1 text-[10px] bg-[#FFD700]/10 text-[#FFD700] px-2 py-0.5 rounded-full">
                        Admin Only
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
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