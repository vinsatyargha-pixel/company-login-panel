'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/DashboardCard';
import LogoutButton from '@/components/LogoutButton';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import SpinningX from '@/components/SpinningX';
import { 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

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

  // ===========================================
  // STATE UNTUK TRAFFIC VOLUME (PIE CHART)
  // ===========================================
  const [trafficData, setTrafficData] = useState([
    { name: 'Deposit', value: 0 },
    { name: 'Withdrawal', value: 0 },
    { name: 'Livechat', value: 0 }
  ]);
  
  const TRAFFIC_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

  // ===========================================
  // STATE UNTUK AVAILABLE SERVICES
  // ===========================================
  const [depositMethods, setDepositMethods] = useState({
    BCA: false, BNI: false, BRI: false, Mandiri: false, DANA: false, NexusPay: false
  });
  
  const [withdrawalMethods, setWithdrawalMethods] = useState({
    BCA: false, BNI: false, BRI: false, Mandiri: false, NexusPay: false, Midas: false
  });
  
  const [supportLines, setSupportLines] = useState({
    liveChat: false, whatsapp: false
  });

  // ===========================================
  // STATE UNTUK PERFORMANCE METRICS
  // ===========================================
  const [assetPerformance, setAssetPerformance] = useState([
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 59 },
    { name: 'Mar', value: 80 },
    { name: 'Apr', value: 81 },
    { name: 'May', value: 56 },
    { name: 'Jun', value: 55 },
    { name: 'Jul', value: 70 },
  ]);

  const [officerPerformance, setOfficerPerformance] = useState([
    { name: 'Jan', officers: 40 },
    { name: 'Feb', officers: 30 },
    { name: 'Mar', officers: 45 },
    { name: 'Apr', officers: 27 },
    { name: 'May', officers: 38 },
    { name: 'Jun', officers: 43 },
    { name: 'Jul', officers: 34 },
  ]);

  const { user, userJobRole, isAdmin } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    fetchPaymentData();
    fetchPerformanceData();
  }, [chartFilter, chartYear]);

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

  // ===========================================
  // FETCH DATA
  // ===========================================
  const fetchPaymentData = async () => {
    try {
      // TODO: Sesuaikan query dengan struktur tabel di Supabase lo
      
      // Data untuk Traffic Volume
      const { data: depositData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'deposit')

      const totalDeposit = depositData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      const { data: withdrawalData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'withdrawal')

      const totalWithdrawal = withdrawalData?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      const { count: chatCount } = await supabase
        .from('chat_logs')
        .select('*', { count: 'exact' })

      setTrafficData([
        { name: 'Deposit', value: totalDeposit },
        { name: 'Withdrawal', value: totalWithdrawal },
        { name: 'Livechat', value: chatCount || 0 }
      ]);

      // Data untuk Available Services
      const { data: bankData } = await supabase
        .from('bank_accounts')
        .select('bank_name, status, type')

      // Reset states
      const depositState = { BCA: false, BNI: false, BRI: false, Mandiri: false, NexusPay: false };
      const withdrawalState = { BCA: false, BNI: false, BRI: false, Mandiri: false, NexusPay: false, Midas: false };
      const supportState = { liveChat: false, whatsapp: false };

      bankData?.forEach(bank => {
        if (bank.status?.toLowerCase() === 'active') {
          if (bank.type === 'deposit' || bank.type === 'both') {
            if (depositState.hasOwnProperty(bank.bank_name)) {
              depositState[bank.bank_name] = true;
            }
          }
          if (bank.type === 'withdrawal' || bank.type === 'both') {
            if (withdrawalState.hasOwnProperty(bank.bank_name)) {
              withdrawalState[bank.bank_name] = true;
            }
          }
        }
      });

      // Data untuk support lines
      const { data: supportData } = await supabase
        .from('support_services')
        .select('name, status')

      supportData?.forEach(service => {
        if (service.status === 'active') {
          if (service.name === 'Live Chat (Omega)') supportState.liveChat = true;
          if (service.name === 'Whatsapp (Official)') supportState.whatsapp = true;
        }
      });

      setDepositMethods(depositState);
      setWithdrawalMethods(withdrawalState);
      setSupportLines(supportState);

    } catch (error) {
      console.error('Error fetching payment data:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      // TODO: Fetch real data for asset performance
      // This is sample data - replace with actual queries
      
      // const { data: assetData } = await supabase
      //   .from('asset_performance')
      //   .select('*')
      //   .eq('period', chartFilter)
      //   .eq('year', chartYear)

    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact' });

      const { count: activeOfficers } = await supabase
        .from('officers')
        .select('*', { count: 'exact' })
        .or('status.eq.TRAINING,status.eq.REGULAR,status.eq.regular,status.eq.training,status.eq.active');

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
  // FUNGSI RECENT ACTIVITY - YANG LENGKAP
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
  // FORMAT CHANGES UNTUK OFFICERS - YANG LENGKAP
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

  // Menu items
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
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
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
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="relative text-5xl font-bold">
            <span className="absolute inset-0 text-[#FFD700] blur-2xl opacity-70 animate-pulse flex items-center">
              GROUP<SpinningX size={16} /> Dashboard
            </span>
            <span className="relative text-[#FFD700] drop-shadow-[0_0_15px_#FFD700] flex items-center">
              GROUP<SpinningX size={16} /> Dashboard
            </span>
          </h1>
          <p className="text-[#A7D8FF] mt-2">Welcome back! Here's your overview for today.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* RECENT ACTIVITY NOTIFICATION - YANG LENGKAP */}
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
              
              {/* NOTIFICATION BADGE */}
              {hasNewActivity && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                  1
                </span>
              )}
            </button>
            
            {/* TOOLTIP - LENGKAP DENGAN CHANGES */}
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

          {/* User Profile */}
          <div className="bg-[#0B1A33] rounded-lg border border-[#FFD700]/30 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-white">{user?.email || 'Loading...'}</div>
              <div className="text-xs text-[#A7D8FF]">{isAdmin ? 'Admin' : userJobRole || 'Staff'}</div>
              <button onClick={() => setShowResetModal(true)} className="text-xs text-[#FFD700] hover:text-[#FFD700]/80 font-medium mt-1 flex items-center gap-1">
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
        <DashboardCard title="Asset GROUP-X" value={`${dashboardData.totalAssets} Assets`} icon="💎" color="gold" href="/dashboard/assets" />
        <DashboardCard title="Data Officers GROUP-X" value={`${dashboardData.activeOfficers} Officers`} icon="👨‍💼" color="gold" href="/dashboard/officers/active" />
        <DashboardCard title="Schedule Officers GROUP-X" value="Calendar" icon="📅" color="gold" href="/dashboard/schedule" />
        <DashboardCard title="Financial Summary GROUP-X" value="Management" icon="💰" color="gold" href="/dashboard/financial" />
      </div>

      {/* FILTERS */}
      <div className="flex justify-end gap-2 mb-6">
        <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white text-sm">
          {filterOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        <select value={chartYear} onChange={(e) => setChartYear(e.target.value)} className="bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white text-sm">
          {yearOptions.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
      </div>

      {/* MAIN DASHBOARD GRID - 3 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* KOLOM 1: TRAFFIC VOLUME */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">📊 Traffic Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={TRAFFIC_COLORS[index % TRAFFIC_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KOLOM 2: DEPOSIT METHOD - DENGAN LAMPU ON/OFF */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💰 Available Deposit Method</h3>
          <div className="space-y-3">
            {Object.entries(depositMethods).map(([bank, isActive]) => (
              <div key={bank} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-white">{bank}</span>
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* KOLOM 3: WITHDRAWAL METHOD - DENGAN LAMPU ON/OFF */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💸 Available Withdrawal Method (Sender Bank)</h3>
          <div className="space-y-3">
            {Object.entries(withdrawalMethods).map(([bank, isActive]) => (
              <div key={bank} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className="text-white">{bank}</span>
                </div>
                <span className={`text-xs font-medium ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* KOLOM 1: CUSTOMER SUPPORT LINE - DENGAN LAMPU ON/OFF */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💬 Customer Service Support Line</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${supportLines.liveChat ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white">Live Chat (Omega)</span>
              </div>
              <span className={`text-xs font-medium ${supportLines.liveChat ? 'text-green-400' : 'text-red-400'}`}>
                {supportLines.liveChat ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${supportLines.whatsapp ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white">Whatsapp (Official)</span>
              </div>
              <span className={`text-xs font-medium ${supportLines.whatsapp ? 'text-green-400' : 'text-red-400'}`}>
                {supportLines.whatsapp ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* KOLOM 2: ASSET PERFORMANCE */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">📈 Asset Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={assetPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis dataKey="name" stroke="#A7D8FF" />
                <YAxis stroke="#A7D8FF" />
                <Tooltip contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }} />
                <Line type="monotone" dataKey="value" stroke="#FFD700" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KOLOM 3: OFFICER PERFORMANCE */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">📊 Officer Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis dataKey="name" stroke="#A7D8FF" />
                <YAxis stroke="#A7D8FF" />
                <Tooltip contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }} />
                <Bar dataKey="officers" fill="#FFD700" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="mt-8 pt-6 border-t border-[#FFD700]/20">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">Performance & Settings Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, index) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <a key={index} href={item.href} className="bg-[#1A2F4A] p-5 rounded-xl border border-[#FFD700]/30 hover:border-[#FFD700] hover:shadow-[0_0_25px_#FFD700] transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full ${item.bgColor} flex items-center justify-center text-3xl`}>{item.icon}</div>
                  <div>
                    <div className={`font-bold text-lg ${item.color}`}>{item.title}</div>
                    <div className="text-xs text-[#A7D8FF]">{item.description}</div>
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
          onSuccess={() => setShowResetModal(false)}
        />
      )}
    </div>
  );
}