'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
        <Link href="/dashboard" className="text-[#FFD700] mb-4 inline-block">
          ← BACK TO DASHBOARD
        </Link>
        <div className="text-center py-20 text-red-400">Akses ditolak - Hanya untuk Admin</div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      <Link href="/dashboard" className="text-[#FFD700] mb-4 inline-block">
        ← BACK TO DASHBOARD
      </Link>
      <h1 className="text-3xl font-bold text-[#FFD700] mb-4">⚙️ SETTINGS</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link href="/dashboard/settings/access-role" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-purple-400">Access Role Editing</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Edit user roles & permissions</p>
        </Link>
        <Link href="/dashboard/settings/reset-password" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-yellow-400">Reset Password Staff</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Reset password for staff</p>
        </Link>
      </div>
    </div>
  );
}