'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DPDataRawPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('deposit_uploads')
          .select('*')
        
        if (error) throw error
        console.log('Data dari Supabase:', data)
        setData(data || [])
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
        <h1 className="text-2xl text-red-400 mb-4">Error:</h1>
        <pre className="bg-red-900/50 p-4 rounded">{error}</pre>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <h1 className="text-3xl text-[#FFD700] mb-4">TEST DP PAGE</h1>
      <p className="mb-4">Data dari deposit_uploads: {data.length} row</p>
      <pre className="bg-[#1A2F4A] p-4 rounded overflow-auto max-h-96">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}