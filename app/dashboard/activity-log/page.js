'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ActivityLogPage() {
  const { user, isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [officerMap, setOfficerMap] = useState({});

  useEffect(() => {
    fetchOfficers();
    fetchAllActivities();
  }, []);

  // MARK AS READ
  useEffect(() => {
    if (activities.length > 0) {
      const latestTimestamp = activities[0].timestamp || activities[0].changed_at;
      localStorage.setItem('lastReadActivity', latestTimestamp);
      window.dispatchEvent(new Event('activityRead'));
    }
  }, [activities]);

  const fetchOfficers = async () => {
    try {
      const { data } = await supabase
        .from('officers')
        .select('id, panel_id, full_name, email');
      
      const map = (data || []).reduce((acc, officer) => {
        acc[officer.id] = officer.panel_id || officer.full_name || officer.email;
        return acc;
      }, {});
      setOfficerMap(map);
    } catch (error) {
      console.error('Error fetching officers:', error);
    }
  };

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      
      // 1. AMBIL DARI MEAL ALLOWANCE SNAPSHOT
      const { data: mealData, error: mealError } = await supabase
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
        .order('last_edited_at', { ascending: false });

      if (mealError) throw mealError;

      // 2. AMBIL DARI AUDIT LOGS (Semua module)
      let auditQuery = supabase
        .from('audit_logs')
        .select(`
          *,
          officers!changed_by (panel_id, full_name, email)
        `)
        .order('changed_at', { ascending: false });

      // Apply filters
      if (filter !== 'all') {
        auditQuery = auditQuery.eq('action', filter.toUpperCase());
      }
      if (moduleFilter !== 'all') {
        auditQuery = auditQuery.eq('module', moduleFilter);
      }

      const { data: auditData, error: auditError } = await auditQuery;

      if (auditError) throw auditError;

      // 3. AMBIL DATA ADMIN UNTUK MEAL ALLOWANCE
      const adminIds = [...new Set(mealData.map(item => item.last_edited_by).filter(Boolean))];
      let adminMap = {};
      
      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('officers')
          .select('id, panel_id, full_name, email')
          .in('id', adminIds);
        
        adminMap = (admins || []).reduce((acc, admin) => {
          acc[admin.id] = admin.panel_id || admin.full_name || admin.email;
          return acc;
        }, {});
      }

      // 4. FORMAT MEAL ALLOWANCE ACTIVITIES
      const mealActivities = (mealData || []).map(item => ({
        id: `meal-${item.last_edited_at}-${item.officer_name}`,
        module: 'MEAL_ALLOWANCE',
        action: 'UPDATE',
        officer: item.officer_name,
        bulan: item.bulan,
        timestamp: item.last_edited_at,
        adminName: adminMap[item.last_edited_by] || 'System',
        changes: formatMealChanges(item),
        icon: getMealIcon(item),
        table_name: 'meal_allowance_snapshot'
      }));

      // 5. FORMAT AUDIT LOGS ACTIVITIES (Semua module)
      const auditActivities = (auditData || []).map(item => {
        const changes = formatChanges(item.old_data, item.new_data, item.table_name);
        const icon = getActionIcon(item.action);
        
        return {
          id: `audit-${item.changed_at}-${item.id}`,
          module: item.module || item.table_name?.toUpperCase() || 'UNKNOWN',
          action: item.action,
          officer: item.new_data?.full_name || item.old_data?.full_name || '-',
          bulan: new Date(item.changed_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          timestamp: item.changed_at,
          adminName: item.officers?.panel_id || item.officers?.full_name || officerMap[item.changed_by] || 'System',
          changes: changes,
          icon: icon,
          table_name: item.table_name,
          old_data: item.old_data,
          new_data: item.new_data
        };
      });

      // 6. GABUNGIN & SORTIR
      const allActivities = [...mealActivities, ...auditActivities]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // FORMAT CHANGES - Universal formatter
  // ===========================================
  const formatChanges = (oldData, newData, tableName) => {
    if (!oldData && newData) return ['➕ Insert new record'];
    if (oldData && !newData) return ['❌ Delete record'];
    if (!oldData || !newData) return ['📝 Updated'];

    const changes = [];
    const oldJson = typeof oldData === 'string' ? JSON.parse(oldData) : oldData;
    const newJson = typeof newData === 'string' ? JSON.parse(newData) : newData;

    // Cari field yang berubah
    for (const key in newJson) {
      if (JSON.stringify(oldJson[key]) !== JSON.stringify(newJson[key])) {
        // Skip field yang gak perlu
        if (['id', 'created_at', 'updated_at', 'imported_at'].includes(key)) continue;
        
        let oldValue = oldJson[key];
        let newValue = newJson[key];
        
        // Format berdasarkan tipe data
        if (key.includes('date') || key.includes('_at')) {
          oldValue = oldValue ? new Date(oldValue).toLocaleString('id-ID') : 'empty';
          newValue = newValue ? new Date(newValue).toLocaleString('id-ID') : 'empty';
        } else if (typeof oldValue === 'boolean' || typeof newValue === 'boolean') {
          oldValue = oldValue ? '✓' : '✗';
          newValue = newValue ? '✓' : '✗';
        } else if (oldValue === null || oldValue === undefined) {
          oldValue = 'empty';
        } else if (newValue === null || newValue === undefined) {
          newValue = 'empty';
        }

        // Mapping field name biar lebih user-friendly
        const fieldName = getFieldLabel(key, tableName);
        
        changes.push(`${fieldName}: ${oldValue} → ${newValue}`);
      }
    }

    return changes.length > 0 ? changes : ['📝 Updated data'];
  };

  const getFieldLabel = (field, tableName) => {
    const labels = {
      // Officers
      full_name: 'Name',
      role: 'Role',
      department: 'Department',
      status: 'Status',
      room: 'Room',
      panel_id: 'Panel ID',
      employee_id: 'Employee ID',
      email: 'Email',
      phone: 'Phone',
      telegram_id: 'Telegram',
      bank_account: 'Bank Account',
      passport_number: 'Passport',
      nationality: 'Nationality',
      gender: 'Gender',
      notes: 'Notes',
      join_date: 'Join Date',
      
      // Bank Accounts
      bank: 'Bank Name',
      account_name: 'Account Name',
      account_number: 'Account Number',
      role: 'Role',
      asset: 'Asset',
      display_used: 'Display Status',
      
      // Transactions
      deposit_amount: 'Deposit Amount',
      withdrawal_amount: 'Withdrawal Amount',
      status: 'Status',
      handler: 'Handler',
      remarks: 'Remarks',
      
      // Default
      default: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    };
    
    return labels[field] || labels.default;
  };

  // ===========================================
  // FORMAT MEAL ALLOWANCE CHANGES
  // ===========================================
  const formatMealChanges = (item) => {
    const changes = [];
    if (item.kasbon > 0) changes.push(`Kasbon: 0 → $${item.kasbon}`);
    if (item.cuti_count > 0) changes.push(`Cuti: 0 → ${item.cuti_count} hari`);
    if (item.etc !== 0) {
      changes.push(`ETC: 0 → ${item.etc > 0 ? '+' : ''}${item.etc}`);
    }
    if (item.etc_note && item.etc_note.trim() !== '') {
      changes.push(`Note: "" → "${item.etc_note}"`);
    }
    return changes.length > 0 ? changes : ['📝 Updated meal allowance'];
  };

  const getMealIcon = (item) => {
    if (item.kasbon > 0) return '💰';
    if (item.cuti_count > 0) return '🏖️';
    if (item.etc !== 0) return '🔄';
    return '🍽️';
  };

  const getActionIcon = (action) => {
    switch(action?.toUpperCase()) {
      case 'INSERT': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '❌';
      case 'UPLOAD': return '📤';
      default: return '📝';
    }
  };

  const getActionColor = (action) => {
    switch(action?.toUpperCase()) {
      case 'INSERT': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'UPDATE': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'DELETE': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'UPLOAD': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getModuleIcon = (module) => {
    const icons = {
      'OFFICERS': '👤',
      'BANK_ACCOUNTS': '🏦',
      'ASSETS': '💎',
      'MEAL_ALLOWANCE': '🍽️',
      'DEPOSIT': '💰',
      'WITHDRAWAL': '💸',
      'SUPPORT_LINE': '💬',
      'UNKNOWN': '📋'
    };
    return icons[module] || '📋';
  };

  const formatTimeAgo = (timestamp) => {
    const past = new Date(timestamp);
    const now = new Date();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return past.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique modules for filter
  const modules = ['all', ...new Set(activities.map(a => a.module).filter(Boolean))];

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* Header dengan tombol back */}
      <div className="mb-6 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-[#FFD700]">Activity Log</h1>
      </div>

      {/* Filter Section */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[#FFD700] text-sm font-bold">Filter:</span>
          
          {/* Action Filter */}
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-1.5 text-sm text-white"
          >
            <option value="all">All Actions</option>
            <option value="insert">Insert</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="upload">Upload</option>
          </select>

          {/* Module Filter */}
          <select 
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-1.5 text-sm text-white"
          >
            {modules.map(module => (
              <option key={module} value={module}>
                {module === 'all' ? 'All Modules' : module}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchAllActivities}
            className="ml-auto p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        {/* Header dengan total count */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#FFD700]">All Activities</h2>
          <span className="text-sm text-[#A7D8FF]">
            {activities.length} total updates
          </span>
        </div>

        {/* List activities */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#FFD700]/20 scrollbar-track-transparent">
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div 
                key={`${activity.id}-${idx}`} 
                className="border-l-4 border-[#FFD700] pl-4 py-3 hover:bg-[#1A2F4A]/30 transition-colors rounded-r-lg"
              >
                <div className="flex items-start gap-3">
                  {/* Icon Module */}
                  <span className="text-2xl">{getModuleIcon(activity.module)}</span>
                  
                  <div className="flex-1">
                    {/* Header dengan action dan module */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getActionColor(activity.action)}`}>
                        {getActionIcon(activity.action)} {activity.action}
                      </span>
                      <span className="text-xs bg-[#1A2F4A] px-2 py-0.5 rounded-full text-[#FFD700] border border-[#FFD700]/30">
                        {activity.module}
                      </span>
                      {activity.table_name && activity.table_name !== activity.module && (
                        <span className="text-xs bg-[#1A2F4A] px-2 py-0.5 rounded-full text-[#A7D8FF] border border-[#FFD700]/20">
                          {activity.table_name}
                        </span>
                      )}
                    </div>
                    
                    {/* Officer Name (if applicable) */}
                    {activity.officer && activity.officer !== '-' && (
                      <div className="text-sm text-[#FFD700] mb-1">
                        👤 {activity.officer}
                      </div>
                    )}
                    
                    {/* Changes */}
                    <div className="text-white text-sm mb-2 space-y-1">
                      {activity.changes.map((change, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="text-[#A7D8FF] min-w-[4px]">•</span>
                          <span>{change}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A7D8FF] mt-2">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-white">{activity.adminName}</span>
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                      <span>•</span>
                      <span className="px-2 py-0.5 bg-[#1A2F4A] rounded-full text-xs border border-[#FFD700]/20">
                        {activity.bulan}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-[#A7D8FF]">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg">Belum ada aktivitas</p>
              <p className="text-sm mt-2 opacity-70">Edit data untuk memulai</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}