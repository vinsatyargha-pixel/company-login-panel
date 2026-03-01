'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DPDataRawPage() {
  useEffect(() => {
    async function test() {
      const { data, error } = await supabase
        .from('deposit_uploads')
        .select('*')
      
      console.log('DATA:', data)
      console.log('ERROR:', error)
    }
    test()
  }, [])

  return (
    <div className="p-6 text-white">
      <Link href="/dashboard/data-raw" className="text-[#FFD700] mb-4 inline-block">
        ← BACK TO DATA RAW
      </Link>
      <h1 className="text-3xl font-bold text-[#FFD700]">DEPOSIT DATA RAW</h1>
      <p className="mt-4 text-green-400">Halaman berhasil di-load!</p>
      <p className="text-sm text-gray-400">Cek console (F12) untuk data dari Supabase</p>
    </div>
  )
}