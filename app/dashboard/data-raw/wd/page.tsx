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

type WithdrawalUpload = {
  id: string
  upload_date: string
  file_name: string
  total_rows: number
  status: string
  website?: string
}

type WithdrawalTransaction = {
  nomor: number | null
  brand: string | null
  ticket_number: string | null
  withdrawal_amount: number
  player_fee_amount: number
  agent_fee_amount: number
  nett_amount: number
  requested_date: string | null
  approved_date: string | null
  bank_statement_date: string | null
  user_name: string | null
  player_group: string | null
  full_name: string | null
  player_bank: string | null
  bank_title: string | null
  remarks: string | null
  status: string | null
  reason: string | null
  handler: string | null
  handler_ip: string | null
  creator: string | null
  website: string
  referral_code: string | null
  own_referral_code: string | null
  last_balance: number | null
  file_name: string
  duration_minutes: number | null
}

// ===========================================
// SET SESSION VARIABLE FUNCTION
// ===========================================
const setSessionVariable = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const username = user.email?.split('@')[0] || user.user_metadata?.username;
      
      if (!username) {
        console.warn('⚠️ Username tidak ditemukan');
        return;
      }
      
      console.log('🔧 Setting session variable:', username);
      
      const { error } = await supabase.rpc('set_config', {
        name: 'app.panel_id',
        value: username,
        bypass: false
      });
      
      if (error) {
        console.error('❌ Gagal set session:', error);
      } else {
        console.log('✅ Session variable set:', username);
      }
    }
  } catch (err) {
    console.error('❌ Error set session:', err);
  }
};

// ===========================================
// MAP WEBSITE NAME TO CODE (Untuk file Excel)
// ===========================================

