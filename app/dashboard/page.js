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
import Link from 'next/link';

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
  // STATE UNTUK BANK ACCOUNTS (DARI SUPABASE)
  // ===========================================
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);

  // ===========================================
  // STATE UNTUK FILTER ASSET
  // ===========================================
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [assetList, setAssetList] = useState([]);

  // ===========================================
  // STATE UNTUK SYNC KE SUPABASE
  // ===========================================
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMessage, setSyncMessage] = useState('');

  // ===========================================
  // STATE UNTUK AVAILABLE SERVICES (MANUAL TOGGLE)
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

  // STATE UNTUK UPDATE
  const [updatingStatus, setUpdatingStatus] = useState({
    deposit: false,
    withdrawal: false,
    support: false
  });

  // ===========================================
  // STATE UNTUK PERFORMANCE METRICS
  // ===========================================
  // ASSET PERFORMANCE - DATA HARIAN 1 BULAN (3 LINES)
  const [assetPerformance, setAssetPerformance] = useState([]);

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

  // ===========================================
  // GENERATE DAILY ASSET PERFORMANCE DATA (3 LINES)
  // ===========================================
  const generateDailyAssetData = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDate = today.getDate();
    
    // Hitung jumlah hari dalam bulan ini
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    const data = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      // Cek apakah tanggal ini sudah lewat atau belum
      const isPastDate = day <= currentDate;
      
      // Generate data untuk tanggal yang sudah lewat
      let chat = null;
      let deposit = null;
      let withdrawal = null;
      
      if (isPastDate) {
        // Random value dengan pola yang berbeda untuk setiap line
        chat = Math.floor(Math.random() * 30) + 10;      // 10-40
        deposit = Math.floor(Math.random() * 50) + 30;   // 30-80
        withdrawal = Math.floor(Math.random() * 40) + 20; // 20-60
      }
      
      data.push({
        name: `${day}`,
        day: day,
        chat: chat,
        deposit: deposit,
        withdrawal: withdrawal,
        isPastDate: isPastDate,
        fullDate: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }
    
    setAssetPerformance(data);
  };

  // ===========================================
  // FETCH BANK ACCOUNTS DARI SUPABASE
  // ===========================================
  const fetchBankAccounts = async () => {
    try {
      setLoadingBanks(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*');

      if (error) throw error;
      
      console.log('📊 Data dari Supabase:', data);
      setBankAccounts(data || []);
      
      // AMBIL DAFTAR ASSET UNIK (hanya dari bank yang aktif & display YES)
      const activeBanks = data?.filter(b => 
        (b.role?.toUpperCase() === 'DEPOSIT' || b.role?.toUpperCase() === 'WITHDRAW') && 
        b.display_used === 'YES'
      ) || [];
      
      const uniqueAssets = [...new Set(activeBanks.map(item => item.asset).filter(Boolean))];
      setAssetList(uniqueAssets);
      
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  // ===========================================
  // SYNC KE SUPABASE
  // ===========================================
  const syncToSupabase = async () => {
    console.log('📤 START: Syncing to Supabase...');
    setSyncStatus('syncing');
    setSyncMessage('Menyinkronkan ke database...');
    
    try {
      const response = await fetch('/api/banks/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('📥 Sync response:', result);
      
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(`✅ ${result.message}`);
        
        // Refresh data setelah sync
        fetchBankAccounts();
        
        setTimeout(() => {
          setSyncStatus(null);
          setSyncMessage('');
        }, 3000);
      } else {
        setSyncStatus('error');
        setSyncMessage(`❌ Gagal: ${result.error}`);
      }
    } catch (err) {
      console.error('❌ Sync error:', err);
      setSyncStatus('error');
      setSyncMessage('❌ Gagal koneksi ke server');
    }
  };

  // LOAD DARI LOCALSTORAGE (HANYA DI BROWSER)
  useEffect(() => {
    const savedDeposit = localStorage.getItem('depositMethods');
    if (savedDeposit) {
      setDepositMethods(JSON.parse(savedDeposit));
    }
    
    const savedWithdrawal = localStorage.getItem('withdrawalMethods');
    if (savedWithdrawal) {
      setWithdrawalMethods(JSON.parse(savedWithdrawal));
    }
    
    const savedSupport = localStorage.getItem('supportLines');
    if (savedSupport) {
      setSupportLines(JSON.parse(savedSupport));
    }
  }, []);

  // SIMPAN KE LOCALSTORAGE SETIAP KALI STATE BERUBAH
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('depositMethods', JSON.stringify(depositMethods));
    }
  }, [depositMethods]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('withdrawalMethods', JSON.stringify(withdrawalMethods));
    }
  }, [withdrawalMethods]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supportLines', JSON.stringify(supportLines));
    }
  }, [supportLines]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivities();
    fetchPaymentData();
    fetchPerformanceData();
    fetchBankAccounts();
    generateDailyAssetData(); // GENERATE DATA HARIAN 3 LINES
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
  // FUNGSI TOGGLE SERVICE (ON/OFF)
  // ===========================================
  const handleToggleService = async (type, serviceName, newStatus) => {
    try {
      if (type === 'deposit') {
        setUpdatingStatus(prev => ({ ...prev, deposit: true }));
        setDepositMethods(prev => ({ ...prev, [serviceName]: newStatus }));
        
      } else if (type === 'withdrawal') {
        setUpdatingStatus(prev => ({ ...prev, withdrawal: true }));
        setWithdrawalMethods(prev => ({ ...prev, [serviceName]: newStatus }));
        
      } else if (type === 'support') {
        setUpdatingStatus(prev => ({ ...prev, support: true }));
        setSupportLines(prev => ({ ...prev, [serviceName]: newStatus }));
      }
      
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus({ deposit: false, withdrawal: false, support: false });
    }
  };

  // ===========================================
  // FETCH DATA
  // ===========================================
  const fetchPaymentData = async () => {
    try {
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

    } catch (error) {
      console.error('Error fetching payment data:', error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      // TODO: Fetch real data
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
  // FUNGSI RECENT ACTIVITY
  // ===========================================
  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select(`
          *,
          officers!changed_by (full_name, email)
        `)
        .order('changed_at', { ascending: false })
        .limit(20);

      const auditActivities = (auditData || []).map(item => ({
        id: `audit-${item.changed_at}`,
        officer: item.new_data?.full_name || item.old_data?.full_name || 'Unknown',
        timestamp: item.changed_at,
        changes: ['📝 Updated data']
      }));

      setActivities(auditActivities);
      
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMins = Math.floor((now - past) / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
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
              
              {/* NOTIFICATION BADGE */}
              {hasNewActivity && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                  1
                </span>
              )}
            </button>
            
            {/* TOOLTIP */}
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
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
  <DashboardCard
    title="Asset GROUP-X"
    value={`${dashboardData.totalAssets} Assets`}
    icon={<span className="text-6xl">💎</span>}
    color="gold"
    href="/dashboard/assets"
    className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
  />
  
  <DashboardCard
    title="Account Bank Management"
    value="Manage Banks"
    icon={<span className="text-6xl">🏦</span>}
    color="gold"
    href="/dashboard/data-bank"
    className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
  />
  
  <DashboardCard
    title="Data Officers GROUP-X"
    value={`${dashboardData.activeOfficers} Officers`}
    icon={<span className="text-6xl">👨‍💼</span>}
    color="gold"
    href="/dashboard/officers/active"
    className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
  />
  
  <DashboardCard
    title="Schedule Officers GROUP-X"
    value="Calendar"
    icon={<span className="text-6xl">📅</span>}
    color="gold"
    href="/dashboard/schedule"
    className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
  />
  
  <DashboardCard
    title="Financial Summary GROUP-X"
    value="Management"
    icon={<span className="text-6xl">💰</span>}
    color="gold"
    href="/dashboard/financial"
    className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] shadow-[0_0_30px_#FFD700,inset_0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_50px_#FFD700,inset_0_0_50px_rgba(255,215,0,0.5)] transition-all duration-500 relative after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent after:translate-x-[-100%] hover:after:translate-x-[100%] after:transition-transform after:duration-1000 overflow-hidden"
  />
</div>

      {/* SYNC BUTTON & STATUS */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={syncToSupabase}
            disabled={syncStatus === 'syncing'}
            className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
              syncStatus === 'syncing' 
                ? 'bg-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <>
                <span className="animate-spin">⏳</span> Syncing...
              </>
            ) : (
              <>
                <span>📤</span> Sync Bank Method LIVE! 
              </>
            )}
          </button>
          
          {syncMessage && (
            <div className={`px-4 py-2 rounded-lg ${
              syncStatus === 'success' ? 'bg-green-500/20 text-green-400' :
              syncStatus === 'error' ? 'bg-red-500/20 text-red-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {syncMessage}
            </div>
          )}
        </div>
      </div>

      {/* FILTER ASSET */}
      <div className="mb-4 flex items-center gap-2 pb-2 flex-wrap">
        <span className="text-[#A7D8FF] text-sm mr-2">Filter Asset:</span>
        <select
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="bg-[#1A2F4A] text-white px-4 py-2 rounded-lg border border-[#FFD700]/30 text-sm outline-none hover:border-[#FFD700] transition-colors"
        >
          <option value="all">Semua Asset</option>
          {assetList.map((asset) => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
        {selectedAsset !== 'all' && (
          <button
            onClick={() => setSelectedAsset('all')}
            className="text-xs text-[#A7D8FF] hover:text-white px-2"
          >
            ✕ Reset
          </button>
        )}
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

        {/* KOLOM 2: DEPOSIT METHOD */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💰 Available Deposit Method (Receiver)</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {loadingBanks ? (
              <div className="text-center text-[#A7D8FF] py-4">Loading banks...</div>
            ) : (
              bankAccounts
                .filter(bank => 
                  bank.role?.toUpperCase() === 'DEPOSIT' && 
                  bank.display_used === 'YES' &&
                  (selectedAsset === 'all' || bank.asset === selectedAsset)
                )
                .map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between border-b border-[#FFD700]/10 pb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        
                        <div className="flex items-center gap-2">
                          {bank.bank?.toLowerCase().includes('bca') && <img src="/images/bca.png" alt="BCA" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('bni') && <img src="/images/bni.png" alt="BNI" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('bri') && <img src="/images/bri.png" alt="BRI" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('mandiri') && <img src="/images/mandiri.png" alt="Mandiri" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('nexus') && <img src="/images/nexus.png" alt="NEXUS" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('midas') && <img src="/images/midas.png" alt="MIDAS" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('qris') && <img src="/images/qris.png" alt="QRIS" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('dana') && <img src="/images/dana.png" alt="DANA" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('jago') && <img src="/images/jago.png" alt="JAGO" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('cimb') && <img src="/images/cimb.png" alt="CIMB" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('seabank') && <img src="/images/seabank.png" alt="SEABANK" className="h-4 w-auto object-contain" />}
                          <span className="text-white text-sm font-medium">{bank.bank}</span>
                        </div>
                        
                        <span className="text-[10px] text-green-400 ml-2">Display</span>
                      </div>
                      
                      <span className="text-[#A7D8FF] text-xs ml-6">
                        {bank.account_name} {bank.account_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-green-400">ON</span>
                    </div>
                  </div>
                ))
            )}
            {bankAccounts.filter(b => b.role?.toUpperCase() === 'DEPOSIT' && b.display_used === 'YES' && (selectedAsset === 'all' || b.asset === selectedAsset)).length === 0 && !loadingBanks && (
              <div className="text-center text-[#A7D8FF] py-4">Tidak ada deposit method</div>
            )}
          </div>
        </div>

        {/* KOLOM 3: WITHDRAWAL METHOD */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💸 Available Withdrawal Method (Sender)</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {loadingBanks ? (
              <div className="text-center text-[#A7D8FF] py-4">Loading banks...</div>
            ) : (
              bankAccounts
                .filter(bank => 
                  bank.role?.toUpperCase() === 'WITHDRAW' && 
                  bank.display_used === 'YES' &&
                  (selectedAsset === 'all' || bank.asset === selectedAsset)
                )
                .map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between border-b border-[#FFD700]/10 pb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        
                        <div className="flex items-center gap-2">
                          {bank.bank?.toLowerCase().includes('bca') && <img src="/images/bca.png" alt="BCA" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('bni') && <img src="/images/bni.png" alt="BNI" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('bri') && <img src="/images/bri.png" alt="BRI" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('mandiri') && <img src="/images/mandiri.png" alt="Mandiri" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('nexus') && <img src="/images/nexus.png" alt="NEXUS" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('midas') && <img src="/images/midas.png" alt="MIDAS" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('qris') && <img src="/images/qris.png" alt="QRIS" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('dana') && <img src="/images/dana.png" alt="DANA" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('jago') && <img src="/images/jago.png" alt="JAGO" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('cimb') && <img src="/images/cimb.png" alt="CIMB" className="h-4 w-auto object-contain" />}
                          {bank.bank?.toLowerCase().includes('seabank') && <img src="/images/seabank.png" alt="SEABANK" className="h-4 w-auto object-contain" />}
                          <span className="text-white text-sm font-medium">{bank.bank}</span>
                        </div>
                        
                        <span className="text-[10px] text-blue-400 ml-2">Used</span>
                      </div>
                      
                      <span className="text-[#A7D8FF] text-xs ml-6">
                        {bank.account_name} {bank.account_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-green-400">ON</span>
                    </div>
                  </div>
                ))
            )}
            {bankAccounts.filter(b => b.role?.toUpperCase() === 'WITHDRAW' && b.display_used === 'YES' && (selectedAsset === 'all' || b.asset === selectedAsset)).length === 0 && !loadingBanks && (
              <div className="text-center text-[#A7D8FF] py-4">Tidak ada withdrawal method</div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 2 - GRID 3 KOLOM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* KOLOM 1: CUSTOMER SUPPORT LINE */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💬 Customer Service Support Line</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${supportLines.liveChat ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white text-sm">Live Chat (Omega)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${supportLines.liveChat ? 'text-green-400' : 'text-red-400'}`}>
                  {supportLines.liveChat ? 'ON' : 'OFF'}
                </span>
                <button
                  onClick={() => handleToggleService('support', 'liveChat', !supportLines.liveChat)}
                  disabled={updatingStatus.support}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    supportLines.liveChat ? 'bg-green-500' : 'bg-gray-600'
                  } ${updatingStatus.support ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    supportLines.liveChat ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${supportLines.whatsapp ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white text-sm">Whatsapp (Official)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${supportLines.whatsapp ? 'text-green-400' : 'text-red-400'}`}>
                  {supportLines.whatsapp ? 'ON' : 'OFF'}
                </span>
                <button
                  onClick={() => handleToggleService('support', 'whatsapp', !supportLines.whatsapp)}
                  disabled={updatingStatus.support}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    supportLines.whatsapp ? 'bg-green-500' : 'bg-gray-600'
                  } ${updatingStatus.support ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    supportLines.whatsapp ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM 2: ASSET PERFORMANCE - DAILY CHART (1 BULAN) DENGAN 3 LINES */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <a href="/dashboard/asset-performance" className="block group cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-[#FFD700]">📈 Asset Performance</h3>
              <div className="text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={assetPerformance} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#A7D8FF" 
                    tick={{ fill: '#A7D8FF', fontSize: 10 }}
                    interval={Math.floor(assetPerformance.length / 7)} // Tampilkan sekitar 7 label
                  />
                  <YAxis 
                    stroke="#A7D8FF" 
                    tick={{ fill: '#A7D8FF', fontSize: 10 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                    labelStyle={{ color: '#FFD700' }}
                    formatter={(value, name) => {
                      if (value === null) return ['No Data', name];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  
                  {/* CS Line - Kuning */}
                  <Line 
                    type="monotone" 
                    dataKey="chat" 
                    stroke="#FFD700" 
                    name="CS" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: "#FFD700", stroke: "#FFD700", strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: "#FFD700", stroke: "#fff", strokeWidth: 2 }}
                    connectNulls={false}
                  />
                  
                  {/* Deposit Line - Biru */}
                  <Line 
                    type="monotone" 
                    dataKey="deposit" 
                    stroke="#3b82f6" 
                    name="Deposit" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: "#3b82f6", stroke: "#3b82f6", strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                    connectNulls={false}
                  />
                  
                  {/* Withdrawal Line - Merah */}
                  <Line 
                    type="monotone" 
                    dataKey="withdrawal" 
                    stroke="#ef4444" 
                    name="Withdrawal" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: "#ef4444", stroke: "#ef4444", strokeWidth: 1 }}
                    activeDot={{ r: 5, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-2 text-right text-xs text-[#A7D8FF] group-hover:text-[#FFD700] transition-colors">
              Click to see yesterday hourly detail →
            </div>
          </a>
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