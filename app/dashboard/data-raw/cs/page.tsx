'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ChatCSPage() {
  const [time, setTime] = useState(new Date().toLocaleTimeString())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK TO DATA RAW
        </Link>
        <div className="text-[#A7D8FF] text-sm">
          {time}
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">CHAT CS DATA RAW</h1>
      
      <div className="bg-[#1A2F4A] p-6 rounded-lg border border-[#FFD700]/30 text-center">
        <p className="text-[#A7D8FF] text-lg">
          Halaman CS Data Raw - <span className="text-[#FFD700]">Versi 2.0</span>
        </p>
        <p className="text-green-400 mt-4 text-sm">
          ✅ Berhasil di-deploy pada: {new Date().toLocaleDateString('id-ID')}
        </p>
      </div>
    </div>
  )
}