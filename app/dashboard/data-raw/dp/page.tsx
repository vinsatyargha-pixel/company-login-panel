'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DPDataRawPage() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('deposit_uploads')
        .select('*')
        .order('upload_date', { ascending: false })
      
      console.log('Data uploads:', data)
      setUploads(data || [])
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="p-6 text-white">Loading...</div>
  }

  return (
    <div className="p-6 text-white">
      <Link href="/dashboard/data-raw" className="text-[#FFD700] mb-4 inline-block">
        ← BACK TO DATA RAW
      </Link>
      
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">DEPOSIT DATA RAW</h1>
      
      <div className="bg-[#1A2F4A] p-4 rounded-lg">
        <h2 className="text-xl mb-4">Daftar File Upload</h2>
        <pre className="text-sm">
          {JSON.stringify(uploads, null, 2)}
        </pre>
      </div>
    </div>
  )
}