const mapWebsiteToCode = (websiteName: string): string => {
  if (!websiteName) return 'XLY'
  
  const upperName = websiteName.toString().toUpperCase().trim()
  
  const mapping: { [key: string]: string } = {
    'LUCKY77': 'XLY',
    'LUX77': 'XLX',
    'XLY': 'XLY',
    'XLX': 'XLX'
  }
  
  return mapping[upperName] || 'XLY'
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function WDDataRawPage() {
  // Data states
  const [uploads, setUploads] = useState<WithdrawalUpload[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
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
    const today = new Date()
    setSelectedMonth(months[today.getMonth()])
    setSelectedYear(today.getFullYear().toString())
    fetchAssets()
    setSessionVariable()
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
        .from('withdrawal_uploads')
        .select('*')
        .gte('upload_date', startDate)
        .lte('upload_date', endDate)
        .order('upload_date', { ascending: true })

      // ✅ FILTER BERDASARKAN ASSET CODE (XLY atau XLX)
      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset)
        if (asset) {
          query = query.eq('website', asset.asset_code)
        }
      }

      const { data, error } = await query
      if (error) throw error
      
      console.log('📅 Data uploads:', data?.length || 0)
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
  // PARSE TANGGAL EXCEL
  // ===========================================

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

      const str = value.toString().trim()
      const cleanStr = str.split(',')[0].split('Platform')[0].trim()
      const parts = cleanStr.split(' ')
      
      if (parts.length >= 2) {
        const [datePart, timePart] = parts
        const [day, month, year] = datePart.split('-')
        
        const monthMap: any = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        }
        
        if (monthMap[month]) {
          return `${year}-${monthMap[month]}-${day.padStart(2, '0')} ${timePart}`
        }
      }
      
      return null
    } catch {
      return null
    }
  }

  // ===========================================
  // GET WEBSITE BADGE
  // ===========================================

  const getWebsiteBadge = (websiteCode: string) => {
    if (websiteCode === 'XLY') {
      return <span className="px-2 py-1 rounded text-xs font-bold bg-green-500/20 text-green-400">🎰 Lucky77 (XLY)</span>
    } else if (websiteCode === 'XLX') {
      return <span className="px-2 py-1 rounded text-xs font-bold bg-purple-500/20 text-purple-400">🎲 LUX77 (XLX)</span>
    }
    return <span className="px-2 py-1 rounded text-xs font-bold bg-gray-500/20 text-gray-400">{websiteCode || '-'}</span>
  }

  // ===========================================
  // UPLOAD PROCESS
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
      
      let headerRowIndex = -1
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row && row[0] && row[0].toString().includes('No.')) {
          headerRowIndex = i
          break
        }
      }
      
      if (headerRowIndex === -1) {
        throw new Error('Tidak menemukan baris header (No.)')
      }
      
      const dataRows = rows.slice(headerRowIndex + 1)
      console.log('📊 Jumlah baris data:', dataRows.length)
      
      const idx = {
        no: 0,
        brand: 1,
        ticket: 2,
        withdrawalAmount: 3,
        playerFee: 4,
        agentFee: 5,
        nett: 6,
        requested: 7,
        approved: 8,
        bank: 9,
        userName: 10,
        playerGroup: 11,
        fullName: 12,
        playerBank: 13,
        bankTitle: 14,
        remarks: 15,
        status: 16,
        reason: 17,
        handler: 18,
        handlerIp: 19,
        creator: 20,
        website: 21,
        referralCode: 22,
        ownReferralCode: 23,
        lastBalance: 24
      }
      
      setUploadProgress('Memvalidasi data...')
      
      const validTransactions: WithdrawalTransaction[] = []
      const transactionDates = new Set<string>()
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        if (!row || row.length === 0) continue
        
        if (row[2]?.toString().includes('GRAND TOTAL')) continue
        
        const approvedDate = parseExcelDate(row[idx.approved])
        const requestedDate = parseExcelDate(row[idx.requested])
        
        if (!approvedDate) continue
        
        let durationMinutes = null
        if (approvedDate && requestedDate) {
          const diffMs = new Date(approvedDate).getTime() - new Date(requestedDate).getTime()
          durationMinutes = diffMs / (1000 * 60)
        }
        
        const dateOnly = approvedDate.split(' ')[0]
        transactionDates.add(dateOnly)
        
        // ✅ MAPPING WEBSITE DARI EXCEL KE ASSET CODE (XLY / XLX)
        const rawWebsite = row[idx.website] || ''
        const mappedWebsite = mapWebsiteToCode(rawWebsite)
        
        validTransactions.push({
          nomor: row[idx.no] ? parseInt(row[idx.no]) || null : null,
          brand: row[idx.brand] || null,
          ticket_number: row[idx.ticket] || null,
          withdrawal_amount: parseFloat(row[idx.withdrawalAmount]) || 0,
          player_fee_amount: parseFloat(row[idx.playerFee]) || 0,
          agent_fee_amount: parseFloat(row[idx.agentFee]) || 0,
          nett_amount: parseFloat(row[idx.nett]) || 0,
          requested_date: requestedDate,
          approved_date: approvedDate,
          bank_statement_date: parseExcelDate(row[idx.bank]),
          user_name: row[idx.userName] || null,
          player_group: row[idx.playerGroup] || null,
          full_name: row[idx.fullName] || null,
          player_bank: row[idx.playerBank] || null,
          bank_title: row[idx.bankTitle] || null,
          remarks: row[idx.remarks] || null,
          status: row[idx.status] || null,
          reason: row[idx.reason] || null,
          handler: row[idx.handler] || null,
          handler_ip: row[idx.handlerIp] || null,
          creator: row[idx.creator] || null,
          website: mappedWebsite, // ✅ SUDAH PAKAI XLY ATAU XLX
          referral_code: row[idx.referralCode] || null,
          own_referral_code: row[idx.ownReferralCode] || null,
          last_balance: row[idx.lastBalance] ? parseFloat(row[idx.lastBalance]) || null : null,
          file_name: selectedFile.name,
          duration_minutes: durationMinutes
        })
      }

      console.log('✅ Data valid:', validTransactions.length)
      
      if (validTransactions.length === 0) {
        throw new Error('Tidak ada data valid dalam file')
      }

      setUploadProgress(`Menyimpan ${validTransactions.length} transaksi...`)
      
      const { error } = await supabase
        .from('withdrawal_transactions')
        .insert(validTransactions)

      if (error) throw error

      // Insert ke withdrawal_uploads untuk tracking
      setUploadProgress('Menyimpan tracking upload...')
      
      const transactionsByDate: { [key: string]: WithdrawalTransaction[] } = {}
      validTransactions.forEach(t => {
        const date = t.approved_date?.split(' ')[0]
        if (!date) return
        if (!transactionsByDate[date]) transactionsByDate[date] = []
        transactionsByDate[date].push(t)
      })

      for (const [date, transactions] of Object.entries(transactionsByDate)) {
        // ✅ TAMBAHKAN WEBSITE DI WITHDRAWAL_UPLOADS
        await supabase
          .from('withdrawal_uploads')
          .insert({
            upload_date: date,
            file_name: selectedFile.name,
            total_rows: transactions.length,
            status: 'completed',
            website: transactions[0]?.website || 'XLY'  // ✅ DEFAULT XLY
          })
      }

      // LOG KE AUDIT_LOGS
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase.from('audit_logs').insert({
          table_name: 'withdrawal_transactions',
          action: 'UPLOAD',
          new_data: { 
            count: validTransactions.length,
            filename: selectedFile.name,
            dates: Array.from(transactionDates)
          },
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
          module: 'WITHDRAWAL',
          description: `Uploaded ${validTransactions.length} withdrawal transactions from ${selectedFile.name}`
        });
        console.log('✅ Upload logged to audit_logs');
      } catch (logError) {
        console.error('❌ Error logging to audit_logs:', logError);
      }

      alert(`✅ Berhasil! ${validTransactions.length} data dari ${Object.keys(transactionsByDate).length} tanggal`)
      
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

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">WITHDRAWAL DATA RAW</h1>

      {/* FILTERS */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex flex-wrap gap-4 items-center">
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
        
        {/* ✅ DROPDOWN FILTER UNTUK 2 ASSET */}
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[220px]"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="all">🌐 SEMUA WEBSITE</option>
          {assets.map(asset => (
            <option key={asset.id} value={asset.id}>
              🎰 {asset.asset_name} ({asset.asset_code})
            </option>
          ))}
        </select>

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
              <th className="px-4 py-3 text-left text-[#FFD700]">Website</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Data</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {uploads.length > 0 ? (
              uploads.map((item) => {
                const date = new Date(item.upload_date)
                const day = date.getDate()
                const month = months[date.getMonth()]
                const year = date.getFullYear()
                
                return (
                  <tr key={item.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                    <td className="px-4 py-3">
                      {day} {month} {year}
                    </td>
                    <td className="px-4 py-3">{getWebsiteBadge(item.website || '')}</td>
                    <td className="px-4 py-3 text-[#A7D8FF]">{item.file_name}</td>
                    <td className="px-4 py-3">{item.total_rows} data</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data untuk periode ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* UPLOAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Withdrawal</h2>
            <p className="text-sm text-[#A7D8FF] mb-4">
              Geser file Excel ke area di bawah, atau klik untuk memilih
            </p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors
                ${dragActive ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#FFD700]/30 hover:border-[#FFD700]'}`}
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
                onClick={() => {
                  setShowModal(false)
                  setSelectedFile(null)
                  setUploadProgress('')
                }}
                className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded"
              >
                Batal
              </button>
              <button
                onClick={processFile}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50"
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