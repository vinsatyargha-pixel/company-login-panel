// @ts-nocheck
'use client'

import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ChatCSPage() {
  const [uploads, setUploads] = useState([])

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const { data } = await supabase
        .from('chat_uploads')
        .select('*')
        .order('upload_date', { ascending: false })
      setUploads(data || [])
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK TO DATA RAW
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">CHAT CS DATA RAW</h1>
      
      <div className="bg-[#1A2F4A] p-4 rounded-lg">
        <p className="text-[#A7D8FF]">
          Total uploads: <span className="text-[#FFD700] font-bold">{uploads.length}</span>
        </p>
      </div>
    </div>
  )
}