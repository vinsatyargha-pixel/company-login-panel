'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

// Type sesuai dengan struktur database yang asli
type DepositUpload = {
  id: string
  upload_date: string
  file_name: string
  file_url: string | null
  uploaded_at: string
  uploaded_by: string | null
  total_rows: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  notes: string | null
}

type MonthData = {
  month: string
  monthNum: number
  year: number
  days: {
    date: string
    day: number
    hasUpload: boolean
    uploadStatus?: string
    fileName?: string
    totalData?: number
  }[]
}

export default function DPDataRawPage() {
  const [uploads, setUploads] = useState<DepositUpload[]>([])
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('deposit_uploads')
        .select('*')
        .order('upload_date', { ascending: false })

      if (error) throw error
      
      console.log('Data uploads:', data)
      setUploads(data || [])
      generateMonthStructure(data || [])
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthStructure = (uploadsData: DepositUpload[]) => {
    const months: { [key: string]: MonthData } = {}
    const today = new Date()
    
    // Generate 6 bulan terakhir
    for (let i = 0; i < 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
      const monthName = date.toLocaleString('id-ID', { month: 'long' })
      
      months[monthKey] = {
        month: `${monthName} ${date.getFullYear()}`,
        monthNum: date.getMonth() + 1,
        year: date.getFullYear(),
        days: []
      }
      
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
      for (let d = 1; d <= daysInMonth; d++) {
        const dayDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const upload = uploadsData.find(u => u.upload_date === dayDate)
        
        months[monthKey].days.push({
          date: dayDate,
          day: d,
          hasUpload: !!upload,
          uploadStatus: upload?.status,
          fileName: upload?.file_name,
          totalData: upload?.total_rows
        })
      }
    }
    
    setMonthData(Object.values(months))
  }

  const totalData = uploads.reduce((sum, u) => sum + (u.total_rows || 0), 0)

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline inline-block mb-4">
        ← BACK TO DATA RAW
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FFD700]">DEPOSIT DATA RAW</h1>
        <p className="text-[#A7D8FF] mt-2">Total Files: {uploads.length} | Total Data: {totalData} baris</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthData.map((month) => {
          const totalDays = month.days.length
          const uploadedDays = month.days.filter(d => d.hasUpload).length
          
          return (
            <div key={month.month} className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
              <div 
                className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30 flex justify-between items-center cursor-pointer"
                onClick={() => setSelectedMonth(selectedMonth === month.month ? null : month.month)}
              >
                <h3 className="font-semibold text-[#FFD700]">{month.month}</h3>
                <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded">
                  {uploadedDays}/{totalDays}
                </span>
              </div>

              {selectedMonth === month.month && (
                <div className="divide-y divide-[#FFD700]/10 max-h-96 overflow-y-auto">
                  {month.days.map((day) => (
                    <div key={day.date} className="px-4 py-2 hover:bg-[#0B1A33]/50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${day.hasUpload ? 'bg-green-500' : 'bg-gray-500'}`} />
                        <span className="text-sm">
                          {day.day} {month.month.split(' ')[0]} {month.year}
                        </span>
                        {day.hasUpload && (
                          <span className="text-xs text-gray-400 truncate max-w-[150px]">
                            {day.fileName} ({day.totalData} data)
                          </span>
                        )}
                      </div>
                      {day.hasUpload ? (
                        <span className="text-xs text-green-400">✓ Terupload</span>
                      ) : (
                        <span className="text-xs text-gray-500">Kosong</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}