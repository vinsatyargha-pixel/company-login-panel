'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

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
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

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
    setSelectedDate(date)
    setShowModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const processExcelFile = async () => {
    if (!uploadFile || !selectedDate) return
    
    setUploading(true)
    
    try {
      // Baca file Excel
      const data = await uploadFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      console.log('Data dari Excel:', jsonData)
      
      // TODO: Validasi dan mapping kolom
      // TODO: Insert ke tabel deposit_report
      // TODO: Insert ke tabel deposit_uploads untuk tracking
      
      alert(`Berhasil baca ${jsonData.length} baris dari file`)
      
      // Close modal & refresh
      setShowModal(false)
      setUploadFile(null)
      loadUploads()
      
    } catch (error) {
      console.error('Error:', error)
      alert('Gagal proses file: ' + error.message)
    } finally {
      setUploading(false)
    }
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
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link> &gt;{' '}
        <Link href="/dashboard/data-raw" className="hover:text-blue-600">Data Raw</Link> &gt;{' '}
        <span className="text-blue-600 font-semibold">DP Data Raw</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deposit Data Raw</h1>
          <p className="text-gray-600 mt-1">Upload file Excel deposit per tanggal</p>
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
            <div key={`${month.month}-${month.year}`} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header Bulan */}
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

              {/* List Tanggal */}
              {selectedMonth === month.month && (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {month.days.map((day) => (
                    <div key={day.date} className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Status Indicator */}
                        {day.uploadStatus === 'processing' ? (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        ) : day.uploadStatus === 'failed' ? (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        ) : day.hasUpload ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                        )}
                        
                        {/* Tanggal */}
                        <span className="text-sm">
                          {day.day} {month.month.split(' ')[0]} {month.year}
                        </span>

                        {/* Badge Status */}
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
                        
                        {/* Nama File */}
                        {day.hasUpload && day.fileName && (
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {day.fileName}
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
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

              {/* Summary */}
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

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Upload File Deposit</h2>
            <p className="text-sm text-gray-600 mb-4">
              Tanggal: <span className="font-semibold">{selectedDate}</span>
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mb-4 w-full"
            />
            
            {uploadFile && (
              <p className="text-sm text-green-600 mb-4">
                File: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Batal
              </button>
              <button
                onClick={processExcelFile}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {uploading ? 'Memproses...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
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
              <p>• Klik tombol Upload pada tanggal yang ingin diisi</p>
              <p>• Pilih file Excel dengan format yang sesuai</p>
              <p>• Sistem akan membaca dan menyimpan data deposit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}