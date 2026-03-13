// @ts-nocheck
'use client'

// GANTI DARI @/lib/supabase JADI PATH RELATIF
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function ChatCSPage() {
  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK TO DATA RAW
        </Link>
      </div>
      <h1 className="text-3xl font-bold text-[#FFD700]">CHAT CS DATA RAW</h1>
      <p className="text-[#A7D8FF] mt-4">Halaman CS Data Raw</p>
    </div>
  )
}