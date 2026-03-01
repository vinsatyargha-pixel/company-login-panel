'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type Asset = {
  id: string
  asset_name: string
  asset_code: string
  wlb_code: string | null
}

type DepositData = {
  id: string
  website: string
  approved_date: string
  user_name: string
  deposit_amount: number
  status: string
  file_name: string
}

export default function DPDataRawPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string>('all')
  const [depositData, setDepositData] = useState<DepositData[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('yesterday')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  // Stats per asset
  const [assetStats, setAssetStats] = useState({})

  // Modal upload
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // ===========================================
  // AMBIL DATA ASSET (DARI HALAMAN ASSETS)
  // ===========================================
  
  useEffect(() => {
    fetchAssets()
  }, [])

  useEffect(() => {
    if (assets.length > 0) {
      fetchData()
    }
  }, [selectedAsset, dateFilter, customStartDate, customEndDate])

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

  // ===========================================
  // FILTER TANGGAL (SAMA PERSIS DENGAN ASSETS)
  // ===========================================

  const getDateRange = (filter: string) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    
    let start = new Date()
    let end = today
    
    switch(filter) {
      case 'yesterday':
        start = yesterday
        end = yesterday
        break
      case 'week':
        start.setDate(today.getDate() - 7)
        break
      case 'month':
        start.setDate(today.getDate() - 30)
        break
      case '3month':
        start.setMonth(today.getMonth() - 3)
        break
      case '6month':
        start.setMonth(today.getMonth() - 6)
        break
      case 'year':
        start.setFullYear(today.getFullYear() - 1)
        break
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: customStartDate,
            end: customEndDate
          }
        }
        start = yesterday
        end = yesterday
        break
      default:
        start = yesterday
        end = yesterday
    }
    
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const dateRange = getDateRange(dateFilter)

      // Query deposit_report
      let query = supabase
        .from('deposit_report')
        .select('id, website, approved_date, user_name, deposit_amount, status, file_name')
        .gte('approved_date', dateRange.start)
        .lte('approved_date', dateRange.end)

      if (selectedAsset !== 'all') {
        // Cari asset yang dipilih
        const selected = assets.find(a => a.id === selectedAsset)
        if (selected) {
          // Filter berdasarkan asset_code atau wlb_code
          query = query.or(`website.eq.${selected.asset_code},website.eq.${selected.wlb_code}`)
        }
      }

      const { data, error } = await query
      if (error) throw error

      setDepositData(data || [])

      // Hitung stats per asset
      const stats = {}
      assets.forEach(asset => {
        const assetTransactions = (data || []).filter(t => 
          t.website === asset.asset_code || t.website === asset.wlb_code
        )
        
        stats[asset.id] = {
          total: assetTransactions.length,
          approved: assetTransactions.filter(t => t.status === 'APPROVED').length,
          rejected: assetTransactions.filter(t => t.status === 'REJECTED').length,
          failed: assetTransactions.filter(t => t.status === 'FAILED').length,
          amount: assetTransactions.reduce((sum, t) => sum + (t.deposit_amount || 0), 0)
        }
      })

      setAssetStats(stats)

    } catch (error) {
      console.error('Error:', error)
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
            website: row['Website'] || 'XLY',
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
      fetchData()
      
    } catch (error: any) {
      alert('❌ Gagal: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  // Format IDR (sama dengan di assets)
  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount || 0)
  }

  const dateRange = getDateRange(dateFilter)
  const displayDateRange = dateFilter === 'custom' && customStartDate && customEndDate 
    ? `${customStartDate} to ${customEndDate}`
    : `${dateRange.start}${dateRange.start !== dateRange.end ? ` to ${dateRange.end}` : ''}`

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* Header dengan Back Button */}
      <div className="mb-8">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline inline-block mb-4">
          ← BACK TO DATA RAW
        </Link>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#FFD700]">DEPOSIT DATA RAW</h1>
            <p className="text-[#A7D8FF] mt-2">Monitoring transaksi deposit per asset</p>
            <p className="text-sm text-[#FFD700]/80 mt-1">Date Range: {displayDateRange}</p>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#FFD700] text-[#0B1A33] px-6 py-3 rounded-lg font-bold hover:bg-[#FFD700]/80 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            UPLOAD EXCEL
          </button>
        </div>
      </div>

      {/* FILTER - SAMA PERSIS DENGAN ASSETS */}
      <div className="mb-8 p-4 border border-[#FFD700]/30 rounded-lg bg-[#1A2F4A]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <span className="font-bold text-[#FFD700] mb-2 block">FILTER DATE RANGE:</span>
            
            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {['yesterday', 'week', 'month', '3month', '6month', 'year'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={`px-3 py-1.5 rounded text-sm ${
                    dateFilter === filter 
                      ? 'bg-[#FFD700] text-black' 
                      : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'
                  }`}
                >
                  {filter === 'yesterday' ? 'Kemarin' :
                   filter === 'week' ? '7 Hari' :
                   filter === 'month' ? '30 Hari' :
                   filter === '3month' ? '3 Bulan' :
                   filter === '6month' ? '6 Bulan' :
                   '1 Tahun'}
                </button>
              ))}
            </div>
            
            {/* Custom Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-3 border-t border-[#FFD700]/20">
              <span className="text-[#A7D8FF] font-medium">Custom Range:</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value)
                    setDateFilter('custom')
                  }}
                  className="border border-[#FFD700]/30 rounded px-3 py-1.5 text-white bg-[#0B1A33]"
                />
                <span className="text-[#A7D8FF]">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value)
                    setDateFilter('custom')
                  }}
                  className="border border-[#FFD700]/30 rounded px-3 py-1.5 text-white bg-[#0B1A33]"
                />
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setCustomStartDate(today)
                    setCustomEndDate(today)
                    setDateFilter('custom')
                  }}
                  className="px-3 py-1.5 bg-[#0B1A33] text-[#A7D8FF] rounded text-sm hover:bg-[#2A3F5A] border border-[#FFD700]/30"
                >
                  Today
                </button>
              </div>
            </div>
          </div>
          
          {/* ASSET FILTER DROPDOWN */}
          <div className="md:w-64">
            <label className="text-[#A7D8FF] text-sm block mb-1">Pilih Asset</label>
            <select
              className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              <option value="all">SEMUA ASSET</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_name} ({asset.asset_code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STATS CARDS - OVERALL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
          <div className="text-[#A7D8FF]">Total Data</div>
          <div className="text-2xl font-bold text-[#FFD700]">{depositData.length}</div>
        </div>
        <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
          <div className="text-[#A7D8FF]">APPROVED</div>
          <div className="text-2xl font-bold text-white">
            {depositData.filter(t => t.status === 'APPROVED').length}
          </div>
        </div>
        <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
          <div className="text-[#A7D8FF]">REJECTED</div>
          <div className="text-2xl font-bold text-red-400">
            {depositData.filter(t => t.status === 'REJECTED').length}
          </div>
        </div>
        <div className="border border-[#FFD700]/30 rounded-lg p-4 bg-[#1A2F4A]">
          <div className="text-[#A7D8FF]">FAILED</div>
          <div className="text-2xl font-bold text-blue-400">
            {depositData.filter(t => t.status === 'FAILED').length}
          </div>
        </div>
      </div>

      {/* ASSETS LIST - SAMA PERSIS DENGAN TAMPILAN ASSETS */}
      <div className="space-y-6">
        {(selectedAsset === 'all' ? assets : assets.filter(a => a.id === selectedAsset)).map(asset => {
          const stats = assetStats[asset.id] || {
            total: 0, approved: 0, rejected: 0, failed: 0, amount: 0
          }

          return (
            <div key={asset.id} className="border border-[#FFD700]/30 rounded-lg overflow-hidden bg-[#1A2F4A]">
              {/* ASSET HEADER */}
              <div className="bg-[#0B1A33] px-6 py-4 border-b border-[#FFD700]/30">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-[#FFD700]">
                      {asset.asset_name}
                      {asset.wlb_code && <span className="ml-2 text-[#A7D8FF]">({asset.wlb_code})</span>}
                    </h3>
                    <p className="text-[#A7D8FF]">Code: {asset.asset_code}</p>
                  </div>
                  <span className="px-3 py-1 bg-[#FFD700] text-black text-sm font-bold rounded">
                    {stats.total} Transaksi
                  </span>
                </div>
              </div>

              {/* ASSET STATS - 3 COLUMNS */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* APPROVED */}
                  <div>
                    <h4 className="font-bold text-white mb-3 text-lg border-b border-[#FFD700]/20 pb-2">
                      APPROVED
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[#A7D8FF] font-medium">Amount</p>
                        <p className="text-2xl font-bold text-white">
                          {formatIDR(stats.amount * (stats.approved / (stats.total || 1)))}
                        </p>
                        <div className="flex justify-between text-sm text-[#A7D8FF]/70 mt-1">
                          <span>{stats.approved} forms</span>
                          <span>{stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* REJECTED */}
                  <div>
                    <h4 className="font-bold text-red-400 mb-3 text-lg border-b border-[#FFD700]/20 pb-2">
                      REJECTED
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[#A7D8FF] font-medium">Amount</p>
                        <p className="text-2xl font-bold text-red-400">
                          {formatIDR(stats.amount * (stats.rejected / (stats.total || 1)))}
                        </p>
                        <div className="flex justify-between text-sm text-[#A7D8FF]/70 mt-1">
                          <span>{stats.rejected} forms</span>
                          <span>{stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FAILED */}
                  <div>
                    <h4 className="font-bold text-blue-400 mb-3 text-lg border-b border-[#FFD700]/20 pb-2">
                      FAILED
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[#A7D8FF] font-medium">Amount</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {formatIDR(stats.amount * (stats.failed / (stats.total || 1)))}
                        </p>
                        <div className="flex justify-between text-sm text-[#A7D8FF]/70 mt-1">
                          <span>{stats.failed} forms</span>
                          <span>{stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VIEW DETAILS LINK */}
                <div className="mt-6 pt-6 border-t border-[#FFD700]/20 text-right">
                  <Link
                    href={`/dashboard/data-raw/dp/${asset.id}`}
                    className="inline-flex items-center text-[#FFD700] hover:text-[#FFD700]/80 font-bold"
                  >
                    LIHAT DETAIL →
                  </Link>
                </div>
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
              Pilih file Excel. Sistem akan otomatis mengelompokkan data berdasarkan Approved Date.
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