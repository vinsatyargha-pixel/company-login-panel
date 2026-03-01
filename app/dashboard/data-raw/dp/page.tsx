'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

type UploadRecord = {
  upload_date: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  file_name: string
  total_rows: number
}

export default function DPDataRawPage() {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAccess()
    loadUploads()
  }, [])

  async function checkAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(false)
  }

  async function loadUploads() {
    const { data, error } = await supabase
      .from('deposit_uploads')
      .select('upload_date, status, file_name, total_rows')
      .order('upload_date', { ascending: false })

    if (!error && data) {
      generateMonthStructure(data)
    }
  }

  function generateMonthStructure(uploadsData: UploadRecord[]) {
    const months: { [key: string]: MonthData } = {}
    const today = new Date()
    
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
    setLoading(false)
  }

  const handleUploadClick = (date: string) => {
    alert(`Upload untuk tanggal ${date}`)
  }

  const handleViewData = (date: string) => {
    router.push(`/dashboard/data-raw/dp/${date}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link> &gt;{' '}
        <Link href="/dashboard/data-raw" className="hover:text-blue-600">Data Raw</Link> &gt;{' '}
        <span className="text-blue-600 font-semibold">DP Data Raw</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deposit Data Raw</h1>
          <p className="text-gray-600 mt-1">Kelola file import deposit per bulan</p>
        </div>
        <button 
          onClick={() => handleUploadClick(new Date().toISOString().split('T')[0])}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import File Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthData.map((month) => {
          const totalDays = month.days.length
          const uploadedDays = month.days.filter(d => d.hasUpload).length
          const pendingDays = month.days.filter(d => d.uploadStatus === 'processing').length
          const failedDays = month.days.filter(d => d.uploadStatus === 'failed').length
          
          return (
            <div key={`${month.month}-${month.year}`} className="bg-white rounded-lg shadow overflow-hidden">
              <div 
                className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center cursor-pointer hover:bg-gray-100"
                onClick={() => setSelectedMonth(selectedMonth === month.month ? null : month.month)}
              >
                <h3 className="font-semibold text-gray-800">{month.month}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {uploadedDays}/{totalDays}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${selectedMonth === month.month ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {selectedMonth === month.month && (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {month.days.map((day) => (
                    <div key={day.date} className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {day.uploadStatus === 'processing' ? (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        ) : day.uploadStatus === 'failed' ? (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        ) : day.hasUpload ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                        
                        <span className="text-sm">
                          {day.day} {month.month.split(' ')[0]} {month.year}
                        </span>

                        {day.uploadStatus === 'processing' && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Processing
                          </span>
                        )}
                        
                        {day.uploadStatus === 'failed' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Failed
                          </span>
                        )}
                        
                        {day.hasUpload && day.fileName && (
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {day.fileName}
                          </span>
                        )}
                      </div>

                      {day.hasUpload ? (
                        <button 
                          onClick={() => handleViewData(day.date)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Lihat Data ({day.totalData || 0})
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUploadClick(day.date)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 flex justify-between border-t">
                <span>✅ Sukses: {uploadedDays - failedDays} hari</span>
                {pendingDays > 0 && (
                  <span className="text-yellow-600">⏳ Proses: {pendingDays}</span>
                )}
                {failedDays > 0 && (
                  <span className="text-red-600">❌ Gagal: {failedDays}</span>
                )}
                <span className="text-gray-500">⚪ Sisa: {totalDays - uploadedDays} hari</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Informasi</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>• <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span> Hijau = File sudah diupload</p>
              <p>• <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-1"></span> Kuning = Sedang diproses</p>
              <p>• <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span> Merah = Gagal upload</p>
              <p>• <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1"></span> Abu = Belum ada file</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}