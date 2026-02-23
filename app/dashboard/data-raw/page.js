'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function DataRawPage() {
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
      <h1 className="text-3xl font-bold text-[#FFD700] mb-4">📥 DATA RAW</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link href="/dashboard/data-raw/cs" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-blue-400">CS Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Customer Service Data</p>
        </Link>
        <Link href="/dashboard/data-raw/dp" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-green-400">DP Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Deposit Data</p>
        </Link>
        <Link href="/dashboard/data-raw/wd" className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 hover:border-[#FFD700]">
          <h2 className="text-xl font-bold text-orange-400">WD Data Raw</h2>
          <p className="text-[#A7D8FF] text-sm mt-2">Import Withdrawal Data</p>
        </Link>
      </div>
    </div>
  );
}