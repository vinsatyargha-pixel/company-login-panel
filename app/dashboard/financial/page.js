'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FinancialHomePage() {
  const [mealActivities, setMealActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMealActivities();
  }, []);

  const fetchMealActivities = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('meal_allowance_snapshot')
        .select('officer_name, kasbon, etc, etc_note, cuti_count, last_edited_by, last_edited_at, bulan')
        .not('last_edited_at', 'is', null)
        .order('last_edited_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Ambil data admin
      const adminIds = [...new Set(data?.map(item => item.last_edited_by).filter(Boolean) || [])];
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

      // Format data
      const formatted = (data || []).map(item => ({
        ...item,
        adminName: adminMap[item.last_edited_by] || 'Admin',
        changes: formatChanges(item)
      }));

      setMealActivities(formatted);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChanges = (item) => {
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

  const menuItems = [
    {
      title: 'Meal Allowance',
      description: 'Uang Makan Officer',
      icon: '🍗',
      href: '/dashboard/financial/meal-allowance',
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-500'
    },
    {
      title: 'Laundry Allowance',
      description: 'Uang Laundry Officer',
      icon: '👕',
      href: '/dashboard/financial/laundry-allowance',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-500'
    },
    {
      title: 'Salary',
      description: 'Gaji Officer',
      icon: '💵',
      href: '/dashboard/financial/salary',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-500'
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-[#0B1A33] text-white">
      {/* Header dengan Tombol Back */}
      <div className="mb-8 flex items-center gap-4">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 bg-[#1A2F4A] hover:bg-[#2A3F5A] text-[#FFD700] px-4 py-2 rounded-lg border border-[#FFD700]/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-3xl font-bold text-[#FFD700]">FINANCIAL SUMMARY</h1>
      </div>

      {/* MENU VERTIKAL */}
      <div className="space-y-4 mb-8">
        {menuItems.map((item, index) => (
          <Link key={index} href={item.href} className="block group">
            <div className="bg-gradient-to-br from-[#0B1A33] via-[#1A2F4A] to-[#0B1A33] border-2 border-[#FFD700] rounded-xl p-6 hover:shadow-[0_0_30px_#FFD700] transition-all duration-500 flex items-center gap-6">
              {/* Icon gede di kiri */}
              <div className={`w-24 h-24 rounded-full ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                <span className={`text-5xl ${item.textColor}`}>{item.icon}</span>
              </div>
              
              {/* Title & description di kanan icon */}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#FFD700] mb-2">{item.title}</h2>
                <p className="text-[#A7D8FF] text-lg">{item.description}</p>
              </div>
              
              {/* Arrow di kanan */}
              <div className="ml-auto">
                <svg className="w-8 h-8 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* RECENT ACTIVITY MEAL ALLOWANCE */}
      <div className="bg-[#0B1A33] rounded-xl shadow-lg border border-[#FFD700]/30 p-6">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">🍽️ Recent Meal Allowance Updates</h2>
        
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30 animate-pulse">
                <div className="h-4 bg-[#0B1A33] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[#0B1A33] rounded w-1/2"></div>
              </div>
            ))
          ) : mealActivities.length > 0 ? (
            mealActivities.slice(0, 5).map((act, idx) => (
              <div key={idx} className="bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30 hover:bg-[#1A2F4A]/80 transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🍽️</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#FFD700]">{act.officer_name}</span>
                      <span className="text-xs bg-[#0B1A33] px-2 py-0.5 rounded-full text-[#A7D8FF]">
                        {act.bulan}
                      </span>
                    </div>
                    
                    <div className="text-white text-sm mt-1">
                      {act.changes?.map((change, i) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="text-[#A7D8FF]">•</span>
                          <span>{change}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-[#A7D8FF] mt-2">
                      <span>by {act.adminName}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(act.last_edited_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-[#A7D8FF]">
              <p>Belum ada aktivitas Meal Allowance</p>
              <p className="text-sm mt-1">Edit data Meal Allowance untuk memulai</p>
            </div>
          )}
        </div>

        {mealActivities.length > 0 && (
          <div className="mt-4 pt-3 border-t border-[#FFD700]/20 text-right">
            <Link 
              href="/dashboard/financial/meal-allowance"
              className="text-sm text-[#FFD700] hover:text-[#FFD700]/80 transition-colors"
            >
              View all Meal Allowance →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}