'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

// ===========================================
// TYPES
// ===========================================

type Asset = {
  id: string
  asset_name: string
  asset_code: string
}

type WinloseUpload = {
  id: string
  file_name: string
  total_rows: number
  status: string
  website: string
  period_start: string
  period_end: string
  active_unique_players: number
  upload_date: string
  created_at: string
}

type WinloseTransaction = {
  account_id: string
  product_type: string
  bet_count: number
  turnover: number
  net_turnover: number
  member_win: number
  member_comm: number
  member_total: number
  games_fee: number
  jackpot_win: number
  pvp_player_payout: number
  pvp_table_fee: number
  website: string
  file_name: string
  period_start: string
  period_end: string
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function WinloseDataRawPage() {
  
  // Data states
  const [uploads, setUploads] = useState<WinloseUpload[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('Januari')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [selectedAsset, setSelectedAsset] = useState('all')
  
  // Upload modal states
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

  // ===========================================
  // INITIAL DATA
  // ===========================================

  useEffect(() => {
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
        .select('id, asset_name, asset_code')
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
      
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
      const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`

      let query = supabase
        .from('winlose_uploads')
        .select('*')
        .gte('period_start', startDate)
        .lte('period_end', endDate)
        .order('period_start', { ascending: true })

      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset)
        if (asset) {
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
  // PARSE FUNCTIONS
  // ===========================================

  const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '').trim()
      if (cleaned === '' || cleaned === '-' || cleaned === ' - ') return 0
      const parsed = parseFloat(cleaned)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
  }

  const parseString = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number') return value.toString()
    return String(value) || ''
  }

  // ===========================================
  // PARSE DATE DARI BERBAGAI FORMAT
  // ===========================================
  
  const parseDate = (dateStr: string): string => {
    if (!dateStr) return ''
    
    try {
      const monthMap: { [key: string]: string } = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      }
      
      const match = dateStr.match(/(\d{2})-(\w{3})-(\d{4})/)
      if (match) {
        const day = match[1].padStart(2, '0')
        const monthStr = match[2].toLowerCase()
        const year = match[3]
        const month = monthMap[monthStr] || '01'
        return `${year}-${month}-${day}`
      }
      
      const matchIso = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/)
      if (matchIso) {
        return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`
      }
      
      return ''
    } catch {
      return ''
    }
  }

  // ===========================================
  // DETEKSI FORMAT FILE
  // ===========================================

  const detectFormat = (rows: any[][]): 'consolidate' | 'summary' => {
    const firstRow = rows[0]
    if (!firstRow) return 'summary'
    
    const firstRowStr = firstRow.join(' ').toLowerCase()
    if (firstRowStr.includes('consolidate') && firstRowStr.includes('from:')) {
      return 'consolidate'
    }
    
    if (firstRowStr.includes('winloss summary') || firstRowStr.includes('win/loss summary')) {
      return 'summary'
    }
    
    const secondRow = rows[1]
    if (secondRow) {
      const secondRowStr = secondRow.join(' ').toLowerCase()
      if (secondRowStr.includes('product name') && secondRowStr.includes('account id')) {
        return 'summary'
      }
    }
    
    return 'summary'
  }

  // ===========================================
  // EKSTRAK PERIODE DARI BERBAGAI FORMAT
  // ===========================================

  const extractPeriod = (rows: any[][]): { periodStart: string, periodEnd: string } => {
    let periodStart = ''
    let periodEnd = ''
    
    const firstRow = rows[0]
    if (firstRow) {
      const firstRowStr = firstRow.join(' ')
      
      const fromToMatch = firstRowStr.match(/From:\s*([\d\w-:\s]+?)\s*To:\s*([\d\w-:\s]+)/i)
      if (fromToMatch) {
        periodStart = parseDate(fromToMatch[1])
        periodEnd = parseDate(fromToMatch[2])
      }
      
      if (!periodStart) {
        const fromToMatch2 = firstRowStr.match(/From\s*:\s*([\d\w-:\s]+?)\s*To\s*:\s*([\d\w-:\s]+)/i)
        if (fromToMatch2) {
          periodStart = parseDate(fromToMatch2[1])
          periodEnd = parseDate(fromToMatch2[2])
        }
      }
    }
    
    return { periodStart, periodEnd }
  }

  // ===========================================
  // EKSTRAK ACTIVE UNIQUE PLAYERS
  // ===========================================

  const extractActivePlayers = (rows: any[][]): number => {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i]
      if (!row) continue
      
      const rowStr = row.join(' ').toLowerCase()
      if (rowStr.includes('active unique player') || rowStr.includes('active players')) {
        const match = rowStr.match(/(\d+)/)
        if (match) {
          return parseInt(match[1]) || 0
        }
      }
    }
    return 0
  }

  // ===========================================
  // PROCESS FILE (UNIVERSAL)
  // ===========================================

  const processFile = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    setUploadProgress('Membaca file...')
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      }) as any[][]
      
      console.log('📋 Total baris:', rows.length)
      console.log('📋 5 baris pertama:', rows.slice(0, 5))
      
      const format = detectFormat(rows)
      console.log('📋 Format file:', format)
      
      const { periodStart, periodEnd } = extractPeriod(rows)
      console.log('📅 PERIODE:', { periodStart, periodEnd })
      
      if (!periodStart || !periodEnd) {
        throw new Error('Gagal membaca periode dari file. Pastikan file memiliki format "From: ... To: ..." di baris pertama.')
      }
      
      let activePlayers = extractActivePlayers(rows)
      console.log('👥 Active Players (dari metadata):', activePlayers)
      
      let headerRowIndex = -1
      for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const row = rows[i]
        if (!row) continue
        
        const rowStr = row.join(' ').toLowerCase()
        if (rowStr.includes('account id') || rowStr.includes('account_id') || rowStr.includes('accountid')) {
          headerRowIndex = i
          break
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('Tidak menemukan baris header (Account ID)')
      }
      
      const headers = rows[headerRowIndex]
      const dataRows = rows.slice(headerRowIndex + 1)
      
      console.log('📊 HEADER:', headers)
      console.log('📊 Data rows:', dataRows.length)
      
      const findIndex = (keywords: string[]) => {
        return headers.findIndex((h: string) => {
          if (!h) return false
          const headerStr = h.toString().toLowerCase()
          return keywords.some(keyword => headerStr.includes(keyword.toLowerCase()))
        })
      }
      
      const idx = {
        account: findIndex(['account id', 'account_id', 'accountid']),
        product: findIndex(['product name', 'product_type', 'product type']),
        betCount: findIndex(['bet count', 'betcount', 'bet_count']),
        turnover: findIndex(['turnover']),
        netTurnover: findIndex(['net turnover', 'netturnover', 'net_turnover']),
        memberWin: findIndex(['member win', 'memberwin', 'member_win']),
        memberComm: findIndex(['member comm', 'membercomm', 'member_comm']),
        memberTotal: findIndex(['member total', 'membertotal', 'member_total']),
        gamesFee: findIndex(['games fee', 'gamesfee', 'games_fee']),
        jackpotWin: findIndex(['jackpot win', 'jackpotwin', 'jackpot_win']),
        pvpPayout: findIndex(['pvp player payout', 'pvpplayerpayout', 'pvp_player_payout']),
        pvpFee: findIndex(['pvp table fee', 'pvptablefee', 'pvp_table_fee'])
      }
      
      console.log('📊 INDEX MAPPING:', idx)
      
      setUploadProgress('Memvalidasi data...')
      
      const validTransactions: WinloseTransaction[] = []
      const fileName = parseString(selectedFile.name)
      const website = 'XLY'
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (!row || row.length === 0) continue
        
        const accountVal = row[idx.account]?.toString() || ''
        if (accountVal.includes('Grand Total') || accountVal === '' || accountVal === 'Grand Total') continue
        if (accountVal.includes('Sub Total')) continue
        
        validTransactions.push({
          account_id: parseString(row[idx.account]),
          product_type: parseString(row[idx.product]),
          bet_count: parseNumber(row[idx.betCount]),
          turnover: parseNumber(row[idx.turnover]),
          net_turnover: parseNumber(row[idx.netTurnover]),
          member_win: parseNumber(row[idx.memberWin]),
          member_comm: parseNumber(row[idx.memberComm]),
          member_total: parseNumber(row[idx.memberTotal]),
          games_fee: parseNumber(row[idx.gamesFee]),
          jackpot_win: parseNumber(row[idx.jackpotWin]),
          pvp_player_payout: parseNumber(row[idx.pvpPayout]),
          pvp_table_fee: parseNumber(row[idx.pvpFee]),
          website: website,
          file_name: fileName,
          period_start: periodStart,
          period_end: periodEnd
        })
      }

      console.log('✅ Data valid:', validTransactions.length)
      
      if (validTransactions.length === 0) {
        throw new Error('Tidak ada data valid dalam file')
      }

      // Hitung unique players dari data yang valid
      const uniqueAccounts = new Set()
      validTransactions.forEach(tx => {
        const cleanAccount = tx.account_id.replace(/^XLY/i, '')
        uniqueAccounts.add(cleanAccount)
      })
      const activePlayersFromData = uniqueAccounts.size
      
      // Pilih yang lebih besar (metadata kadang lebih akurat, tapi kalo 0 pake dari data)
      const finalActivePlayers = activePlayers > 0 ? activePlayers : activePlayersFromData
      console.log('👥 Final Active Players:', finalActivePlayers)

      // INSERT BATCH KE TRANSACTIONS
      setUploadProgress(`Menyimpan ${validTransactions.length} transaksi...`)
      
      const batchSize = 500
      for (let i = 0; i < validTransactions.length; i += batchSize) {
        const batch = validTransactions.slice(i, i + batchSize)
        const { error } = await supabase
          .from('winlose_transactions')
          .insert(batch)
        
        if (error) throw error
        setUploadProgress(`Menyimpan... ${Math.min(i + batchSize, validTransactions.length)}/${validTransactions.length}`)
      }

      // INSERT KE UPLOADS TRACKING
      setUploadProgress('Menyimpan tracking upload...')

      const { error: uploadError } = await supabase
        .from('winlose_uploads')
        .insert({
          file_name: fileName,
          total_rows: validTransactions.length,
          status: 'completed',
          website: website,
          period_start: periodStart,
          period_end: periodEnd,
          active_unique_players: finalActivePlayers,
          upload_date: new Date().toISOString().split('T')[0]
        })
      
      if (uploadError) console.error('Error insert upload:', uploadError)

      alert(`✅ Berhasil! 
• ${validTransactions.length} data transaksi
• Periode: ${periodStart} - ${periodEnd}
• Active Players: ${finalActivePlayers}`)
      
      setShowModal(false)
      setSelectedFile(null)
      fetchUploads()
      
    } catch (error: any) {
      console.error('❌ Error:', error)
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  // ===========================================
  // RENDER
  // ===========================================

  if (loading && uploads.length === 0) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
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

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">WINLOSE DATA RAW</h1>

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
          <option value="all">SEMUA ASSET</option>
          {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.asset_name}</option>)}
        </select>

        <div className="ml-auto text-[#A7D8FF]">
          Total: <span className="text-[#FFD700] font-bold">{uploads.length}</span> file
        </div>
      </div>

      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">No</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Periode</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Active Players</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Data</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {uploads.length > 0 ? uploads.map((item, index) => (
              <tr key={item.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                <td className="px-4 py-3">{index + 1}</td>
                <td className="px-4 py-3 text-[#A7D8FF]">{item.file_name}</td>
                <td className="px-4 py-3">
                  {item.period_start} s/d {item.period_end}
                </td>
                <td className="px-4 py-3">{item.active_unique_players}</td>
                <td className="px-4 py-3">{item.total_rows} data</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>{item.status}</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Tidak ada data untuk periode ini</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Win/Lose</h2>
            <p className="text-sm text-[#A7D8FF] mb-4">
              Upload file Consolidate Report atau Winloss Summary By Product (.xlsx, .xls, .csv)
            </p>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer ${dragActive ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5'}`}
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
                  <p className="text-sm text-[#A7D8FF]">{(selectedFile.size / 1024).toFixed(2)} KB</p>
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
            
            {uploadProgress && (
              <div className="mb-4 text-sm text-[#A7D8FF] text-center">{uploadProgress}</div>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => { setShowModal(false); setSelectedFile(null); setUploadProgress(''); }} 
                className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded"
              >
                Batal
              </button>
              <button 
                onClick={processFile} 
                disabled={!selectedFile || uploading} 
                className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0B1A33] border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
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