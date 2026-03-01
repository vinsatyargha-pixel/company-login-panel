'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ===========================================
// TYPE DEFINITIONS - Data konkrit & detail
// ===========================================

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
  days: DayData[]
}

type DayData = {
  date: string
  day: number
  hasUpload: boolean
  uploadStatus?: 'pending' | 'processing' | 'completed' | 'failed'
  fileName?: string
  totalData?: number
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function DPDataRawPage() {
  // STATE dengan tipe yang jelas
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [uploads, setUploads] = useState<DepositUpload[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // ===========================================
  // EFFECT: Ambil data dari Supabase
  // ===========================================
  
  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('deposit_uploads')
        .select('*')
        .order('upload_date', { ascending: false })

      if (error) throw error

      setUploads(data || [])
      generateMonthStructure(data || [])
      
    } catch (err: any) {
      console.error('Error fetching uploads:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ===========================================
  // GENERATE STRUKTUR BULAN
  // ===========================================

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

  // ===========================================
  // HANDLERS
  // ===========================================

  const handleUploadClick = (date: string) => {
    alert(`Upload untuk tanggal ${date}`)
    // TODO: buka modal upload
  }

  const handleViewData = (date: string) => {
    alert(`Lihat data untuk tanggal ${date}`)
    // TODO: navigasi ke halaman detail
  }

  // ===========================================
  // RENDER
  // ===========================================

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
          <p className="mt-4 text-[#FFD700]">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] mb-4 inline-block">
          ← BACK TO DATA RAW
        </Link>
        <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-white">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* Breadcrumb */}
      <Link href="/dashboard/data-raw" className="text-[#FFD700] mb-4 inline-block hover:underline">
        ← BACK TO DATA RAW
      </Link>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#FFD700]">DEPOSIT DATA RAW</h1>
        <p className="text-[#A7D8FF] mt-2">Kelola file import deposit per bulan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Total Files</div>
          <div className="text-2xl font-bold text-[#FFD700]">{uploads.length}</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Total Data</div>
          <div className="text-2xl font-bold text-[#FFD700]">
            {uploads.reduce((sum, u) => sum + (u.total_rows || 0), 0)}
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Success</div>
          <div className="text-2xl font-bold text-green-400">
            {uploads.filter(u => u.status === 'completed').length}
          </div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Processing</div>
          <div className="text-2xl font-bold text-yellow-400">
            {uploads.filter(u => u.status === 'processing').length}
          </div>
        </div>
      </div>

      {/* Grid Bulan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthData.map((month) => {
          const totalDays = month.days.length
          const uploadedDays = month.days.filter(d => d.hasUpload).length
          const pendingDays = month.days.filter(d => d.uploadStatus === 'processing').length
          const failedDays = month.days.filter(d => d.uploadStatus === 'failed').length
          
          return (
            <div 
              key={`${month.month}-${month.year}`} 
              className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden"
            >
              {/* Header Bulan */}
              <div 
                className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30 flex justify-between items-center cursor-pointer hover:bg-[#0B1A33]/80"
                onClick={() => setSelectedMonth(selectedMonth === month.month ? null : month.month)}
              >
                <h3 className="font-semibold text-[#FFD700]">{month.month}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded">
                    {uploadedDays}/{totalDays}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-[#FFD700] transition-transform ${selectedMonth === month.month ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* List Tanggal */}
              {selectedMonth === month.month && (
                <div className="divide-y divide-[#FFD700]/10 max-h-96 overflow-y-auto">
                  {month.days.map((day) => (
                    <div 
                      key={day.date} 
                      className="px-4 py-2 hover:bg-[#0B1A33]/50 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        {/* Status Indicator */}
                        {day.uploadStatus === 'processing' ? (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        ) : day.uploadStatus === 'failed' ? (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        ) : day.hasUpload ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        )}
                        
                        {/* Tanggal */}
                        <span className="text-sm text-white">
                          {day.day} {month.month.split(' ')[0]} {month.year}
                        </span>

                        {/* Badge Status */}
                        {day.uploadStatus === 'processing' && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Processing
                          </span>
                        )}
                        
                        {day.uploadStatus === 'failed' && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                            Failed
                          </span>
                        )}
                        
                        {/* Nama File */}
                        {day.hasUpload && day.fileName && (
                          <span className="text-xs text-gray-400 truncate max-w-[150px]">
                            {day.fileName}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      {day.hasUpload ? (
                        <button 
                          onClick={() => handleViewData(day.date)}
                          className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/30"
                        >
                          Lihat ({day.totalData || 0})
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUploadClick(day.date)}
                          className="text-xs bg-[#FFD700]/20 text-[#FFD700] px-2 py-1 rounded hover:bg-[#FFD700]/30"
                        >
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="px-4 py-2 bg-[#0B1A33]/50 text-xs text-gray-400 flex justify-between border-t border-[#FFD700]/30">
                <span>✅ Sukses: {uploadedDays - failedDays}</span>
                {pendingDays > 0 && (
                  <span className="text-yellow-400">⏳ Proses: {pendingDays}</span>
                )}
                {failedDays > 0 && (
                  <span className="text-red-400">❌ Gagal: {failedDays}</span>
                )}
                <span className="text-gray-500">⚪ Sisa: {totalDays - uploadedDays}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Panel */}
      <div className="mt-8 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-[#FFD700]">Informasi Data</h3>
            <div className="mt-1 text-sm text-[#A7D8FF]">
              <p>• Total {uploads.length} file upload terdeteksi</p>
              <p>• Klik bulan untuk lihat detail tanggal</p>
              <p>• Tombol Upload untuk menambah file baru</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}