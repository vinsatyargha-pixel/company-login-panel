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
  // STATE UNTUK BANK ACCOUNTS (DARI SUPABASE)
  // ===========================================
  const [bankAccounts, setBankAccounts] = useState([]);
  const [filteredBanks, setFilteredBanks] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

  // STATE UNTUK POPUP INFO LOGIN
  const [selectedBank, setSelectedBank] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // STATE UNTUK UPDATE
  const [updatingStatus, setUpdatingStatus] = useState({
    deposit: false,
    withdrawal: false,
    support: false
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

  // ===========================================
  // FILTER BANK ACCOUNTS
  // ===========================================
  useEffect(() => {
    let filtered = [...bankAccounts];
    
    // Filter berdasarkan tab (all/deposit/withdrawal)
    if (activeTab === 'deposit') {
      filtered = filtered.filter(b => b.role?.toUpperCase().includes('DEPOSIT'));
    } else if (activeTab === 'withdrawal') {
      filtered = filtered.filter(b => b.role?.toUpperCase().includes('WITHDRAW'));
    }
    
    // Filter berdasarkan status (all/active/takedown)
    if (statusFilter === 'active') {
      filtered = filtered.filter(b => b.status === 'AKTIF');
    } else if (statusFilter === 'takedown') {
      filtered = filtered.filter(b => b.status === 'TAKEDOWN');
    }
    
    setFilteredBanks(filtered);
  }, [activeTab, statusFilter, bankAccounts]);

  // ===========================================
  // FETCH BANK ACCOUNTS DARI SUPABASE
  // ===========================================
  const fetchBankAccounts = async () => {
    try {
      setLoadingBanks(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('bank', { ascending: true });

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoadingBanks(false);
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
    fetchBankAccounts(); // AMBIL DATA BANK
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
  // FUNGSI STATUS TOGGLE
  // ===========================================
  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'AKTIF' ? 'TAKEDOWN' : 'AKTIF';
      const { error } = await supabase
        .from('bank_accounts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchBankAccounts();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // ===========================================
  // FUNGSI DELETE
  // ===========================================
  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data bank ini?')) return;
    
    try {
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank:', error);
    }
  };

  // ===========================================
  // FUNGSI CLICK ACCOUNT
  // ===========================================
  const handleAccountClick = (bank) => {
    setSelectedBank(bank);
    setShowPopup(true);
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

  // STATISTIK
  const stats = {
    total: bankAccounts.length,
    active: bankAccounts.filter(b => b.status === 'AKTIF').length,
    takedown: bankAccounts.filter(b => b.status === 'TAKEDOWN').length,
    deposit: bankAccounts.filter(b => b.role?.toUpperCase().includes('DEPOSIT')).length,
    withdrawal: bankAccounts.filter(b => b.role?.toUpperCase().includes('WITHDRAW')).length,
    displayYes: bankAccounts.filter(b => b.display_used === 'YES').length,
    usedYes: bankAccounts.filter(b => b.display_used === 'YES').length
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

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Total Bank</div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Active</div>
          <div className="text-2xl font-bold text-green-400">{stats.active}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Takedown</div>
          <div className="text-2xl font-bold text-red-400">{stats.takedown}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Deposit</div>
          <div className="text-2xl font-bold text-blue-400">{stats.deposit}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Withdrawal</div>
          <div className="text-2xl font-bold text-purple-400">{stats.withdrawal}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Display YES</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.displayYes}</div>
        </div>
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <div className="text-[#A7D8FF] text-sm">Used YES</div>
          <div className="text-2xl font-bold text-orange-400">{stats.usedYes}</div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="mb-4 flex items-center gap-2 border-b border-[#FFD700]/20 pb-2 flex-wrap">
        <button 
          onClick={() => setActiveTab('all')} 
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'all' ? 'bg-[#FFD700] text-[#0B1A33]' : 'text-[#A7D8FF] hover:text-white'}`}
        >
          All Banks ({stats.total})
        </button>
        <button 
          onClick={() => setActiveTab('deposit')} 
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'deposit' ? 'bg-[#FFD700] text-[#0B1A33]' : 'text-[#A7D8FF] hover:text-white'}`}
        >
          💰 Deposit ({stats.deposit})
        </button>
        <button 
          onClick={() => setActiveTab('withdrawal')} 
          className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'withdrawal' ? 'bg-[#FFD700] text-[#0B1A33]' : 'text-[#A7D8FF] hover:text-white'}`}
        >
          💸 Withdrawal ({stats.withdrawal})
        </button>
      </div>

      {/* STATUS FILTER */}
      <div className="mb-4 flex items-center gap-2 pb-2 flex-wrap">
        <span className="text-[#A7D8FF] text-sm mr-2">Status:</span>
        <button 
          onClick={() => setStatusFilter('all')} 
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === 'all' ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#1A2F4A] text-[#A7D8FF] hover:bg-[#2A3F5A]'}`}
        >
          All
        </button>
        <button 
          onClick={() => setStatusFilter('active')} 
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${statusFilter === 'active' ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
        >
          <span className="w-2 h-2 rounded-full bg-green-500"></span> Active ({stats.active})
        </button>
        <button 
          onClick={() => setStatusFilter('takedown')} 
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${statusFilter === 'takedown' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500"></span> Takedown ({stats.takedown})
        </button>
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
                  bank.role?.toUpperCase().includes('DEPOSIT') && 
                  bank.status === 'AKTIF'
                )
                .map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between border-b border-[#FFD700]/10 pb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        
                        {/* GAMBAR BANK + NAMA BANK */}
                        <div className="flex items-center gap-2">
                          {/* Gambar Bank */}
                          {bank.bank?.toLowerCase().includes('bca') && (
                            <img src="/images/bca.png" alt="BCA" className="h-4 w-auto object-contain" />
                          )}
                          {bank.bank?.toLowerCase().includes('bni') && (
                            <img src="/images/bni.png" alt="BNI" className="h-4 w-auto object-contain" />
                          )}
                          {bank.bank?.toLowerCase().includes('bri') && (
                            <img src="/images/bri.png" alt="BRI" className="h-4 w-auto object-contain" />
                          )}
                          {bank.bank?.toLowerCase().includes('mandiri') && (
                            <img src="/images/mandiri.png" alt="Mandiri" className="h-4 w-auto object-contain" />
                          )}
                          
                          <span className="text-white text-sm font-medium">{bank.bank}</span>
                        </div>
                      </div>
                      
                      <span className="text-[#A7D8FF] text-xs ml-6">
                        {bank.account_name} {bank.account_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-green-400">ON</span>
                      <button
                        disabled
                        className="relative inline-flex h-5 w-9 items-center rounded-full bg-green-500 opacity-50 cursor-not-allowed"
                      >
                        <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                      </button>
                    </div>
                  </div>
                ))
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
                  bank.role?.toUpperCase().includes('WITHDRAW') && 
                  bank.status === 'AKTIF'
                )
                .map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between border-b border-[#FFD700]/10 pb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        
                        {/* GAMBAR BANK + NAMA BANK */}
                        <div className="flex items-center gap-2">
                          {/* Gambar Bank */}
                          {bank.bank?.toLowerCase().includes('bca') && (
                            <img src="/images/bca.png" alt="BCA" className="h-4 w-auto object-contain" />
                          )}
                          {bank.bank?.toLowerCase().includes('bni') && (
                            <img src="/images/bni.png" alt="BNI" className="h-4 w-auto object-contain" />
                          )}
                          {bank.bank?.toLowerCase().includes('bri') && (
                            <img src="/images/bri.png" alt="BRI" className="h-4 w-auto object-contain" />
                          )}
                          {bank.bank?.toLowerCase().includes('mandiri') && (
                            <img src="/images/mandiri.png" alt="Mandiri" className="h-4 w-auto object-contain" />
                          )}
                          
                          <span className="text-white text-sm font-medium">{bank.bank}</span>
                        </div>
                      </div>
                      
                      <span className="text-[#A7D8FF] text-xs ml-6">
                        {bank.account_name} {bank.account_number}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-green-400">ON</span>
                      <button
                        disabled
                        className="relative inline-flex h-5 w-9 items-center rounded-full bg-green-500 opacity-50 cursor-not-allowed"
                      >
                        <span className="inline-block h-3 w-3 transform rounded-full bg-white translate-x-5" />
                      </button>
                    </div>
                  </div>
                ))
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
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    supportLines.liveChat ? 'bg-green-500' : 'bg-gray-600'
                  } ${updatingStatus.support ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      supportLines.liveChat ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
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
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    supportLines.whatsapp ? 'bg-green-500' : 'bg-gray-600'
                  } ${updatingStatus.support ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      supportLines.whatsapp ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
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

      {/* TABEL BANK */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
              <tr>
                <th className="text-left py-3 px-4 text-[#FFD700]">Status</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Display/Used</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Bank</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Account Name</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Account Number</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Role</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Type Bank</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Masa Aktif</th>
                <th className="text-left py-3 px-4 text-[#FFD700]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingBanks ? (
                <tr><td colSpan="9" className="text-center py-8 text-[#A7D8FF]"><span className="animate-spin inline-block mr-2">⏳</span>Loading data bank...</td></tr>
              ) : filteredBanks.length === 0 ? (
                <tr><td colSpan="9" className="text-center py-8 text-[#A7D8FF]">Tidak ada bank dengan filter ini.</td></tr>
              ) : (
                filteredBanks.map((bank) => (
                  <tr key={bank.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 ${bank.status === 'AKTIF' ? 'text-green-400' : 'text-red-400'}`}>
                        <span className={`w-2 h-2 rounded-full ${bank.status === 'AKTIF' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {bank.status || 'AKTIF'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {bank.display_used === 'YES' && (
                          <>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-xs">Display</span>
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">Used</span>
                          </>
                        )}
                        {bank.display_used === 'NO' && (
                          <span className="px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full text-xs">No</span>
                        )}
                        {bank.display_used === 'TAKEDOWN' && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs">Takedown</span>
                        )}
                        {!bank.display_used && <span className="text-[#A7D8FF] text-xs">-</span>}
                      </div>
                    </td>
                    
                    {/* KOLOM BANK - DENGAN GAMBAR */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* Gambar Bank */}
                        {bank.bank?.toLowerCase().includes('bca') && (
                          <img src="/images/bca.png" alt="BCA" className="h-5 w-auto object-contain" />
                        )}
                        {bank.bank?.toLowerCase().includes('bni') && (
                          <img src="/images/bni.png" alt="BNI" className="h-5 w-auto object-contain" />
                        )}
                        {bank.bank?.toLowerCase().includes('bri') && (
                          <img src="/images/bri.png" alt="BRI" className="h-5 w-auto object-contain" />
                        )}
                        {bank.bank?.toLowerCase().includes('mandiri') && (
                          <img src="/images/mandiri.png" alt="Mandiri" className="h-5 w-auto object-contain" />
                        )}
                        {/* Nama Bank */}
                        <span className="text-white font-medium">{bank.bank}</span>
                      </div>
                    </td>
                    
                    <td className="py-3 px-4 text-white">{bank.account_name || '-'}</td>
                    
                    <td className="py-3 px-4">
                      <button 
                        onClick={() => handleAccountClick(bank)} 
                        className="text-white font-mono hover:text-[#FFD700] transition-colors underline decoration-dotted underline-offset-2"
                      >
                        {bank.account_number || '-'}
                      </button>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bank.role === 'DEPOSIT' ? 'bg-blue-500/20 text-blue-400' : 
                        bank.role === 'WITHDRAW' ? 'bg-purple-500/20 text-purple-400' : 
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {bank.role === 'DEPOSIT' ? 'Deposit' : 
                         bank.role === 'WITHDRAW' ? 'Withdrawal' : 
                         bank.role || 'Both'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-400">
                        {bank.type_bank || '-'}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-[#A7D8FF] text-sm">{bank.masa_aktif || '-'}</td>
                    
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStatusToggle(bank.id, bank.status)} 
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            bank.status === 'AKTIF' ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          }`}
                        >
                          {bank.status === 'AKTIF' ? '→ Takedown' : '→ Active'}
                        </button>
                        <button 
                          onClick={() => handleDelete(bank.id)} 
                          className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP INFO LOGIN */}
      {showPopup && selectedBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] border-2 border-[#FFD700] rounded-xl p-6 max-w-2xl w-full mx-4 shadow-[0_0_50px_#FFD700] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1A2F4A] z-10 pb-2">
              <h3 className="text-xl font-bold text-[#FFD700]">🔐 Info Login {selectedBank.bank}</h3>
              <button onClick={() => setShowPopup(false)} className="text-[#A7D8FF] hover:text-white text-2xl">×</button>
            </div>
            
            {/* Data Utama */}
            <div className="bg-[#0B1A33] p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[#A7D8FF] text-xs">Bank</div><div className="text-white font-bold">{selectedBank.bank}</div></div>
                <div><div className="text-[#A7D8FF] text-xs">Account Name</div><div className="text-white font-bold">{selectedBank.account_name}</div></div>
                <div><div className="text-[#A7D8FF] text-xs">Account Number</div><div className="text-white font-mono">{selectedBank.account_number}</div></div>
                <div><div className="text-[#A7D8FF] text-xs">Role</div><div className={`px-2 py-1 inline-block rounded-full text-xs ${selectedBank.role === 'DEPOSIT' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>{selectedBank.role === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}</div></div>
              </div>
            </div>

            {/* Login Info */}
            <div className="space-y-4">
              {/* Login Utama */}
              <div className="bg-[#0B1A33] p-4 rounded-lg">
                <h4 className="text-[#FFD700] font-semibold mb-3 border-b border-[#FFD700]/20 pb-1">🔑 Login Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><div className="text-[#A7D8FF] text-xs">User ID</div><div className="text-white font-mono">-</div></div>
                  <div><div className="text-[#A7D8FF] text-xs">PIN</div><div className="text-white font-mono">-</div></div>
                </div>
              </div>
            </div>
            
            <button onClick={() => setShowPopup(false)} className="mt-6 w-full bg-[#FFD700] text-[#0B1A33] py-2 rounded-lg font-bold hover:bg-[#FFD700]/80 transition-colors">
              Tutup
            </button>
          </div>
        </div>
      )}

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

      {/* FOOTER */}
      <div className="mt-4 text-xs text-[#A7D8FF] flex items-center justify-end gap-4 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Takedown</span>
        <span className="flex items-center gap-1">💰 Deposit</span>
        <span className="flex items-center gap-1">💸 Withdrawal</span>
        <span className="flex items-center gap-1">📊 From Google Sheets</span>
        <span className="flex items-center gap-1">🔍 Klik No. Rekening</span>
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