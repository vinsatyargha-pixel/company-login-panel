'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type Asset = {
  id: string
  asset_name: string
  asset_code: string
}

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
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const years = ['2025', '2026', '2027']

  useEffect(() => {
    const today = new Date()
    setSelectedMonth(months[today.getMonth()])
    setSelectedYear(today.getFullYear().toString())
    fetchAssets()
    fetchUploads()
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchUploads()
    }
  }, [selectedMonth, selectedYear, selectedAsset])

  const fetchAssets = async () => {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, asset_name, asset_code')
        .order('asset_name')
      setAssets(data || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  const fetchUploads = async () => {
    try {
      setLoading(true)
      
      const monthIndex = months.indexOf(selectedMonth) + 1
      const monthPadded = String(monthIndex).padStart(2, '0')
      
      // FILTER DENGAN FORMAT YYYY-MM-DD (bawaan Postgres)
      const startDate = `${selectedYear}-${monthPadded}-01`
      
      // Hitung tanggal terakhir bulan
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
      const endDate = `${selectedYear}-${monthPadded}-${lastDay}`

      let query = supabase
        .from('chat_uploads')
        .select('*')
        .gte('upload_date', startDate)
        .lte('upload_date', endDate)
        .order('upload_date', { ascending: true })

      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset)
        if (asset) {
          query = query.eq('website', asset.asset_code)
        }
      }

      const { data } = await query
      setUploads(data || [])
    } catch (error) {
      console.error('Error fetching uploads:', error)
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

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null
    try {
      // Handle Excel serial number
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value)
        if (!date) return null
        const hour = date.H?.toString().padStart(2, '0') || '00'
        const minute = date.M?.toString().padStart(2, '0') || '00'
        const second = date.S?.toString().padStart(2, '0') || '00'
        // FORMAT UNTUK DATABASE: YYYY-MM-DD
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')} ${hour}:${minute}:${second}`
      }
      
      const str = value.toString().trim()
      
      // Format DD/MM/YY: 13/03/26 09:32
      if (str.includes('/')) {
        const parts = str.split(' ')
        if (parts.length >= 2) {
          const [datePart, timePart] = parts
          const [day, month, year] = datePart.split('/')
          if (day && month && year) {
            const fullYear = year.length === 2 ? '20' + year : year
            // FORMAT UNTUK DATABASE: YYYY-MM-DD
            return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`
          }
        }
      }
      
      // Format ISO: 2026-12-03 23:50:00
      if (str.includes('-') && str.includes(':')) {
        const [datePart, timePart] = str.split(' ')
        if (datePart && timePart) {
          const [year, month, day] = datePart.split('-')
          if (year && month && day) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${timePart}`
          }
        }
      }
      
      return str
    } catch {
      return null
    }
  }

  const parsePercentage = (value: string): number | null => {
    if (!value) return null
    const match = value.match(/(\d+(?:\.\d+)?)%/)
    return match ? parseFloat(match[1]) : null
  }

  const parseArrayField = (value: string): string[] | null => {
    if (!value || value === '-' || value === ' -') return null
    return value.split(',').map(item => item.trim()).filter(item => item)
  }

  const formatDisplayDate = (dateStr: string): string => {
    try {
      // dateStr = '2026-03-13' (YYYY-MM-DD dari database)
      const [year, month, day] = dateStr.split('-')
      const monthIndex = parseInt(month) - 1
      return `${parseInt(day)} ${months[monthIndex]} ${year}`
    } catch {
      return dateStr
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
        account: findIndex('account'),
        group: findIndex('group'),
        website: findIndex('website'),
        conversation_id: findIndex('conversation id'),
        started: findIndex('started'),
        ended: findIndex('ended'),
        chat_duration: findIndex('chat duration'),
        username: findIndex('username'),
        total_replies: findIndex('total replies'),
        replied_by_bot: findIndex('replied by bot'),
        replied_by_agent: findIndex('replied by agent'),
        status: findIndex('status'),
        agent_alias: findIndex('agent alias'),
        agent_email: findIndex('agent email'),
        agent_name: findIndex('agent name'),
        resolve_duration: findIndex('resolve duration'),
        chat_prompt_id: findIndex('chat prompt id'),
        intents: findIndex('intent(s)'),
        emotional_sentiment: findIndex('emotional sentiment'),
        agent_real_name: findIndex('agent real name')
      }
      
      setUploadProgress('Memvalidasi data...')
      
      const validData: any[] = []
      const uploadDates = new Set<string>()
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (!row || row.length === 0) continue
        
        const started = parseExcelDate(row[idx.started])
        const ended = parseExcelDate(row[idx.ended])
        
        if (!started && !ended) continue
        
        // Ambil tanggal dari started (prioritas) atau ended
        const dateForUpload = started ? started.split(' ')[0] : (ended ? ended.split(' ')[0] : null)
        if (dateForUpload) uploadDates.add(dateForUpload)
        
        const botStr = row[idx.replied_by_bot]?.toString() || ''
        const agentStr = row[idx.replied_by_agent]?.toString() || ''
        
        const botMatch = botStr.match(/(\d+)/)
        const agentMatch = agentStr.match(/(\d+)/)
        
        const replied_by_bot = botMatch ? parseInt(botMatch[1]) : 0
        const replied_by_agent = agentMatch ? parseInt(agentMatch[1]) : 0
        
        validData.push({
          account: row[idx.account] || null,
          group: row[idx.group] || null,
          website: row[idx.website] || 'LUCKY77',
          conversation_id: row[idx.conversation_id] || null,
          started: started,
          ended: ended,
          chat_duration: row[idx.chat_duration] || null,
          username: row[idx.username] || null,
          total_replies: parseInt(row[idx.total_replies]) || 0,
          replied_by_bot: replied_by_bot,
          replied_by_agent: replied_by_agent,
          bot_percentage: parsePercentage(botStr),
          agent_percentage: parsePercentage(agentStr),
          status: row[idx.status] || null,
          agent_alias: row[idx.agent_alias] || null,
          agent_email: row[idx.agent_email] || null,
          agent_name: row[idx.agent_name] || null,
          resolve_duration: row[idx.resolve_duration] || null,
          chat_prompt_id: row[idx.chat_prompt_id] ? parseInt(row[idx.chat_prompt_id]) : null,
          intents: parseArrayField(row[idx.intents]),
          emotional_sentiment: parseArrayField(row[idx.emotional_sentiment]),
          agent_real_name: row[idx.agent_real_name] || null,
          file_name: selectedFile.name
        })
      }

      if (validData.length === 0) throw new Error('Tidak ada data valid')

      setUploadProgress(`Menyimpan ${validData.length} data...`)
      
      // INSERT KE CHAT_CS_DATA
      const { error } = await supabase.from('chat_cs_data').insert(validData)
      if (error) throw error

      // INSERT KE CHAT_UPLOADS (dengan format YYYY-MM-DD)
      setUploadProgress('Menyimpan tracking upload...')
      
      for (const date of uploadDates) {
        const { error: uploadError } = await supabase.from('chat_uploads').insert({
          upload_date: date, // YYYY-MM-DD
          file_name: selectedFile.name,
          total_rows: validData.length,
          status: 'completed',
          website: 'LUCKY77'
        })

        if (uploadError) {
          console.error('❌ Gagal insert ke chat_uploads:', uploadError)
        }
      }

      alert(`✅ Berhasil! ${validData.length} data chat dari ${uploadDates.size} tanggal`)
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

  const getStatusColor = (status: string): string => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">← BACK TO DATA RAW</Link>
        <button onClick={() => setShowModal(true)} className="bg-[#FFD700] text-[#0B1A33] px-6 py-2 rounded-lg font-bold hover:bg-[#FFD700]/80 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          UPLOAD EXCEL
        </button>
      </div>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">CHAT CS DATA RAW</h1>

      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex flex-wrap gap-4 items-center">
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[120px]"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[100px]"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="all">SEMUA WEBSITE</option>
          {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.asset_name}</option>)}
        </select>

        <div className="ml-auto text-[#A7D8FF]">
          Total: <span className="text-[#FFD700] font-bold">{uploads.length}</span> file
        </div>
      </div>

      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">Tanggal</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Website</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Chat</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {uploads.length > 0 ? uploads.map(item => (
              <tr key={item.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                <td className="px-4 py-3">{formatDisplayDate(item.upload_date)}</td>
                <td className="px-4 py-3 text-[#FFD700]">{item.website || '-'}</td>
                <td className="px-4 py-3 text-[#A7D8FF]">{item.file_name}</td>
                <td className="px-4 py-3">{item.total_rows} chat</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>{item.status}</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data untuk periode ini</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Chat CS</h2>
            <div className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer ${dragActive ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}>
              <input id="fileInput" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
              {selectedFile ? (
                <div className="text-green-400"><p className="text-lg mb-2">✓ {selectedFile.name}</p><p className="text-sm text-[#A7D8FF]">{(selectedFile.size / 1024).toFixed(2)} KB</p></div>
              ) : (
                <><div className="text-4xl mb-2">📂</div><p className="text-[#FFD700] font-medium">Geser file ke sini</p><p className="text-sm text-[#A7D8FF] mt-2">atau klik untuk memilih</p><p className="text-xs text-gray-400 mt-4">Format: .xlsx, .xls, .csv</p></>
              )}
            </div>
            {uploadProgress && <div className="mb-4 text-sm text-[#A7D8FF] text-center">{uploadProgress}</div>}
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowModal(false); setSelectedFile(null); setUploadProgress(''); }} className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded">Batal</button>
              <button onClick={processFile} disabled={!selectedFile || uploading} className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#0B1A33] border-t-transparent rounded-full animate-spin"></div>Uploading...</span> : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}