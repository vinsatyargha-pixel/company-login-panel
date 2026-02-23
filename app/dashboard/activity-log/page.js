'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ActivityLogPage() {
  const { isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllActivities();
  }, []);

  // MARK AS READ - jalan SETELAH activities berhasil di-fetch
  useEffect(() => {
    if (activities.length > 0) {
      const latestTimestamp = activities[0].timestamp;
      localStorage.setItem('lastReadActivity', latestTimestamp);
      window.dispatchEvent(new Event('activityRead'));
      console.log('✅ Activity marked as read:', latestTimestamp);
    }
  }, [activities]);

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

      // 2. AMBIL DARI AUDIT LOGS (Officers)
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          *,
          officers!changed_by (full_name, email)
        `)
        .order('changed_at', { ascending: false });

      if (auditError) throw auditError;

      // 3. AMBIL DATA ADMIN UNTUK MEAL ALLOWANCE
      const adminIds = [...new Set(mealData.map(item => item.last_edited_by).filter(Boolean))];
      let adminMap = {};
      
      if (adminIds.length > 0) {
        const { data: admins } = await supabase
          .from('officers')
          .select('id, full_name, email')
          .in('id', adminIds);
        
        adminMap = (admins || []).reduce((acc, admin) => {
          acc[admin.id] = admin.full_name || admin.email;
          return acc;
        }, {});
      }

      // 4. FORMAT MEAL ALLOWANCE ACTIVITIES
      const mealActivities = (mealData || []).map(item => ({
        id: `meal-${item.last_edited_at}`,
        module: 'Meal Allowance',
        officer: item.officer_name,
        bulan: item.bulan,
        timestamp: item.last_edited_at,
        adminName: adminMap[item.last_edited_by] || 'Admin',
        changes: formatMealChanges(item),
        icon: getMealIcon(item)
      }));

      // 5. FORMAT AUDIT LOGS ACTIVITIES (Officers)
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
          id: `audit-${item.changed_at}`,
          module: 'Officers',
          officer: item.new_data?.full_name || item.old_data?.full_name || 'Unknown',
          bulan: new Date(item.changed_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          timestamp: item.changed_at,
          adminName: item.officers?.full_name || item.officers?.email || 'Admin',
          changes: changes,
          icon: icon
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
  // FORMAT CHANGES UNTUK MEAL ALLOWANCE
  // ===========================================
  const formatMealChanges = (item) => {
    const changes = [];
    if (item.kasbon > 0) changes.push(`💰 Kasbon: $${item.kasbon}`);
    if (item.cuti_count > 0) changes.push(`🏖️ Cuti: ${item.cuti_count} hari`);
    if (item.etc !== 0) {
      changes.push(`🔄 ETC: ${item.etc > 0 ? '+' : ''}${item.etc}`);
    }
    if (item.etc_note && item.etc_note.trim() !== '') {
      changes.push(`📝 Note: "${item.etc_note}"`);
    }
    return changes;
  };

  const getMealIcon = (item) => {
    if (item.kasbon > 0) return '💰';
    if (item.cuti_count > 0) return '🏖️';
    if (item.etc !== 0) return '🔄';
    return '🍽️';
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
    const past = new Date(timestamp);
    return past.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

      {/* Main content */}
      <div className="bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        {/* Header dengan total count */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#FFD700]">All Activities</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A7D8FF]">
              {activities.length} total updates
            </span>
            <button
              onClick={fetchAllActivities}
              className="p-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] rounded-lg text-[#FFD700] transition-all"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
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
                  <span className="text-xl">{activity.icon}</span>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-[#1A2F4A] px-2 py-0.5 rounded-full text-[#FFD700] border border-[#FFD700]/30">
                        {activity.module}
                      </span>
                      <span className="font-bold text-[#FFD700]">{activity.officer}</span>
                    </div>
                    
                    <div className="text-white text-sm mb-1 space-y-1">
                      {activity.changes.map((change, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="text-[#A7D8FF] min-w-[4px]">•</span>
                          <span>{change}</span>
                        </div>
                      ))}
                    </div>
                    
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