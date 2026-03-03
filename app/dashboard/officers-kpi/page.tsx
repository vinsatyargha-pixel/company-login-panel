'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ===========================================
// TYPES
// ===========================================

type Officer = {
  id: string
  panel_id: string
  full_name: string
  department: string
  status: string
}

type KPIData = {
  officer_id: string
  panel_id: string
  officer_name: string
  department: string
  status: string
  
  // DEPOSIT
  dep_total: number
  dep_approved: number
  dep_rejected: number
  dep_approve_rate: string
  dep_reject_rate: string
  dep_avg_approve: string
  dep_avg_reject: string
  dep_sop: number
  dep_non_sop: number
  
  // WITHDRAWAL
  wd_total: number
  wd_approved: number
  wd_rejected: number
  wd_approve_rate: string
  wd_reject_rate: string
  wd_avg_approve: string
  wd_avg_reject: string
  wd_sop: number
  wd_non_sop: number
  
  // TOTAL GABUNGAN
  total_transactions: number
  total_approved: number
  total_rejected: number
  
  human_error: number
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function OfficersKPIPage() {
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState<KPIData[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [error, setError] = useState<string | null>(null)

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
    fetchOfficers()
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear && officers.length > 0) {
      fetchKPI()
    }
  }, [selectedMonth, selectedYear, officers])

  // ===========================================
  // FETCH OFFICERS (dengan SYSTEM)
  // ===========================================

  const fetchOfficers = async () => {
  try {
    setError(null)
    console.log('🔍 Fetching officers...')
    
    const { data, error } = await supabase
      .from('officers')
      .select('id, panel_id, full_name, department, status')
      .eq('department', 'CS DP WD')  // HANYA CS DP WD
      .order('full_name')

    if (error) throw error
    
    // Tambah SYSTEM di paling akhir
    const allOfficers = [
      ...(data || []),
      {
        id: 'system',
        panel_id: 'SYSTEM',
        full_name: 'SYSTEM (AUTO)',
        department: 'AUTOMATION',
        status: 'SYSTEM'
      }
    ]
    
    console.log('📊 Officers found:', allOfficers.length)
    setOfficers(allOfficers)
    
  } catch (error: any) {
    console.error('❌ Error fetching officers:', error)
    setError(error.message)
  }
}

  // ===========================================
  // FETCH KPI
  // ===========================================

  const fetchKPI = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const monthIndex = months.indexOf(selectedMonth) + 1
      const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
      const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`

      console.log('🔍 Filter:', { selectedMonth, selectedYear, startDate, endDate })

      // Ambil data deposit
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select('handler, status, duration_minutes, reason')
        .gte('approved_date', startDate)
        .lte('approved_date', endDate)

      if (depositError) throw depositError

      // Ambil data withdrawal
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_transactions')
        .select('handler, status, duration_minutes, reason')
        .gte('approved_date', startDate)
        .lte('approved_date', endDate)

      if (withdrawalError) throw withdrawalError

      console.log('📊 Deposit:', depositData?.length || 0)
      console.log('📊 Withdrawal:', withdrawalData?.length || 0)

      // Hitung KPI per officer
      const kpiMap: { [key: string]: any } = {}

      // Inisialisasi dengan SEMUA officer (termasuk SYSTEM)
      officers.forEach(officer => {
        kpiMap[officer.panel_id] = {
          officer_id: officer.id,
          panel_id: officer.panel_id,
          officer_name: officer.full_name,
          department: officer.department,
          status: officer.status || 'REGULAR',
          
          // Deposit
          dep_total: 0,
          dep_approved: 0,
          dep_rejected: 0,
          dep_approve_minutes_sum: 0,
          dep_reject_minutes_sum: 0,
          dep_approve_count: 0,
          dep_reject_count: 0,
          dep_sop: 0,
          dep_non_sop: 0,
          
          // Withdrawal
          wd_total: 0,
          wd_approved: 0,
          wd_rejected: 0,
          wd_approve_minutes_sum: 0,
          wd_reject_minutes_sum: 0,
          wd_approve_count: 0,
          wd_reject_count: 0,
          wd_sop: 0,
          wd_non_sop: 0,
          
          // Human error
          human_error: 0
        }
      })

      // Proses Deposit (SYSTEM tetap diproses)
      depositData?.forEach((tx: any) => {
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const officer = officers.find(o => 
          o.panel_id?.toLowerCase() === tx.handler.toLowerCase()
        )
        if (!officer) return

        const kpi = kpiMap[officer.panel_id]
        kpi.dep_total++

        if (tx.status?.toLowerCase() === 'approved') {
          kpi.dep_approved++
          kpi.dep_approve_count++
          kpi.dep_approve_minutes_sum += (tx.duration_minutes || 0)
          
          if (tx.duration_minutes <= 3) {
            kpi.dep_sop++
          } else {
            kpi.dep_non_sop++
          }
        } else if (tx.status?.toLowerCase() === 'rejected') {
          kpi.dep_rejected++
          kpi.dep_reject_count++
          kpi.dep_reject_minutes_sum += (tx.duration_minutes || 0)
        }

        // Human error
        if (tx.reason?.toLowerCase().includes('mistake') ||
            tx.reason?.toLowerCase().includes('crossbank') ||
            tx.reason?.toLowerCase().includes('cross asset') ||
            tx.reason?.toLowerCase().includes('wrong process')) {
          kpi.human_error++
        }
      })

      // Proses Withdrawal (SYSTEM tetap diproses)
      withdrawalData?.forEach((tx: any) => {
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const officer = officers.find(o => 
          o.panel_id?.toLowerCase() === tx.handler.toLowerCase()
        )
        if (!officer) return

        const kpi = kpiMap[officer.panel_id]
        kpi.wd_total++

        if (tx.status?.toLowerCase() === 'approved') {
          kpi.wd_approved++
          kpi.wd_approve_count++
          kpi.wd_approve_minutes_sum += (tx.duration_minutes || 0)
          
          if (tx.duration_minutes <= 5) {
            kpi.wd_sop++
          } else {
            kpi.wd_non_sop++
          }
        } else if (tx.status?.toLowerCase() === 'rejected') {
          kpi.wd_rejected++
          kpi.wd_reject_count++
          kpi.wd_reject_minutes_sum += (tx.duration_minutes || 0)
        }

        // Human error
        if (tx.reason?.toLowerCase().includes('mistake') ||
            tx.reason?.toLowerCase().includes('crossbank') ||
            tx.reason?.toLowerCase().includes('cross asset') ||
            tx.reason?.toLowerCase().includes('wrong process')) {
          kpi.human_error++
        }
      })

      // Format data untuk tabel
      const formattedData: KPIData[] = Object.values(kpiMap).map((kpi: any) => {
        // Deposit rates
        const dep_approve_rate = kpi.dep_total > 0 
          ? ((kpi.dep_approved / kpi.dep_total) * 100).toFixed(2) : '0.00'
        const dep_reject_rate = kpi.dep_total > 0 
          ? ((kpi.dep_rejected / kpi.dep_total) * 100).toFixed(2) : '0.00'
        const dep_avg_approve = kpi.dep_approve_count > 0 
          ? (kpi.dep_approve_minutes_sum / kpi.dep_approve_count).toFixed(2) : '-'
        const dep_avg_reject = kpi.dep_reject_count > 0 
          ? (kpi.dep_reject_minutes_sum / kpi.dep_reject_count).toFixed(2) : '-'

        // Withdrawal rates
        const wd_approve_rate = kpi.wd_total > 0 
          ? ((kpi.wd_approved / kpi.wd_total) * 100).toFixed(2) : '0.00'
        const wd_reject_rate = kpi.wd_total > 0 
          ? ((kpi.wd_rejected / kpi.wd_total) * 100).toFixed(2) : '0.00'
        const wd_avg_approve = kpi.wd_approve_count > 0 
          ? (kpi.wd_approve_minutes_sum / kpi.wd_approve_count).toFixed(2) : '-'
        const wd_avg_reject = kpi.wd_reject_count > 0 
          ? (kpi.wd_reject_minutes_sum / kpi.wd_reject_count).toFixed(2) : '-'

        // Total gabungan
        const total_trans = kpi.dep_total + kpi.wd_total
        const total_app = kpi.dep_approved + kpi.wd_approved
        const total_rej = kpi.dep_rejected + kpi.wd_rejected

        return {
          officer_id: kpi.officer_id,
          panel_id: kpi.panel_id,
          officer_name: kpi.officer_name,
          department: kpi.department,
          status: kpi.status,
          
          // Deposit
          dep_total: kpi.dep_total,
          dep_approved: kpi.dep_approved,
          dep_rejected: kpi.dep_rejected,
          dep_approve_rate,
          dep_reject_rate,
          dep_avg_approve,
          dep_avg_reject,
          dep_sop: kpi.dep_sop,
          dep_non_sop: kpi.dep_non_sop,
          
          // Withdrawal
          wd_total: kpi.wd_total,
          wd_approved: kpi.wd_approved,
          wd_rejected: kpi.wd_rejected,
          wd_approve_rate,
          wd_reject_rate,
          wd_avg_approve,
          wd_avg_reject,
          wd_sop: kpi.wd_sop,
          wd_non_sop: kpi.wd_non_sop,
          
          // Total
          total_transactions: total_trans,
          total_approved: total_app,
          total_rejected: total_rej,
          
          human_error: kpi.human_error
        }
      })

      // Urutkan: officer biasa dulu, SYSTEM di paling bawah
      const sortedData = [
        ...formattedData.filter(item => item.panel_id !== 'SYSTEM'),
        ...formattedData.filter(item => item.panel_id === 'SYSTEM')
      ]
      
      console.log('✅ KPI Data:', sortedData)
      setKpiData(sortedData)
      
    } catch (error: any) {
      console.error('❌ Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
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

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
        <Link href="/dashboard" className="text-[#FFD700] hover:underline inline-block mb-4">
          ← BACK TO DASHBOARD
        </Link>
        <div className="bg-red-900/50 border border-red-500 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-white">{error}</p>
        </div>
      </div>
    )
  }

  const totalTransactions = kpiData.reduce((sum, item) => sum + item.total_transactions, 0)
  const totalApproved = kpiData.reduce((sum, item) => sum + item.total_approved, 0)
  const totalRejected = kpiData.reduce((sum, item) => sum + item.total_rejected, 0)

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-[#FFD700] hover:underline inline-block mb-4">
          ← BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-3xl font-bold text-[#FFD700]">KPI LIVE OFFICERS</h1>
        <p className="text-[#A7D8FF] mt-2">Performance monitoring all officers (including SYSTEM)</p>
      </div>

      {/* FILTER BULAN & TAHUN */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex gap-4 items-center">
          <select 
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
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

          <div className="ml-auto text-[#A7D8FF]">
            Periode: {selectedMonth} {selectedYear}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th rowSpan={2} className="px-2 py-2 text-[#FFD700]">No</th>
              <th rowSpan={2} className="px-2 py-2 text-[#FFD700]">Panel ID</th>
              <th rowSpan={2} className="px-2 py-2 text-[#FFD700]">Officer</th>
              <th rowSpan={2} className="px-2 py-2 text-[#FFD700]">Dept</th>
              <th rowSpan={2} className="px-2 py-2 text-[#FFD700]">Status</th>
              
              <th colSpan={6} className="px-2 py-1 text-center text-[#FFD700] border-x border-[#FFD700]/30">DEPOSIT</th>
              <th colSpan={6} className="px-2 py-1 text-center text-[#FFD700] border-x border-[#FFD700]/30">WITHDRAWAL</th>
              <th rowSpan={2} className="px-2 py-2 text-[#FFD700]">Human Error</th>
            </tr>
            <tr className="border-b border-[#FFD700]/30">
              {/* Deposit */}
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Total</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Rej</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App%</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">SOP</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Non</th>
              
              {/* Withdrawal */}
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Total</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Rej</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App%</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">SOP</th>
              <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Non</th>
            </tr>
          </thead>
          <tbody>
            {kpiData.length > 0 ? (
              kpiData.map((item, idx) => (
                <tr 
                  key={item.panel_id} 
                  className={`border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50 ${
                    item.panel_id === 'SYSTEM' ? 'bg-purple-900/20' : ''
                  }`}
                >
                  <td className="px-2 py-2">{idx + 1}</td>
                  <td className="px-2 py-2 text-[#FFD700]">{item.panel_id}</td>
                  <td className="px-2 py-2">{item.officer_name}</td>
                  <td className="px-2 py-2">{item.department}</td>
                  <td className="px-2 py-2">
                    <span className={`px-1 py-0.5 rounded text-[10px] ${
                      item.panel_id === 'SYSTEM' 
                        ? 'bg-purple-500/20 text-purple-400' 
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  
                  {/* Deposit */}
                  <td className="px-2 py-2">{item.dep_total}</td>
                  <td className="px-2 py-2 text-green-400">{item.dep_approved}</td>
                  <td className="px-2 py-2 text-red-400">{item.dep_rejected}</td>
                  <td className="px-2 py-2">{item.dep_approve_rate}%</td>
                  <td className="px-2 py-2 text-green-400">{item.dep_sop}</td>
                  <td className="px-2 py-2 text-yellow-400">{item.dep_non_sop}</td>
                  
                  {/* Withdrawal */}
                  <td className="px-2 py-2">{item.wd_total}</td>
                  <td className="px-2 py-2 text-green-400">{item.wd_approved}</td>
                  <td className="px-2 py-2 text-red-400">{item.wd_rejected}</td>
                  <td className="px-2 py-2">{item.wd_approve_rate}%</td>
                  <td className="px-2 py-2 text-green-400">{item.wd_sop}</td>
                  <td className="px-2 py-2 text-yellow-400">{item.wd_non_sop}</td>
                  
                  {/* Human Error */}
                  <td className="px-2 py-2 text-red-400">{item.human_error}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={17} className="px-4 py-12 text-center text-gray-400">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-lg mb-1">Belum ada data untuk {selectedMonth} {selectedYear}</p>
                  <p className="text-sm">Upload data terlebih dahulu di halaman DP/WD</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30 text-xs text-[#A7D8FF]">
        <div className="flex justify-between">
          <span>Total Officers: {kpiData.length - 1} + SYSTEM</span>
          <span>Total Transactions: {totalTransactions}</span>
          <span className="text-green-400">Approved: {totalApproved}</span>
          <span className="text-red-400">Rejected: {totalRejected}</span>
        </div>
      </div>
    </div>
  )
}