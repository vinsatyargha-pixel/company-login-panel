'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type ChatUpload = {
  id: string
  upload_date: string
  file_name: string
  total_rows: number
  status: string
  website?: string
}

export default function ChatCSPage() {
  const [uploads, setUploads] = useState<ChatUpload[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      const { data } = await supabase
        .from('chat_uploads')
        .select('*')
        .order('upload_date', { ascending: false })
      setUploads(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

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
      setSelectedFile(files[0])
    }
  }, [])

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null
    try {
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value)
        if (!date) return null
        const hour = date.H?.toString().padStart(2, '0') || '00'
        const minute = date.M?.toString().padStart(2, '0') || '00'
        const second = date.S?.toString().padStart(2, '0') || '00'
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')} ${hour}:${minute}:${second}`
      }
      return value.toString().trim()
    } catch {
      return null
    }
  }

  const processFile = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setUploadProgress('Membaca file...')
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false }) as any[][]
      const headers = rows[0]
      const dataRows = rows.slice(1)
      
      const findIndex = (keyword: string) => headers.findIndex(h => h && h.toString().toLowerCase().includes(keyword.toLowerCase()))
      
      const idx = {
        started: findIndex('started'),
        username: findIndex('username'),
        website: findIndex('website')
      }
      
      setUploadProgress('Memvalidasi data...')
      
      const validData: any[] = []
      const uploadDates = new Set<string>()
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (!row || row.length === 0) continue
        
        const started = parseExcelDate(row[idx.started])
        if (!started) continue
        
        const dateOnly = started.split(' ')[0]
        uploadDates.add(dateOnly)
        
        validData.push({
          started: started,
          username: row[idx.username] || null,
          website: row[idx.website] || 'XLY',
          file_name: selectedFile.name
        })
      }

      if (validData.length === 0) throw new Error('Tidak ada data valid')

      setUploadProgress(`Menyimpan ${validData.length} data...`)
      
      const { error } = await supabase.from('chat_cs_data').insert(validData)
      if (error) throw error

      await supabase.from('chat_uploads').insert({
        upload_date: new Date().toISOString().split('T')[0],
        file_name: selectedFile.name,
        total_rows: validData.length,
        status: 'completed',
        website: validData[0]?.website || 'XLY'
      })

      alert(`✅ Berhasil! ${validData.length} data`)
      setShowModal(false)
      setSelectedFile(null)
      fetchUploads()
      
    } catch (error: any) {
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  if (loading) {
    return <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
    </div>
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">← BACK</Link>
        <button onClick={() => setShowModal(true)} className="bg-[#FFD700] text-black px-4 py-2 rounded font-bold hover:bg-[#FFD700]/80">
          UPLOAD EXCEL
        </button>
      </div>
      
      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">CHAT CS DATA RAW</h1>

      <div className="bg-[#1A2F4A] p-4 rounded-lg mb-6">
        <p className="text-[#A7D8FF]">
          Total Uploads: <span className="text-[#FFD700] font-bold">{uploads.length}</span>
        </p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#1A2F4A] p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File</h2>
            <div className={`border-2 border-dashed p-8 text-center ${dragActive ? 'border-[#FFD700]' : 'border-[#FFD700]/30'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" id="fileInput"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              <button onClick={() => document.getElementById('fileInput')?.click()} className="text-[#FFD700]">
                {selectedFile ? `✓ ${selectedFile.name}` : 'Klik atau geser file'}
              </button>
            </div>
            {uploadProgress && <div className="text-sm text-[#A7D8FF] mt-2">{uploadProgress}</div>}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400">Batal</button>
              <button onClick={processFile} disabled={!selectedFile || uploading} className="px-4 py-2 bg-[#FFD700] text-black rounded font-bold disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}