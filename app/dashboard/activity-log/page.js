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

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      
      // Ambil semua aktivitas (tanpa limit)
      const { data: snapshotData, error: snapshotError } = await supabase
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

      if (snapshotError) throw snapshotError;

      // Ambil data admin
      const adminIds = [...new Set(snapshotData.map(item => item.last_edited_by).filter(Boolean))];
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

      // Format activities
      const formatted = snapshotData.map(item => ({
        id: item.last_edited_at,
        officer: item.officer_name,
        bulan: item.bulan,
        timestamp: item.last_edited_at,
        adminName: adminMap[item.last_edited_by] || 'Admin',
        changes: formatChanges(item)
      }));

      setActivities(formatted);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
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
      <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-[#FFD700]">Activity Log</h1>
      </div>

      <div className="bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#FFD700]">All Activities</h2>
          <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded-full">
            {activities.length} total updates
          </span>
        </div>

        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity, idx) => (
              <div key={idx} className="border-l-4 border-[#FFD700] pl-4 py-2 hover:bg-[#1A2F4A]/30 transition-colors rounded-r-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg">
                    {activity.changes.some(c => c.includes('kasbon')) ? '💰' : 
                     activity.changes.some(c => c.includes('cuti')) ? '🏖️' : 
                     activity.changes.some(c => c.includes('etc')) ? '🔄' : '📝'}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      <span className="text-[#FFD700]">{activity.officer}</span>
                      {activity.changes.length > 0 ? (
                        <> • {activity.changes.join(' • ')}</>
                      ) : ' • updated data'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-[#A7D8FF] mt-1">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {activity.adminName}
                      </span>
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
              <p>Belum ada aktivitas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}