'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type DepositUpload = {
  id: string
  upload_date: string
  file_name: string
  total_rows: number
  status: string
}

export default function DPDataRawPage() {
  const [uploads, setUploads] = useState<DepositUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  
  // State untuk modal upload
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  
  const years = ['2025', '2026', '2027']

  useEffect(() => {
    // Set default ke bulan dan tahun saat ini
    const today = new Date()
    setSelectedMonth(months[today.getMonth()])
    setSelectedYear(today.getFullYear().toString())
    
    fetchUploads()
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchUploads()
    }
  }, [selectedMonth, selectedYear])

  const fetchUploads = async () => {
    try {
      setLoading(true)
      
      // Konversi nama bulan ke angka
      const monthIndex = months.indexOf(selectedMonth) + 1
      const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
      const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-31`

      const { data, error } = await supabase
        .from('deposit_uploads')
        .select('*')
        .gte('upload_date', startDate)
        .lte('upload_date', endDate)
        .order('upload_date', { ascending: true })

      if (error) throw error
      setUploads(data || [])
      
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===========================================
  // UPLOAD HANDLER
  // ===========================================

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const processExcelFile = async () => {
    if (!uploadFile) return
    
    setUploading(true)
    
    try {
      const data = await uploadFile.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Kelompokkan berdasarkan approved_date
      const groupedByDate: { [key: string]: any[] } = {}
      
      jsonData.forEach((row: any) => {
        const approvedDateStr = row['Approved Date']
        if (!approvedDateStr) return
        
        const dateObj = new Date(approvedDateStr)
        const dateKey = dateObj.toISOString().split('T')[0]
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = []
        }
        groupedByDate[dateKey].push(row)
      })
      
      // Insert ke deposit_report
      let totalInserted = 0
      const uploadResults = []
      
      for (const [date, rows] of Object.entries(groupedByDate)) {
        const { error } = await supabase
          .from('deposit_report')
          .insert(rows.map((row: any) => ({
            ticket_number: row['Ticket Number'],
            approved_date: row['Approved Date'],
            user_name: row['User Name'],
            deposit_amount: row['Deposit Amount'],
            status: row['Status'],
            file_name: uploadFile.name
          })))
        
        if (error) throw error
        
        totalInserted += rows.length
        uploadResults.push({ date, count: rows.length })
      }
      
      // Insert ke deposit_uploads
      for (const result of uploadResults) {
        await supabase
          .from('deposit_uploads')
          .insert({
            upload_date: result.date,
            file_name: uploadFile.name,
            total_rows: result.count,
            status: 'completed'
          })
      }
      
      alert(`✅ Berhasil! ${totalInserted} data dari ${uploadResults.length} tanggal`)
      
      setShowModal(false)
      setUploadFile(null)
      fetchUploads()
      
    } catch (error: any) {
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Generate array tanggal dalam bulan
  const getDaysInMonth = () => {
    if (!selectedMonth || !selectedYear) return []
    
    const monthIndex = months.indexOf(selectedMonth)
    const daysInMonth = new Date(parseInt(selectedYear), monthIndex + 1, 0).getDate()
    
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const upload = uploads.find(u => u.upload_date === dateStr)
      
      return {
        date: dateStr,
        day,
        upload
      }
    })
  }

  const days = getDaysInMonth()
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
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline inline-block mb-4">
          ← BACK TO DATA RAW
        </Link>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#FFD700]">DEPOSIT DATA RAW</h1>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#FFD700] text-[#0B1A33] px-4 py-2 rounded-lg font-bold hover:bg-[#FFD700]/80"
          >
            + Upload Excel
          </button>
        </div>
      </div>

      {/* Filter Bulan & Tahun */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex gap-4">
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <div className="flex-1 text-right text-[#A7D8FF]">
          Total Data: <span className="text-[#FFD700] font-bold">{totalData}</span> baris
        </div>
      </div>

      {/* Tabel */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">Tanggal</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Data</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {days.map(({ date, day, upload }) => (
              <tr key={date} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                <td className="px-4 py-3">
                  {day} {selectedMonth} {selectedYear}
                </td>
                <td className="px-4 py-3">
                  {upload ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-green-400">Terupload</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                      <span className="text-gray-400">Kosong</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {upload?.file_name || '-'}
                </td>
                <td className="px-4 py-3">
                  {upload?.total_rows || '-'}
                </td>
                <td className="px-4 py-3">
                  {upload ? (
                    <button className="text-green-400 hover:text-green-300 text-sm">
                      Lihat Detail
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-[#A7D8FF] text-right">
        <span className="bg-[#1A2F4A] px-4 py-2 rounded-lg border border-[#FFD700]/30">
          ✅ Terisi: {uploads.length} hari | ⚪ Kosong: {days.length - uploads.length} hari
        </span>
      </div>

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Deposit</h2>
            <p className="text-sm text-[#A7D8FF] mb-4">
              Pilih file Excel. Sistem akan otomatis mengelompokkan data berdasarkan Approved Date.
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="mb-4 w-full text-white"
            />
            
            {uploadFile && (
              <div className="bg-[#0B1A33] p-3 rounded-lg mb-4">
                <p className="text-sm text-green-400">{uploadFile.name}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setUploadFile(null)
                }}
                className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded"
              >
                Batal
              </button>
              <button
                onClick={processExcelFile}
                disabled={!uploadFile || uploading}
                className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50"
              >
                {uploading ? 'Memproses...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}