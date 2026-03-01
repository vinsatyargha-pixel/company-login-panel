'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'  // ← PAKAI INI!
import { useAuth } from '@/hooks/useAuth'  // ← Kalo perlu
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as XLSX from 'xlsx'

export default function DPDataRawPage() {
  const { user, isAdmin } = useAuth()  // ← PAKAI INI kalo perlu cek role
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [monthData, setMonthData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadUploads()
  }, [user])

  async function loadUploads() {
    const { data, error } = await supabase
      .from('deposit_uploads')
      .select('upload_date, status, file_name, total_rows')
      .order('upload_date', { ascending: false })

    if (!error && data) {
      generateMonthStructure(data)
    }
    setLoading(false)
  }

  function generateMonthStructure(uploadsData) {
    const months = {}
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
  }

  const handleUploadClick = (date) => {
    setSelectedDate(date)
    setShowModal(true)
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const processExcelFile = async () => {
    if (!uploadFile || !selectedDate) return
    
    setUploading(true)
    
    try {
      const data = await uploadFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      alert(`Berhasil baca ${jsonData.length} baris dari file`)
      
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

  const handleViewData = (date) => {
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
        <Link href="/dashboard">Dashboard</Link> &gt;{' '}
        <Link href="/dashboard/data-raw">Data Raw</Link> &gt;{' '}
        <span className="text-blue-600 font-semibold">DP Data Raw</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Deposit Data Raw</h1>
          <p className="text-gray-600 mt-1">Upload file Excel deposit per tanggal</p>
        </div>
        {isAdmin && (
          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            Admin Mode
          </span>
        )}
      </div>

      {/* Grid Bulan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {monthData.map((month) => {
          const totalDays = month.days.length
          const uploadedDays = month.days.filter(d => d.hasUpload).length
          
          return (
            <div key={`${month.month}-${month.year}`} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header Bulan */}
              <div 
                className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center cursor-pointer"
                onClick={() => setSelectedMonth(selectedMonth === month.month ? null : month.month)}
              >
                <h3 className="font-semibold text-gray-800">{month.month}</h3>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {uploadedDays}/{totalDays}
                </span>
              </div>

              {/* List Tanggal */}
              {selectedMonth === month.month && (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {month.days.map((day) => (
                    <div key={day.date} className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          day.hasUpload ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm">
                          {day.day} {month.month.split(' ')[0]} {month.year}
                        </span>
                        {day.hasUpload && day.fileName && (
                          <span className="text-xs text-gray-500">{day.fileName}</span>
                        )}
                      </div>
                      {day.hasUpload ? (
                        <button onClick={() => handleViewData(day.date)} className="text-xs text-blue-600">
                          Lihat ({day.totalData})
                        </button>
                      ) : (
                        <button onClick={() => handleUploadClick(day.date)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal Upload */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Upload File Deposit</h2>
            <p className="text-sm text-gray-600 mb-4">Tanggal: {selectedDate}</p>
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="mb-4 w-full" />
            {uploadFile && (
              <p className="text-sm text-green-600 mb-4">File: {uploadFile.name}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Batal</button>
              <button onClick={processExcelFile} disabled={!uploadFile || uploading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400">
                {uploading ? 'Memproses...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}