'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Drag & Drop states
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('Maret')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [selectedAsset, setSelectedAsset] = useState('all')

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const years = ['2025', '2026', '2027']

  // ===========================================
  // FETCH UPLOADS
  // ===========================================
  
  const fetchUploads = async () => {
    try {
      setLoading(true)
      
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
      console.error('Error fetching uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [selectedMonth, selectedYear, selectedAsset])

  // ===========================================
  // DRAG & DROP HANDLERS
  // ===========================================

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = e.dataTransfer.files
    if (files && files[0]) {
      const file = files[0]
      const validTypes = ['.xlsx', '.xls', '.csv']
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      
      if (!fileExt || !validTypes.includes(`.${fileExt}`)) {
        alert('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv')
        return
      }
      
      setSelectedFile(file)
    }
  }, [])

  // ===========================================
  // PROCESS FILE
  // ===========================================

  const processFile = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      console.log('Data dari Excel:', jsonData)
      
      // Kelompokkan berdasarkan tanggal
      const groupedByDate: { [key: string]: any[] } = {}
      
      jsonData.forEach((row: any) => {
        const dateStr = row['Approved Date'] || row['upload_date'] || row['tanggal']
        if (!dateStr) return
        
        const dateObj = new Date(dateStr)
        const dateKey = dateObj.toISOString().split('T')[0]
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = []
        }
        groupedByDate[dateKey].push(row)
      })
      
      // Insert ke deposit_uploads
      let totalInserted = 0
      
      for (const [date, rows] of Object.entries(groupedByDate)) {
        const { error } = await supabase
          .from('deposit_uploads')
          .insert({
            upload_date: date,
            file_name: selectedFile.name,
            total_rows: rows.length,
            status: 'completed'
          })
        
        if (error) throw error
        totalInserted += rows.length
      }
      
      alert(`✅ Berhasil! ${totalInserted} data dari ${Object.keys(groupedByDate).length} tanggal`)
      
      // Reset & refresh
      setShowModal(false)
      setSelectedFile(null)
      fetchUploads()
      
    } catch (error: any) {
      console.error('Error:', error)
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // ===========================================
  // RENDER
  // ===========================================

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
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK TO DATA RAW
        </Link>
        
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#FFD700] text-[#0B1A33] px-6 py-2 rounded-lg font-bold hover:bg-[#FFD700]/80 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          UPLOAD EXCEL
        </button>
      </div>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">DEPOSIT DATA RAW</h1>

      {/* Filters */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex gap-4">
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-4 py-2"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(m => <option key={m}>{m}</option>)}
        </select>
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-4 py-2"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(y => <option key={y}>{y}</option>)}
        </select>
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-4 py-2"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="all">SEMUA ASSET</option>
        </select>

        <div className="ml-auto text-[#A7D8FF]">
          Total: <span className="text-[#FFD700] font-bold">{uploads.length}</span> file
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">Tanggal</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Data</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload) => {
              const day = new Date(upload.upload_date).getDate()
              return (
                <tr key={upload.id} className="border-b border-[#FFD700]/10">
                  <td className="px-4 py-3">{day} {selectedMonth} {selectedYear}</td>
                  <td className="px-4 py-3">{upload.file_name}</td>
                  <td className="px-4 py-3">{upload.total_rows} data</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">
                      {upload.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DRAG & DROP */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Deposit</h2>
            <p className="text-sm text-[#A7D8FF] mb-4">
              Geser file Excel ke area di bawah, atau klik untuk memilih
            </p>
            
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors
                ${dragActive 
                  ? 'border-[#FFD700] bg-[#FFD700]/10' 
                  : 'border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5'
                }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              
              {selectedFile ? (
                <div className="text-green-400">
                  <p className="text-lg mb-2">✓ {selectedFile.name}</p>
                  <p className="text-sm text-[#A7D8FF]">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-[#FFD700] font-medium">Geser file ke sini</p>
                  <p className="text-sm text-[#A7D8FF] mt-2">atau klik untuk memilih</p>
                  <p className="text-xs text-gray-400 mt-4">Format: .xlsx, .xls, .csv</p>
                </>
              )}
            </div>
            
            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedFile(null)
                }}
                className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded transition-colors"
              >
                Batal
              </button>
              <button
                onClick={processFile}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0B1A33] border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </span>
                ) : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}