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
import NextImage from 'next/image';

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
  // ASSET PERFORMANCE
  const [assetPerformance, setAssetPerformance] = useState([]);
  const [assetPerformanceFilter, setAssetPerformanceFilter] = useState('daily');
  const [assetPerformanceYear, setAssetPerformanceYear] = useState('2026');
  const [assetPerformanceMonth, setAssetPerformanceMonth] = useState(new Date().getMonth() + 1);
  const [assetPerformancePeriod, setAssetPerformancePeriod] = useState('jan-jun');
  const [loadingAssetPerformance, setLoadingAssetPerformance] = useState(false);
  
  // STATE FILTER ASSET KHUSUS UNTUK ASSET PERFORMANCE (INDEPENDEN)
  const [assetPerformanceAsset, setAssetPerformanceAsset] = useState('XLY'); // default XLY
  
  // OFFICER PERFORMANCE - PIE CHART (HUMAN VS SYSTEM)
  const [officerPieData, setOfficerPieData] = useState([]);
  const [loadingOfficerPie, setLoadingOfficerPie] = useState(false);
  
  // OFFICER PERFORMANCE - BAR CHART
  const [officerPerformance, setOfficerPerformance] = useState([]);
  const [loadingOfficerData, setLoadingOfficerData] = useState(true);

  const { user, userJobRole, isAdmin } = useAuth();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const years = ['2024', '2025', '2026', '2027', '2028'];

  // ===========================================
  // FUNGSI UNTUK GET GAMBAR BANK
  // ===========================================
  const getBankImage = (bankName) => {
    if (!bankName) return '/images/bank.png';
    const name = bankName.toLowerCase();
    if (name.includes('bca')) return '/images/bca.png';
    if (name.includes('bni')) return '/images/bni.png';
    if (name.includes('bri')) return '/images/bri.png';
    if (name.includes('nexus')) return '/images/nexus.png';
    if (name.includes('midas')) return '/images/midas.png';
    if (name.includes('mandiri')) return '/images/mandiri.png';
    if (name.includes('dana')) return '/images/dana.png';
    return '/images/bank.png';
  };

  // ===========================================
  // FUNGSI MAPPING ASSET (NAMA PANJANG -> SINGKATAN)
  // ===========================================
  const getAssetCode = (assetName) => {
  if (!assetName) return 'XLY';
  const assetMap = {
    'LUCKY77': 'XLY',
    'LUCKY 77': 'XLY',
    'LUCKY': 'XLY',
  };
  const upperName = assetName.toUpperCase();
  for (const [key, value] of Object.entries(assetMap)) {
    if (upperName.includes(key.toUpperCase())) {
      return value;
    }
  }
  return 'XLY'; // default XLY
};

  // ===========================================
  // FETCH OFFICER PIE DATA (HUMAN VS SYSTEM)
  // ===========================================
  const fetchOfficerPieData = async () => {
    try {
      setLoadingOfficerPie(true);
      
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data: depositData } = await supabase
        .from('deposit_transactions')
        .select('handler')
        .eq('status', 'Approved')
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      const { data: withdrawalData } = await supabase
        .from('withdrawal_transactions')
        .select('handler')
        .eq('status', 'Approved')
        .gte('approved_date', startDate)
        .lte('approved_date', endDate);
      
      let humanTotal = 0;
      let systemTotal = 0;
      
      depositData?.forEach(tx => {
        if (tx.handler === 'SYSTEM' || !tx.handler) systemTotal++;
        else humanTotal++;
      });
      
      withdrawalData?.forEach(tx => {
        if (tx.handler === 'SYSTEM' || !tx.handler) systemTotal++;
        else humanTotal++;
      });
      
      const pieData = [];
      if (humanTotal > 0) pieData.push({ name: 'Human', value: humanTotal, color: '#3b82f6' });
      if (systemTotal > 0) pieData.push({ name: 'System', value: systemTotal, color: '#ef4444' });
      
      setOfficerPieData(pieData);
      
    } catch (error) {
      console.error('Error fetching officer pie data:', error);
    } finally {
      setLoadingOfficerPie(false);
    }
  };

  // ===========================================
  // FETCH ASSET PERFORMANCE DATA
  // ===========================================
  const fetchAssetPerformanceData = async () => {
    try {
      setLoadingAssetPerformance(true);
      
      if (assetPerformanceFilter === 'daily') {
        const startDate = `${assetPerformanceYear}-${String(assetPerformanceMonth).padStart(2, '0')}-01 00:00:00`;
        const endDate = `${assetPerformanceYear}-${String(assetPerformanceMonth).padStart(2, '0')}-${new Date(assetPerformanceYear, assetPerformanceMonth, 0).getDate()} 23:59:59`;
        
        let depositQuery = supabase
          .from('deposit_transactions')
          .select('approved_date')
          .gte('approved_date', startDate)
          .lte('approved_date', endDate);
        
        let withdrawalQuery = supabase
          .from('withdrawal_transactions')
          .select('approved_date')
          .gte('approved_date', startDate)
          .lte('approved_date', endDate);
        
        if (assetPerformanceAsset !== 'all') {
          depositQuery = depositQuery.eq('brand', assetPerformanceAsset);
          withdrawalQuery = withdrawalQuery.eq('brand', assetPerformanceAsset);
        }
        
        const [{ data: deposits }, { data: withdrawals }] = await Promise.all([
          depositQuery, withdrawalQuery
        ]);
        
        const data = processDailyAssetData(deposits || [], withdrawals || [], assetPerformanceMonth, assetPerformanceYear);
        setAssetPerformance(data);
        
      } else {
        const startMonth = assetPerformancePeriod === 'jan-jun' ? 1 : 7;
        const endMonth = assetPerformancePeriod === 'jan-jun' ? 6 : 12;
        
        const startDate = `${assetPerformanceYear}-${String(startMonth).padStart(2, '0')}-01 00:00:00`;
        const endDate = `${assetPerformanceYear}-${String(endMonth).padStart(2, '0')}-${new Date(assetPerformanceYear, endMonth, 0).getDate()} 23:59:59`;
        
        let depositQuery = supabase
          .from('deposit_transactions')
          .select('approved_date')
          .gte('approved_date', startDate)
          .lte('approved_date', endDate);
        
        let withdrawalQuery = supabase
          .from('withdrawal_transactions')
          .select('approved_date')
          .gte('approved_date', startDate)
          .lte('approved_date', endDate);
        
        if (assetPerformanceAsset !== 'all') {
          depositQuery = depositQuery.eq('brand', assetPerformanceAsset);
          withdrawalQuery = withdrawalQuery.eq('brand', assetPerformanceAsset);
        }
        
        const [{ data: deposits }, { data: withdrawals }] = await Promise.all([
          depositQuery, withdrawalQuery
        ]);
        
        const data = processMonthlyAssetData(deposits || [], withdrawals || [], assetPerformancePeriod, assetPerformanceYear);
        setAssetPerformance(data);
      }
      
    } catch (error) {
      console.error('Error fetching asset performance:', error);
    } finally {
      setLoadingAssetPerformance(false);
    }
  };

  const processDailyAssetData = (deposits, withdrawals, month, year) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const isPastDate = (year < currentYear) || 
                        (year === currentYear && month < currentMonth) ||
                        (year === currentYear && month === currentMonth && day <= currentDate);
      
      return {
        name: `${day}`,
        day: day,
        chat: isPastDate ? 0 : null,
        deposit: 0,
        withdrawal: 0,
        isPastDate: isPastDate,
        fullDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      };
    });
    
    deposits.forEach(deposit => {
      const date = new Date(deposit.approved_date);
      const day = date.getDate() - 1;
      if (days[day]) days[day].deposit++;
    });
    
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.approved_date);
      const day = date.getDate() - 1;
      if (days[day]) days[day].withdrawal++;
    });
    
    return days;
  };

  const processMonthlyAssetData = (deposits, withdrawals, period, year) => {
    const startMonth = period === 'jan-jun' ? 0 : 6;
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = startMonth + i;
      const isPastDate = (year < currentYear) || (year === currentYear && monthIndex <= currentMonth);
      
      return {
        name: months[monthIndex],
        month: months[monthIndex],
        monthNum: monthIndex + 1,
        chat: isPastDate ? 0 : null,
        deposit: 0,
        withdrawal: 0,
        isPastDate: isPastDate
      };
    });
    
    deposits.forEach(deposit => {
      const date = new Date(deposit.approved_date);
      const month = date.getMonth();
      const monthIndex = month - startMonth;
      if (monthIndex >= 0 && monthIndex < 6) {
        monthlyData[monthIndex].deposit++;
      }
    });
    
    withdrawals.forEach(withdrawal => {
      const date = new Date(withdrawal.approved_date);
      const month = date.getMonth();
      const monthIndex = month - startMonth;
      if (monthIndex >= 0 && monthIndex < 6) {
        monthlyData[monthIndex].withdrawal++;
      }
    });
    
    return monthlyData;
  };

  // ===========================================
  // FETCH OFFICER BAR CHART DATA
  // ===========================================
  const fetchOfficerPerformance = async () => {
    try {
      setLoadingOfficerData(true);
      
      const [{ data: officers }, { data: depositData }, { data: withdrawalData }] = await Promise.all([
        supabase.from('officers').select('id, full_name').in('department', ['CS DP WD']).eq('status', 'REGULAR').order('full_name'),
        supabase.from('deposit_transactions').select('handler').gte('approved_date', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()),
        supabase.from('withdrawal_transactions').select('handler').gte('approved_date', new Date(new Date().setDate(new Date().getDate() - 30)).toISOString())
      ]);

      const officerMap = new Map();
      
      officers?.forEach(officer => {
        officerMap.set(officer.id, {
          name: officer.full_name,
          deposit: 0,
          withdrawal: 0,
          total: 0
        });
      });

      depositData?.forEach(tx => {
        const officer = officers?.find(o => o.id === tx.handler);
        if (officer && officerMap.has(officer.id)) {
          const data = officerMap.get(officer.id);
          data.deposit++;
          data.total++;
        }
      });

      withdrawalData?.forEach(tx => {
        const officer = officers?.find(o => o.id === tx.handler);
        if (officer && officerMap.has(officer.id)) {
          const data = officerMap.get(officer.id);
          data.withdrawal++;
          data.total++;
        }
      });

      const chartData = Array.from(officerMap.values())
        .filter(item => item.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
        .map(item => ({
          name: item.name.length > 12 ? item.name.substring(0, 10) + '...' : item.name,
          fullName: item.name,
          deposit: item.deposit,
          withdrawal: item.withdrawal,
          total: item.total
        }));

      setOfficerPerformance(chartData);
    } catch (error) {
      console.error('Error fetching officer performance:', error);
    } finally {
      setLoadingOfficerData(false);
    }
  };

  // ===========================================
// FETCH BANK ACCOUNTS
// ===========================================
const fetchBankAccounts = async () => {
  try {
    setLoadingBanks(true);
    console.log('🔍 Fetching bank accounts...'); // ← TAMBAH INI
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*');

    if (error) throw error;
    
    console.log('✅ Bank accounts received:', data); // ← TAMBAH INI
    console.log('📊 Jumlah bank accounts:', data?.length); // ← TAMBAH INI
    
    setBankAccounts(data || []);
    
    // BUAT GLOBAL VARIABLE (biar bisa diakses dari console)
    if (typeof window !== 'undefined') {
      window.__bankAccounts = data || [];
      window.__debug = {
        bankAccounts: data || [],
        timestamp: new Date().toISOString()
      };
    }
    
    const activeBanks = data?.filter(b => 
      (b.role?.toUpperCase() === 'DEPOSIT' || b.role?.toUpperCase() === 'WITHDRAW') && 
      b.display_used === 'YES'
    ) || [];
    
    console.log('🏦 Active banks (DEPOSIT/WITHDRAW):', activeBanks.length); // ← TAMBAH INI
    
    const uniqueAssets = [...new Set(activeBanks.map(item => item.asset).filter(Boolean))];
    setAssetList(uniqueAssets);
    
    console.log('🎯 Unique assets:', uniqueAssets); // ← TAMBAH INI
    
  } catch (error) {
    console.error('❌ Error fetching bank accounts:', error); // ← UPDATE
  } finally {
    setLoadingBanks(false);
    console.log('🏁 Fetch bank accounts completed'); // ← TAMBAH INI
  }
};

  // ===========================================
  // SYNC KE SUPABASE
  // ===========================================
  const syncToSupabase = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Menyinkronkan ke database...');
    
    try {
      const response = await fetch('/api/banks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(`✅ ${result.message}`);
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
      setSyncStatus('error');
      setSyncMessage('❌ Gagal koneksi ke server');
    }
  };

  // ===========================================
  // FETCH DASHBOARD DATA
  // ===========================================
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { count: totalAssets } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });

      const { count: activeOfficers } = await supabase
        .from('officers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['TRAINING', 'REGULAR', 'active']);

      setDashboardData({ 
        totalAssets: totalAssets || 0, 
        activeOfficers: activeOfficers || 0 
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData({ totalAssets: 0, activeOfficers: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // FETCH PAYMENT DATA
  // ===========================================
  const fetchPaymentData = async () => {
    try {
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

  // ===========================================
  // FETCH RECENT ACTIVITIES
  // ===========================================
  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*, officers!changed_by (full_name, email)')
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
      title: '📊 OFFICER KPI REVIEW',
      description: 'Officers Key Performance Indicators',
      href: '/dashboard/officers-kpi',
      icon: '📊',
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
  // USE EFFECTS
  // ===========================================
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        fetchDashboardData(),
        fetchRecentActivities(),
        fetchPaymentData(),
        fetchBankAccounts(),
        fetchOfficerPerformance(),
        fetchOfficerPieData()
      ]);
    };
    loadAllData();
  }, [chartFilter, chartYear, selectedAsset]);

  useEffect(() => {
    fetchAssetPerformanceData();
  }, [assetPerformanceAsset, assetPerformanceFilter, 
      assetPerformanceYear, assetPerformanceMonth, assetPerformancePeriod]);

  useEffect(() => {
    const savedDeposit = localStorage.getItem('depositMethods');
    if (savedDeposit) setDepositMethods(JSON.parse(savedDeposit));
    
    const savedWithdrawal = localStorage.getItem('withdrawalMethods');
    if (savedWithdrawal) setWithdrawalMethods(JSON.parse(savedWithdrawal));
    
    const savedSupport = localStorage.getItem('supportLines');
    if (savedSupport) setSupportLines(JSON.parse(savedSupport));
    
    const saved = localStorage.getItem('lastReadActivity');
    if (saved) setLastReadTimestamp(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('depositMethods', JSON.stringify(depositMethods));
      localStorage.setItem('withdrawalMethods', JSON.stringify(withdrawalMethods));
      localStorage.setItem('supportLines', JSON.stringify(supportLines));
    }
  }, [depositMethods, withdrawalMethods, supportLines]);

  useEffect(() => {
    if (activities.length > 0) {
      const latestActivity = new Date(activities[0].timestamp).getTime();
      const lastRead = lastReadTimestamp ? new Date(lastReadTimestamp).getTime() : 0;
      setHasNewActivity(latestActivity > lastRead);
    }
  }, [activities, lastReadTimestamp]);

  useEffect(() => {
    const handleActivityRead = () => {
      const saved = localStorage.getItem('lastReadActivity');
      if (saved) setLastReadTimestamp(saved);
    };
    window.addEventListener('activityRead', handleActivityRead);
    return () => window.removeEventListener('activityRead', handleActivityRead);
  }, []);

  // ===========================================
  // DEBUG: Export ke window buat console
  // ===========================================
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__bankAccounts = bankAccounts;
      window.__debug = {
        ...window.__debug,
        bankAccounts: bankAccounts,
        assetList: assetList,
        timestamp: new Date().toISOString()
      };
    }
  }, [bankAccounts, assetList]);

  // DEBUG: Manual fetch di console
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__fetchBanks = fetchBankAccounts;
      window.__testFetch = async () => {
        const { data } = await supabase.from('bank_accounts').select('*');
        console.log('Manual fetch:', data);
        return data;
      };
    }
  }, []);

  // ===========================================
  // FUNGSI TOGGLE SERVICE
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
              {hasNewActivity && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold animate-pulse">
                  1
                </span>
              )}
            </button>
            
            {showActivityTooltip && activities.length > 0 && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg p-3 z-50 shadow-xl">
                <p className="text-[#FFD700] text-sm font-bold mb-2">🔔 Recent Updates</p>
                {activities.slice(0, 3).map((act, idx) => (
                  <div key={idx} className="text-xs text-[#A7D8FF] mb-2 pb-2 border-b border-[#FFD700]/20">
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{act.officer}</span>
                      <span className="text-[10px]">• {formatTimeAgo(act.timestamp)}</span>
                    </div>
                  </div>
                ))}
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
              <div className="text-sm font-medium text-white">{user?.email}</div>
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
        <DashboardCard title="Asset GROUP-X" value={`${dashboardData.totalAssets} Assets`} icon={<span className="text-6xl">💎</span>} color="gold" glassEffect={true} href="/dashboard/assets" />
        <DashboardCard title="Account Bank Management" value="Manage Banks" icon={<span className="text-6xl">🏦</span>} color="gold" glassEffect={true} href="/dashboard/data-bank" />
        <DashboardCard title="Data Officers GROUP-X" value={`${dashboardData.activeOfficers} Officers`} icon={<span className="text-6xl">👨‍💼</span>} color="gold" glassEffect={true} href="/dashboard/officers/active" />
        <DashboardCard title="Schedule Officers GROUP-X" value="Calendar" icon={<span className="text-6xl">📅</span>} color="gold" glassEffect={true} href="/dashboard/schedule" />
        <DashboardCard title="Financial Summary GROUP-X" value="Management" icon={<span className="text-6xl">💰</span>} color="gold" glassEffect={true} href="/dashboard/financial" />
      </div>

      {/* SYNC BUTTON */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={syncToSupabase} disabled={syncStatus === 'syncing'} className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${syncStatus === 'syncing' ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {syncStatus === 'syncing' ? <><span className="animate-spin">⏳</span> Syncing...</> : <><span>📤</span> Sync Bank Method LIVE!</>}
          </button>
          {syncMessage && <div className={`px-4 py-2 rounded-lg ${syncStatus === 'success' ? 'bg-green-500/20 text-green-400' : syncStatus === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{syncMessage}</div>}
        </div>
      </div>

      {/* FILTER ASSET */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-[#A7D8FF] text-sm mr-2">Filter Asset:</span>
        <select value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)} className="bg-[#1A2F4A] text-white px-4 py-2 rounded-lg border border-[#FFD700]/30 text-sm">
          <option value="all">Semua Asset</option>
          {assetList.map(asset => <option key={asset} value={asset}>{asset}</option>)}
        </select>
        {selectedAsset !== 'all' && <button onClick={() => setSelectedAsset('all')} className="text-xs text-[#A7D8FF] hover:text-white">✕ Reset</button>}
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
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💰 Available Deposit Method</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingBanks ? <div className="text-center text-[#A7D8FF]">Loading banks...</div> : 
              bankAccounts.filter(b => b.role?.toUpperCase() === 'DEPOSIT' && b.display_used === 'YES' && (selectedAsset === 'all' || b.asset === selectedAsset))
                .map(bank => (
                  <div key={bank.id} className="flex items-center justify-between border-b border-[#FFD700]/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <NextImage
                          src={getBankImage(bank.bank)}
                          alt={bank.bank}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-white text-sm font-medium">{bank.bank}</span>
                        </div>
                        <span className="text-[#A7D8FF] text-xs">{bank.account_name} {bank.account_number}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-400">ON</span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* KOLOM 3: WITHDRAWAL METHOD */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <h3 className="text-lg font-bold text-[#FFD700] mb-4">💸 Available Withdrawal Method</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loadingBanks ? <div className="text-center text-[#A7D8FF]">Loading banks...</div> : 
              bankAccounts.filter(b => b.role?.toUpperCase() === 'WITHDRAW' && b.display_used === 'YES' && (selectedAsset === 'all' || b.asset === selectedAsset))
                .map(bank => (
                  <div key={bank.id} className="flex items-center justify-between border-b border-[#FFD700]/10 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 relative flex-shrink-0">
                        <NextImage
                          src={getBankImage(bank.bank)}
                          alt={bank.bank}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          <span className="text-white text-sm font-medium">{bank.bank}</span>
                        </div>
                        <span className="text-[#A7D8FF] text-xs">{bank.account_name} {bank.account_number}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-400">ON</span>
                  </div>
                ))
            }
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
                <span className={`text-xs font-medium ${supportLines.liveChat ? 'text-green-400' : 'text-red-400'}`}>{supportLines.liveChat ? 'ON' : 'OFF'}</span>
                <button onClick={() => handleToggleService('support', 'liveChat', !supportLines.liveChat)} disabled={updatingStatus.support}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${supportLines.liveChat ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${supportLines.liveChat ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${supportLines.whatsapp ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-white text-sm">Whatsapp (Official)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${supportLines.whatsapp ? 'text-green-400' : 'text-red-400'}`}>{supportLines.whatsapp ? 'ON' : 'OFF'}</span>
                <button onClick={() => handleToggleService('support', 'whatsapp', !supportLines.whatsapp)} disabled={updatingStatus.support}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${supportLines.whatsapp ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${supportLines.whatsapp ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM 2: ASSET PERFORMANCE */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <div className="flex items-center justify-between mb-2">
            <Link href="/dashboard/asset-performance" className="block group flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#FFD700]">📈 Asset Performance</h3>
                <div className="text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
            
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setLoadingAssetPerformance(true);
                await fetchAssetPerformanceData();
              }}
              disabled={loadingAssetPerformance}
              className="ml-2 p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
              title="Refresh asset data"
            >
              <svg className={`w-4 h-4 text-white ${loadingAssetPerformance ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3" onClick={(e) => e.preventDefault()}>
            <select 
              value={assetPerformanceAsset} 
              onChange={(e) => setAssetPerformanceAsset(e.target.value)}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white w-24"
            >
              <option value="all">ALL</option>
              {assetList.length > 0 ? (
                assetList.map(asset => {
                  const assetCode = getAssetCode(asset);
                  return <option key={asset} value={assetCode}>{assetCode}</option>;
                })
              ) : (
                <option value="XLY">XLY</option>
              )}
            </select>

            <select value={assetPerformanceFilter} onChange={(e) => setAssetPerformanceFilter(e.target.value)} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
            
            {assetPerformanceFilter === 'daily' ? (
              <>
                <select value={assetPerformanceMonth} onChange={(e) => setAssetPerformanceMonth(parseInt(e.target.value))} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white">
                  {fullMonths.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
                </select>
                <select value={assetPerformanceYear} onChange={(e) => setAssetPerformanceYear(e.target.value)} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white">
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </>
            ) : (
              <>
                <select value={assetPerformancePeriod} onChange={(e) => setAssetPerformancePeriod(e.target.value)} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white">
                  <option value="jan-jun">Jan-Jun</option>
                  <option value="jul-dec">Jul-Dec</option>
                </select>
                <select value={assetPerformanceYear} onChange={(e) => setAssetPerformanceYear(e.target.value)} className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-xs text-white">
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </>
            )}
          </div>
          
          <div className="h-64">
            {loadingAssetPerformance ? (
              <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={assetPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FFD70020" />
                  <XAxis dataKey="name" stroke="#A7D8FF" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#A7D8FF" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }} />
                  <Legend />
                  <Line type="monotone" dataKey="chat" stroke="#FFD700" name="CS" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="deposit" stroke="#3b82f6" name="Deposit" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="withdrawal" stroke="#ef4444" name="Withdrawal" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <Link href="/dashboard/asset-performance" className="block mt-2 text-right">
            <span className="text-xs text-[#A7D8FF] hover:text-[#FFD700] transition-colors">
              Click to see detailed breakdown →
            </span>
          </Link>
        </div>

        {/* KOLOM 3: OFFICER PERFORMANCE */}
        <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-6">
          <Link href="/dashboard/officers-performance" className="block group">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-[#FFD700]">📊 Officer Performance</h3>
              <div className="text-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <div className="h-64 flex flex-col items-center justify-center">
              {loadingOfficerPie ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
              ) : officerPieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="70%">
                    <PieChart>
                      <Pie
                        data={officerPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {officerPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0B1A33', borderColor: '#FFD700' }}
                        formatter={(value, name) => [`${value} transactions`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="text-xs text-[#A7D8FF] mt-2">
                    Total: {officerPieData.reduce((sum, item) => sum + item.value, 0)} transactions
                  </div>
                </>
              ) : (
                <div className="text-[#A7D8FF] text-sm text-center">No transaction data this month</div>
              )}
            </div>
            
            <div className="mt-2 text-right text-xs text-[#A7D8FF] group-hover:text-[#FFD700] transition-colors">
              Click to see detailed performance →
            </div>
          </Link>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="mt-8 pt-6 border-t border-[#FFD700]/20">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">Performance & Settings Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {menuItems.map((item, index) => {
            if (item.adminOnly && !isAdmin) return null;
            return (
              <a key={index} href={item.href} className="bg-[#1A2F4A] p-5 rounded-xl border border-[#FFD700]/30 hover:border-[#FFD700] hover:shadow-[0_0_25px_#FFD700] transition-all">
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