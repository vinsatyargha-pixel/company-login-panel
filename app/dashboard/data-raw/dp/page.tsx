'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

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
  // STATE
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [uploads, setUploads] = useState<DepositUpload[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // STATE UPLOAD MODAL
  const [showModal, setShowModal] = useState<boolean>(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState<boolean>(false)

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
  // UPLOAD HANDLER - BEBAS 1 KALI LEMPAR
  // ===========================================

  const handleUploadClick = () => {
    setShowModal(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const processExcelFile = async () => {
    if (!uploadFile) return
    
    setUploading(true)
    
    try {
      // Baca file Excel
      const data = await uploadFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      console.log('Data dari Excel:', jsonData)
      
      // 🔥 KELOMPOKKAN BERDASARKAN APPROVED DATE
      const groupedByDate: { [key: string]: any[] } = {}
      
      jsonData.forEach((row: any) => {
        // Ambil approved_date (format: "28-Feb-2026 23:31:15")
        const approvedDateStr = row['Approved Date']
        if (!approvedDateStr) return
        
        // Konversi ke format YYYY-MM-DD
        const dateObj = new Date(approvedDateStr)
        const dateKey = dateObj.toISOString().split('T')[0] // 2026-02-28
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = []
        }
        groupedByDate[dateKey].push(row)
      })
      
      console.log('Data per tanggal:', groupedByDate)
      
      // 🔥 INSERT KE DATABASE PER TANGGAL
      let totalInserted = 0
      const uploadResults = []
      
      for (const [date, rows] of Object.entries(groupedByDate)) {
        // Insert batch untuk tanggal ini
        const { data: insertedData, error } = await supabase
          .from('deposit_report')
          .insert(rows.map((row: any) => ({
            nomor: row['No.'],
            brand: row['Brand'],
            ticket_number: row['Ticket Number'],
            requested_date: row['Requested Date'],
            approved_date: row['Approved Date'],
            bank_statement_date: row['Bank Statement Date'],
            user_name: row['User Name'],
            player_group: row['Player Group'],
            full_name: row['Full Name'],
            payment_type: row['Payment Type'],
            deposit_amount: row['Deposit Amount'],
            admin_fee: row['Admin Fee'],
            agent_fee: row['Agent Fee'],
            player_fee: row['Player Fee'],
            nett_amount: row['Nett Amount'],
            player_bank: row['Player Bank'],
            bank_title: row['Bank Title'],
            remarks: row['Remarks'],
            reference: row['Reference'],
            status: row['Status'],
            reason: row['Reason'],
            handler: row['Handler'],
            handler_ip: row['HandlerIP'],
            creator: row['Creator'],
            website: row['Website'],
            referral_code: row['Referral Code'],
            own_referral_code: row['Own Referral Code'],
            bonus: row['Bonus'],
            statement_status: row['Statement Status'],
            file_name: uploadFile.name
          })))
          .select()
        
        if (error) throw error
        
        totalInserted += rows.length
        uploadResults.push({
          date,
          count: rows.length,
          status: 'completed'
        })
      }
      
      // 🔥 UPDATE TABEL UPLOADS untuk tracking per tanggal
      for (const result of uploadResults) {
        await supabase
          .from('deposit_uploads')
          .insert({
            upload_date: result.date,
            file_name: uploadFile.name,
            total_rows: result.count,
            status: result.status
          })
      }
      
      alert(`✅ Berhasil! ${totalInserted} data dari ${Object.keys(groupedByDate).length} tanggal berbeda`)
      
      setShowModal(false)
      setUploadFile(null)
      fetchUploads() // Refresh tampilan
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleViewData = (date: string) => {
    alert(`Lihat data untuk tanggal ${date} (Fitur dalam pengembangan)`)
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#FFD700]">DEPOSIT DATA RAW</h1>
          <p className="text-[#A7D8FF] mt-2">Upload file Excel, sistem otomatis kelompokkan per tanggal</p>
        </div>
        <button
          onClick={handleUploadClick}
          className="bg-[#FFD700] text-[#0B1A33] px-6 py-3 rounded-lg font-bold hover:bg-[#FFD700]/80 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload File Excel
        </button>
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
          <div className="text-sm text-[#A7D8FF]">Tanggal Terisi</div>
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
                        <div className="text-xs text-gray-500 px-2 py-1">
                          Kosong
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="px-4 py-2 bg-[#0B1A33]/50 text-xs text-gray-400 flex justify-between border-t border-[#FFD700]/30">
                <span>✅ Terisi: {uploadedDays - failedDays}</span>
                {pendingDays > 0 && (
                  <span className="text-yellow-400">⏳ Proses: {pendingDays}</span>
                )}
                {failedDays > 0 && (
                  <span className="text-red-400">❌ Gagal: {failedDays}</span>
                )}
                <span className="text-gray-500">⚪ Kosong: {totalDays - uploadedDays}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Deposit</h2>
            <p className="text-sm text-[#A7D8FF] mb-4">
              Pilih file Excel. Sistem akan otomatis mengelompokkan data berdasarkan <span className="text-[#FFD700] font-medium">Approved Date</span>.
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mb-4 w-full text-white"
            />
            
            {uploadFile && (
              <div className="bg-[#0B1A33] p-3 rounded-lg mb-4">
                <p className="text-sm text-green-400">File: {uploadFile.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(uploadFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setUploadFile(null)
                }}
                className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded transition-colors"
              >
                Batal
              </button>
              <button
                onClick={processExcelFile}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Memproses...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="mt-8 bg-[#1A2F4A] border border-[#FFD700]/30 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-[#FFD700]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-[#FFD700]">✨ Cara Kerja</h3>
            <div className="mt-1 text-sm text-[#A7D8FF] space-y-1">
              <p>• Upload 1 file Excel berisi banyak transaksi</p>
              <p>• Sistem otomatis kelompokkan berdasarkan kolom <span className="text-[#FFD700]">Approved Date</span></p>
              <p>• Setiap tanggal yang muncul akan otomatis ter-ceklist ✅</p>
              <p>• Total file: {uploads.length} | Total data: {uploads.reduce((sum, u) => sum + (u.total_rows || 0), 0)} baris</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}