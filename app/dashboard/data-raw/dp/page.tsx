'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import * as XLSX from 'xlsx'

type DepositData = {
  id: string
  upload_date: string
  file_name: string
  total_rows: number
  status: string
  website?: string
}

type Asset = {
  id: string
  asset_name: string
  asset_code: string
}

export default function DPDataRawPage() {
  const [data, setData] = useState<DepositData[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  
  // FILTERS
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('all')
  
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
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchData()
    }
  }, [selectedMonth, selectedYear, selectedAsset])

  const fetchAssets = async () => {
    const { data } = await supabase
      .from('assets')
      .select('id, asset_name, asset_code')
      .order('asset_name')
    setAssets(data || [])
  }

  const fetchData = async () => {
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

    // Filter by asset (kalo kolom website ada)
    if (selectedAsset !== 'all') {
      const asset = assets.find(a => a.id === selectedAsset)
      if (asset) {
        query = query.eq('website', asset.asset_code)
      }
    }

    const { data } = await query
    setData(data || [])
    setLoading(false)
  }

  // Modal upload (sederhana)
  const [showModal, setShowModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const processExcel = async () => {
    if (!uploadFile) return
    
    const arrayBuffer = await uploadFile.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet)
    
    alert(`Baca ${rows.length} baris`)
    setShowModal(false)
    fetchData()
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
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK
        </Link>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#FFD700] text-black px-4 py-2 rounded font-bold"
        >
          + UPLOAD
        </button>
      </div>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">DEPOSIT DATA RAW</h1>

      {/* FILTER - 3 DROPDOWN */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex gap-4">
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-4 py-2"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-4 py-2"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-4 py-2"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="all">SEMUA ASSET</option>
          {assets.map(a => (
            <option key={a.id} value={a.id}>{a.asset_name}</option>
          ))}
        </select>
      </div>

      {/* TABEL */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">Tanggal</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const date = new Date(item.upload_date)
              const tgl = date.getDate()
              
              return (
                <tr key={idx} className="border-b border-[#FFD700]/10">
                  <td className="px-4 py-3">{tgl} {selectedMonth} {selectedYear}</td>
                  <td className="px-4 py-3">{item.file_name}</td>
                  <td className="px-4 py-3">{item.total_rows} data</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && (
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#1A2F4A] p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File</h2>
            <input 
              type="file" 
              accept=".xlsx,.xls"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="mb-4 w-full"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400">
                Batal
              </button>
              <button 
                onClick={processExcel}
                disabled={!uploadFile}
                className="px-4 py-2 bg-[#FFD700] text-black rounded font-bold disabled:opacity-50"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}