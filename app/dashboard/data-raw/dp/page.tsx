'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

// ===========================================
// TYPES
// ===========================================

type DepositUpload = {
  id: string
  upload_date: string
  file_name: string
  total_rows: number
  status: 'completed' | 'processing' | 'failed'
  website?: string
}

type Asset = {
  id: string
  asset_name: string
  asset_code: string
  wlb_code?: string
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function DPDataRawPage() {
  // Data & Loading
  const [uploads, setUploads] = useState<DepositUpload[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('all')
  
  // Upload Modal
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const years = ['2025', '2026', '2027']

  // ===========================================
  // INITIAL DATA
  // ===========================================

  useEffect(() => {
    const today = new Date()
    setSelectedMonth(months[today.getMonth()])
    setSelectedYear(today.getFullYear().toString())
    
    fetchAssets()
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchUploads()
    }
  }, [selectedMonth, selectedYear, selectedAsset])

  // ===========================================
  // FETCH FUNCTIONS
  // ===========================================

  const fetchAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('id, asset_name, asset_code, wlb_code')
        .order('asset_name')
      
      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const fetchUploads = async () => {
    try {
      setLoading(true)
      
      const monthIndex = months.indexOf(selectedMonth) + 1
      const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
      const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-31`

      let query = supabase
        .from('deposit_uploads')
        .select('*')
        .gte('upload_date', startDate)
        .lte('upload_date', endDate)
        .order('upload_date', { ascending: true })

      // Filter by asset if selected
      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset)
        if (asset) {
          // Filter by website kolom (sesuaikan dengan struktur tabel lo)
          query = query.eq('website', asset.asset_code)
        }
      }

      const { data, error } = await query
      if (error) throw error
      
      setUploads(data || [])
    } catch (error) {
      console.error('Error fetching uploads:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===========================================
  // UPLOAD HANDLER
  // ===========================================

  const processExcelFile = async () => {
    if (!uploadFile) return
    
    setUploading(true)
    
    try {
      const arrayBuffer = await uploadFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // Kelompokkan berdasarkan tanggal
      const groupedByDate: { [key: string]: any[] } = {}
      
      jsonData.forEach((row: any) => {
        // Coba ambil dari Approved Date atau kolom tanggal lainnya
        const dateStr = row['Approved Date'] || row['upload_date'] || row['tanggal']
        if (!dateStr) return
        
        const dateObj = new Date(dateStr)
        const dateKey = dateObj.toISOString().split('T')[0]
        
        if (!groupedByDate[dateKey]) {
          groupedByDate[dateKey] = []
        }
        groupedByDate[dateKey].push(row)
      })
      
      // Insert ke deposit_report (opsional, kalo ada tabelnya)
      // Insert ke deposit_uploads untuk tracking
      let totalInserted = 0
      const uploadResults = []
      
      for (const [date, rows] of Object.entries(groupedByDate)) {
        // Insert ke deposit_uploads
        const { error } = await supabase
          .from('deposit_uploads')
          .insert({
            upload_date: date,
            file_name: uploadFile.name,
            total_rows: rows.length,
            status: 'completed',
            website: rows[0]?.Website || rows[0]?.website || 'XLY'
          })
        
        if (error) throw error
        
        totalInserted += rows.length
        uploadResults.push({ date, count: rows.length })
      }
      
      alert(`✅ Berhasil! ${totalInserted} data dari ${uploadResults.length} tanggal`)
      
      // Reset modal dan refresh data
      setShowModal(false)
      setUploadFile(null)
      fetchUploads()
      
    } catch (error: any) {
      console.error('Upload error:', error)
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const getDayFromDate = (dateStr: string) => {
    return new Date(dateStr).getDate()
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
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
      {/* Header with Back Button */}
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK TO DATA RAW
        </Link>
        
        {/* Upload Button - GOLD */}
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

      {/* Title */}
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">DEPOSIT DATA RAW</h1>

      {/* FILTERS - 3 Dropdown */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex gap-4 flex-wrap">
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[120px]"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[100px]"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="all">SEMUA ASSET</option>
          {assets.map(asset => (
            <option key={asset.id} value={asset.id}>
              {asset.asset_name}
            </option>
          ))}
        </select>

        {/* Summary */}
        <div className="ml-auto text-[#A7D8FF]">
          Total: <span className="text-[#FFD700] font-bold">{uploads.length}</span> file
        </div>
      </div>

      {/* TABLE */}
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
            {uploads.length > 0 ? (
              uploads.map((upload) => (
                <tr key={upload.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                  <td className="px-4 py-3">
                    {getDayFromDate(upload.upload_date)} {selectedMonth} {selectedYear}
                  </td>
                  <td className="px-4 py-3 text-[#A7D8FF]">{upload.file_name}</td>
                  <td className="px-4 py-3">{upload.total_rows} data</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(upload.status)}`}>
                      {upload.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data untuk periode ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Deposit</h2>
            <p className="text-sm text-[#A7D8FF] mb-4">
              Pilih file Excel. Sistem akan otomatis membaca data.
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="mb-4 w-full text-white"
            />
            
            {uploadFile && (
              <div className="bg-[#0B1A33] p-3 rounded-lg mb-4">
                <p className="text-sm text-green-400">{uploadFile.name}</p>
                <p className="text-xs text-gray-400">{(uploadFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
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
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}