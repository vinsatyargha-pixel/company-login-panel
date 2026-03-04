'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DashboardCard from '@/components/DashboardCard';
import LogoutButton from '@/components/LogoutButton';
import ResetPasswordModal from '@/components/ResetPasswordModal';
import SpinningX from '@/components/SpinningX';

export default function AssetPerformanceDetailPage() {
  const { user, userJobRole, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // Dashboard data states
  const [dashboardData, setDashboardData] = useState({
    totalAssets: 0,
    activeOfficers: 0,
  });
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [showActivityTooltip, setShowActivityTooltip] = useState(false);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState('hourly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedHalfYear, setSelectedHalfYear] = useState('jan-jun');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedChartType, setSelectedChartType] = useState('line');
  
  // Data states
  const [assetList, setAssetList] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    avgValue: 0,
    peakHour: '-',
    peakValue: 0
  });
  
  // Chart filter states
  const [chartFilter, setChartFilter] = useState('weekly');
  const [chartYear, setChartYear] = useState('2026');
  
  // Traffic data
  const [trafficData, setTrafficData] = useState([
    { name: 'Deposit', value: 0 },
    { name: 'Withdrawal', value: 0 },
    { name: 'Livechat', value: 0 }
  ]);
  
  const TRAFFIC_COLORS = ['#10b981', '#ef4444', '#f59e0b'];
  
  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  
  // Service methods
  const [depositMethods, setDepositMethods] = useState({
    BCA: false, BNI: false, BRI: false, Mandiri: false, DANA: false, NexusPay: false
  });
  
  const [withdrawalMethods, setWithdrawalMethods] = useState({
    BCA: false, BNI: false, BRI: false, Mandiri: false, NexusPay: false, Midas: false
  });
  
  const [supportLines, setSupportLines] = useState({
    liveChat: false, whatsapp: false
  });
  
  const [updatingStatus, setUpdatingStatus] = useState({
    deposit: false,
    withdrawal: false,
    support: false
  });
  
  // Performance metrics
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

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2025', '2026', '2027'];
  
  const halfYearOptions = [
    { value: 'jan-jun', label: 'January - June' },
    { value: 'jul-dec', label: 'July - December' }
  ];

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

  // ===========================================
  // INITIAL SETUP
  // ===========================================
  useEffect(() => {
    setInitialLoad(false);
    fetchAssetList();
    fetchDashboardData();
    fetchRecentActivities();
    fetchBankAccounts();
    
    // Load service methods from localStorage
    const savedDeposit = localStorage.getItem('depositMethods');
    if (savedDeposit) setDepositMethods(JSON.parse(savedDeposit));
    
    const savedWithdrawal = localStorage.getItem('withdrawalMethods');
    if (savedWithdrawal) setWithdrawalMethods(JSON.parse(savedWithdrawal));
    
    const savedSupport = localStorage.getItem('supportLines');
    if (savedSupport) setSupportLines(JSON.parse(savedSupport));
  }, []);

  // Save to localStorage
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

  // Load last read timestamp
  useEffect(() => {
    const saved = localStorage.getItem('lastReadActivity');
    if (saved) setLastReadTimestamp(saved);
  }, []);

  // Check new activities
  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = new Date(activities[0].timestamp).getTime();
      const lastRead = lastReadTimestamp ? new Date(lastReadTimestamp).getTime() : 0;
      setHasNewActivity(latestActivity > lastRead);
    }
  }, [activities, lastReadTimestamp]);

  // Fetch data when filters change
  useEffect(() => {
    if (!initialLoad) {
      const timer = setTimeout(() => {
        fetchPerformanceData();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filterType, selectedDate, selectedMonth, selectedYear, selectedHalfYear, selectedAsset]);

  // ===========================================
  // FETCH FUNCTIONS
  // ===========================================
  const fetchAssetList = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('asset')
        .not('asset', 'is', null)
        .neq('asset', '');

      if (error) throw error;

      const uniqueAssets = [...new Set(data.map(item => item.asset))];
      setAssetList(['all', ...uniqueAssets]);
    } catch (error) {
      console.error('Error fetching asset list:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
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
    }
  };

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

  const fetchBankAccounts = async () => {
    try {
      setLoadingBanks(true);
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*');

      if (error) throw error;
      
      setBankAccounts(data || []);
      
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoadingBanks(false);
    }
  };

  // ===========================================
  // GENERATE PERFORMANCE DATA
  // ===========================================
  const generateHourlyData = () => {
    const data = [];
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        time: `${hour}:00`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        transactions: Math.floor(Math.random() * 50) + 10,
        volume: Math.floor(Math.random() * 5000) + 1000,
        date: dateStr
      });
    }
    return data;
  };

  const generateDailyData = () => {
    const data = [];
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      data.push({
        day: day,
        label: `${months[selectedMonth - 1]} ${day}`,
        transactions: Math.floor(Math.random() * 100) + 20,
        volume: Math.floor(Math.random() * 10000) + 2000,
        date: `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
      });
    }
    return data;
  };

  const generateMonthlyData = () => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        month: months[i],
        monthNum: i + 1,
        label: months[i],
        transactions: Math.floor(Math.random() * 500) + 100,
        volume: Math.floor(Math.random() * 50000) + 10000
      });
    }
    return data;
  };

  const generateHalfYearData = () => {
    const data = [];
    const startMonth = selectedHalfYear === 'jan-jun' ? 0 : 6;
    const endMonth = selectedHalfYear === 'jan-jun' ? 6 : 12;
    
    for (let i = startMonth; i < endMonth; i++) {
      data.push({
        month: months[i],
        monthNum: i + 1,
        label: months[i],
        transactions: Math.floor(Math.random() * 500) + 100,
        volume: Math.floor(Math.random() * 50000) + 10000
      });
    }
    return data;
  };

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      let data = [];
      
      switch (filterType) {
        case 'hourly':
          data = generateHourlyData();
          break;
        case 'daily':
          data = generateDailyData();
          break;
        case 'monthly':
          data = generateMonthlyData();
          break;
        case 'halfyear':
          data = generateHalfYearData();
          break;
        default:
          data = generateHourlyData();
      }
      
      setPerformanceData(data);
      
      const totalTrans = data.reduce((sum, item) => sum + item.transactions, 0);
      const totalVol = data.reduce((sum, item) => sum + item.volume, 0);
      const avgVal = totalTrans > 0 ? totalVol / totalTrans : 0;
      
      let peakItem = null;
      let peakValue = 0;
      data.forEach(item => {
        if (item.transactions > peakValue) {
          peakValue = item.transactions;
          peakItem = item;
        }
      });
      
      setSummaryData({
        totalTransactions: totalTrans,
        totalVolume: totalVol,
        avgValue: Math.round(avgVal),
        peakHour: peakItem?.label || '-',
        peakValue: peakValue
      });
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // HANDLERS
  // ===========================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPerformanceData();
    setRefreshing(false);
  };

  const handleReset = () => {
    setFilterType('hourly');
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setSelectedHalfYear('jan-jun');
    setSelectedAsset('all');
    setSelectedChartType('line');
  };

  const getMaxDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
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
  // RENDER
  // ===========================================
  if (loading && initialLoad) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#FFD700] border-t-transparent mb-4"></div>
        <div className="text-[#FFD700] text-lg font-semibold animate-pulse">
          Loading Asset Performance Data...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* HEADER - SAMA PERSIS DENGAN DASHBOARD */}
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
          <p className="text-[#A7D8FF] mt-2">Asset Performance Analytics & Detailed View</p>
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
              
              {hasNewActivity && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                  1
                </span>
              )}
            </button>
            
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

      {/* ROYAL GOLD CARDS - SAMA PERSIS DENGAN DASHBOARD */}
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

      {/* Back Button */}
      <div className="mb-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all duration-300 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#FFD700]">📈 ASSET PERFORMANCE DETAIL</h2>
        <p className="text-[#A7D8FF] mt-1">
          {isAdmin ? '👑 Admin Mode' : '👤 Staff Mode'} - Real-time analytics
        </p>
      </div>

      {/* Filters Section */}
      <div className="mb-6 bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filter Type */}
          <div className="flex items-center gap-2">
            <span className="text-[#A7D8FF] text-sm">Period:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            >
              <option value="hourly">⏱️ Hourly (24h - Yesterday)</option>
              <option value="daily">📅 Daily (Full Month)</option>
              <option value="monthly">📆 Monthly (12 Months)</option>
              <option value="halfyear">📊 Half Year (6 Months)</option>
            </select>
          </div>

          {/* Dynamic Filters */}
          {filterType === 'hourly' && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getMaxDate()}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              />
              <span className="text-xs text-[#A7D8FF]">(max: yesterday)</span>
            </div>
          )}

          {filterType === 'daily' && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                >
                  {fullMonths.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#A7D8FF] text-sm">Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {(filterType === 'monthly' || filterType === 'halfyear') && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'halfyear' && (
            <div className="flex items-center gap-2">
              <span className="text-[#A7D8FF] text-sm">Period:</span>
              <select
                value={selectedHalfYear}
                onChange={(e) => setSelectedHalfYear(e.target.value)}
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
              >
                {halfYearOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Asset Filter */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[#A7D8FF] text-sm">Asset:</span>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD700]/50"
            >
              {assetList.map(asset => (
                <option key={asset} value={asset}>
                  {asset === 'all' ? 'All Assets' : asset}
                </option>
              ))}
            </select>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-2 bg-[#0B1A33] rounded-lg border border-[#FFD700]/30 p-1">
            <button
              onClick={() => setSelectedChartType('line')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                selectedChartType === 'line' 
                  ? 'bg-[#FFD700] text-black font-medium' 
                  : 'text-[#A7D8FF] hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setSelectedChartType('bar')}
              className={`px-3 py-1 rounded-md text-sm transition-all ${
                selectedChartType === 'bar' 
                  ? 'bg-[#FFD700] text-black font-medium' 
                  : 'text-[#A7D8FF] hover:text-white'
              }`}
            >
              Bar
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Close
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Transactions</div>
          <div className="text-2xl font-bold text-[#FFD700]">{summaryData.totalTransactions.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Total Volume ($)</div>
          <div className="text-2xl font-bold text-green-400">${summaryData.totalVolume.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Average Value</div>
          <div className="text-2xl font-bold text-blue-400">${summaryData.avgValue.toLocaleString()}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Peak {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Day' : 'Month'}</div>
          <div className="text-lg font-bold text-purple-400">{summaryData.peakHour}</div>
        </div>
        
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 transform hover:scale-105 transition-all duration-300">
          <div className="text-[#A7D8FF] text-sm">Peak Transactions</div>
          <div className="text-2xl font-bold text-orange-400">{summaryData.peakValue}</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#FFD700]">
            {filterType === 'hourly' && `Hourly Performance - ${new Date(selectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} (Yesterday Data)`}
            {filterType === 'daily' && `Daily Performance - ${fullMonths[selectedMonth - 1]} ${selectedYear}`}
            {filterType === 'monthly' && `Monthly Performance - ${selectedYear}`}
            {filterType === 'halfyear' && `Half Year Performance - ${selectedHalfYear === 'jan-jun' ? 'Jan-Jun' : 'Jul-Dec'} ${selectedYear}`}
          </h2>
          <span className="text-xs text-[#A7D8FF]">
            {selectedAsset === 'all' ? 'All Assets' : `Asset: ${selectedAsset}`}
          </span>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {selectedChartType === 'line' ? (
              <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF"
                  tick={{ fill: '#A7D8FF', fontSize: 12 }}
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="transactions" stroke="#FFD700" name="Transactions" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#10b981" name="Volume ($)" strokeWidth={2} />
              </LineChart>
            ) : (
              <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                <XAxis 
                  dataKey="label" 
                  stroke="#A7D8FF"
                  tick={{ fill: '#A7D8FF', fontSize: 12 }}
                  interval={filterType === 'hourly' ? 3 : filterType === 'daily' ? 5 : 0}
                />
                <YAxis yAxisId="left" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#A7D8FF" tick={{ fill: '#A7D8FF' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                  labelStyle={{ color: '#FFD700' }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="transactions" fill="#FFD700" name="Transactions" />
                <Bar yAxisId="right" dataKey="volume" fill="#10b981" name="Volume ($)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <div className="p-4 border-b border-[#FFD700]/30 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#FFD700]">📋 Detailed Data</h2>
          <span className="text-xs text-[#A7D8FF]">{performanceData.length} entries</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0B1A33]">
              <tr>
                <th className="px-4 py-3 text-left text-[#FFD700] font-bold border-b border-[#FFD700]/30">
                  {filterType === 'hourly' ? 'Hour' : filterType === 'daily' ? 'Date' : 'Month'}
                </th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Transactions</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Volume ($)</th>
                <th className="px-4 py-3 text-right text-[#FFD700] font-bold border-b border-[#FFD700]/30">Average Value</th>
              </tr>
            </thead>
            <tbody>
              {performanceData.map((item, index) => (
                <tr key={index} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{item.label}</td>
                  <td className="px-4 py-3 text-right text-[#FFD700]">{item.transactions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-green-400">${item.volume.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-400">
                    ${Math.round(item.volume / item.transactions).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 p-3 bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 text-xs text-[#A7D8FF] flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span>⏱️ Hourly: max yesterday data</span>
          <span>📅 Daily: full month view</span>
          <span>📆 Monthly: 12 months</span>
          <span>📊 Half Year: 6 months period</span>
        </div>
        <span>
          Last updated: {new Date().toLocaleString()}
        </span>
      </div>

      {/* MENU SECTION - SAMA PERSIS DENGAN DASHBOARD */}
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

      {/* Reset Password Modal */}
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