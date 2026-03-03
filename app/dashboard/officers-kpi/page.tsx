'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ===========================================
// TYPES
// ===========================================

type Officer = {
  id: string
  full_name: string
  department: string
}

type KPIData = {
  officer_id: string
  officer_name: string
  department: string
  status: string
  total_transactions: number
  total_approved: number
  total_rejected: number
  approve_rate: string
  reject_rate: string
  avg_approve_minutes: string
  avg_reject_minutes: string
  sop_deposit: number
  non_sop_deposit: number
  sop_withdrawal: number
  non_sop_withdrawal: number
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
  const [matchDebug, setMatchDebug] = useState<any[]>([])

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
  // FETCH OFFICERS
  // ===========================================

  const fetchOfficers = async () => {
    try {
      setError(null)
      console.log('🔍 Fetching officers...')
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, department')
        .eq('department', 'CS DP WD')
        .order('full_name')

      if (error) throw error
      
      console.log('📊 Officers found:', data?.length || 0)
      console.log('👤 Officer IDs:', data?.map(o => ({ id: o.id, name: o.full_name })))
      
      setOfficers(data || [])
      
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
      setMatchDebug([])
      
      const monthIndex = months.indexOf(selectedMonth) + 1
      const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
      const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`

      console.log('🔍 Filter Bulan:', { 
        selectedMonth, 
        selectedYear,
        startDate, 
        endDate 
      })

      // Ambil data deposit
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select(`
          handler,
          status,
          duration_minutes,
          reason
        `)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate)

      if (depositError) throw depositError

      // Ambil data withdrawal
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_transactions')
        .select(`
          handler,
          status,
          duration_minutes,
          reason
        `)
        .gte('approved_date', startDate)
        .lte('approved_date', endDate)

      if (withdrawalError) throw withdrawalError

      console.log('📊 Deposit data:', depositData?.length || 0)
      console.log('📊 Withdrawal data:', withdrawalData?.length || 0)

      // Debug: Lihat handler yang ada di transaksi
      const depositHandlers = [...new Set(depositData?.map((t: any) => t.handler) || [])]
      const withdrawalHandlers = [...new Set(withdrawalData?.map((t: any) => t.handler) || [])]
      console.log('👤 Deposit handlers:', depositHandlers)
      console.log('👤 Withdrawal handlers:', withdrawalHandlers)

      // Hitung KPI per officer
      const kpiMap: { [key: string]: any } = {}

      // Inisialisasi dengan data officer
      officers.forEach(officer => {
        kpiMap[officer.id] = {
          officer_id: officer.id,
          officer_name: officer.full_name,
          department: officer.department,
          status: 'REGULAR',
          total_transactions: 0,
          total_approved: 0,
          total_rejected: 0,
          sop_deposit: 0,
          non_sop_deposit: 0,
          sop_withdrawal: 0,
          non_sop_withdrawal: 0,
          human_error: 0,
          approve_minutes_sum: 0,
          reject_minutes_sum: 0,
          approve_count: 0,
          reject_count: 0
        }
      })

      // Debug match
      const matches: any[] = []

      // Proses deposit
      depositData?.forEach((tx: any) => {
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        // Cari officer dengan ID yang match (case insensitive)
        const officer = officers.find(o => 
          String(o.id).toLowerCase() === tx.handler.toLowerCase()
        )
        
        // Debug
        matches.push({
          type: 'deposit',
          handler: tx.handler,
          match: officer ? officer.full_name : 'NO MATCH'
        })

        if (!officer) return

        const kpi = kpiMap[officer.id]
        kpi.total_transactions++

        if (tx.status?.toLowerCase() === 'approved') {
          kpi.total_approved++
          kpi.approve_count++
          kpi.approve_minutes_sum += (tx.duration_minutes || 0)
          
          if (tx.duration_minutes <= 3) {
            kpi.sop_deposit++
          } else {
            kpi.non_sop_deposit++
          }
        } else if (tx.status?.toLowerCase() === 'rejected') {
          kpi.total_rejected++
          kpi.reject_count++
          kpi.reject_minutes_sum += (tx.duration_minutes || 0)
        }

        // Human error
        if (tx.reason?.toLowerCase().includes('mistake') ||
            tx.reason?.toLowerCase().includes('crossbank') ||
            tx.reason?.toLowerCase().includes('cross asset') ||
            tx.reason?.toLowerCase().includes('wrong process')) {
          kpi.human_error++
        }
      })

      // Proses withdrawal
      withdrawalData?.forEach((tx: any) => {
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const officer = officers.find(o => 
          String(o.id).toLowerCase() === tx.handler.toLowerCase()
        )
        
        // Debug
        matches.push({
          type: 'withdrawal',
          handler: tx.handler,
          match: officer ? officer.full_name : 'NO MATCH'
        })

        if (!officer) return

        const kpi = kpiMap[officer.id]
        kpi.total_transactions++

        if (tx.status?.toLowerCase() === 'approved') {
          kpi.total_approved++
          kpi.approve_count++
          kpi.approve_minutes_sum += (tx.duration_minutes || 0)
          
          if (tx.duration_minutes <= 5) {
            kpi.sop_withdrawal++
          } else {
            kpi.non_sop_withdrawal++
          }
        } else if (tx.status?.toLowerCase() === 'rejected') {
          kpi.total_rejected++
          kpi.reject_count++
          kpi.reject_minutes_sum += (tx.duration_minutes || 0)
        }

        // Human error
        if (tx.reason?.toLowerCase().includes('mistake') ||
            tx.reason?.toLowerCase().includes('crossbank') ||
            tx.reason?.toLowerCase().includes('cross asset') ||
            tx.reason?.toLowerCase().includes('wrong process')) {
          kpi.human_error++
        }
      })

      setMatchDebug(matches)

      // Hitung rate dan rata-rata
      const formattedData: KPIData[] = Object.values(kpiMap).map((kpi: any) => {
        const approve_rate = kpi.total_transactions > 0 
          ? ((kpi.total_approved / kpi.total_transactions) * 100).toFixed(2) 
          : '0.00'
        
        const reject_rate = kpi.total_transactions > 0 
          ? ((kpi.total_rejected / kpi.total_transactions) * 100).toFixed(2) 
          : '0.00'
        
        const avg_approve = kpi.approve_count > 0 
          ? (kpi.approve_minutes_sum / kpi.approve_count).toFixed(2) 
          : '-'
        
        const avg_reject = kpi.reject_count > 0 
          ? (kpi.reject_minutes_sum / kpi.reject_count).toFixed(2) 
          : '-'

        return {
          officer_id: kpi.officer_id,
          officer_name: kpi.officer_name,
          department: kpi.department,
          status: kpi.status,
          total_transactions: kpi.total_transactions,
          total_approved: kpi.total_approved,
          total_rejected: kpi.total_rejected,
          approve_rate,
          reject_rate,
          avg_approve_minutes: avg_approve,
          avg_reject_minutes: avg_reject,
          sop_deposit: kpi.sop_deposit,
          non_sop_deposit: kpi.non_sop_deposit,
          sop_withdrawal: kpi.sop_withdrawal,
          non_sop_withdrawal: kpi.non_sop_withdrawal,
          human_error: kpi.human_error
        }
      })

      console.log('✅ KPI Data:', formattedData)
      console.log('🔍 Match Debug:', matches.slice(0, 20)) // 20 sample pertama
      
      setKpiData(formattedData)
      
    } catch (error: any) {
      console.error('❌ Error fetching KPI:', error)
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-4 text-[#FFD700]">Loading KPI data...</p>
        </div>
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
        <p className="text-[#A7D8FF] mt-2">Performance monitoring CS DP WD</p>
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
        <table className="w-full text-sm">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-3 py-3 text-left text-[#FFD700]">No</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Officer</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Dept</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Status</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Total</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">App</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Rej</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">App%</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Rej%</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Avg App (m)</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Avg Rej (m)</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">SOP Depo</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Non SOP</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">SOP WD</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Non SOP</th>
              <th className="px-3 py-3 text-left text-[#FFD700]">Human Error</th>
            </tr>
          </thead>
          <tbody>
            {kpiData.length > 0 ? (
              kpiData.map((item, idx) => (
                <tr key={item.officer_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                  <td className="px-3 py-3">{idx + 1}</td>
                  <td className="px-3 py-3 font-medium text-[#FFD700]">{item.officer_name}</td>
                  <td className="px-3 py-3">{item.department}</td>
                  <td className="px-3 py-3">
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                      REGULAR
                    </span>
                  </td>
                  <td className="px-3 py-3">{item.total_transactions}</td>
                  <td className="px-3 py-3 text-green-400">{item.total_approved}</td>
                  <td className="px-3 py-3 text-red-400">{item.total_rejected}</td>
                  <td className="px-3 py-3">{item.approve_rate}%</td>
                  <td className="px-3 py-3">{item.reject_rate}%</td>
                  <td className="px-3 py-3">{item.avg_approve_minutes}</td>
                  <td className="px-3 py-3">{item.avg_reject_minutes}</td>
                  <td className="px-3 py-3 text-green-400">{item.sop_deposit}</td>
                  <td className="px-3 py-3 text-yellow-400">{item.non_sop_deposit}</td>
                  <td className="px-3 py-3 text-green-400">{item.sop_withdrawal}</td>
                  <td className="px-3 py-3 text-yellow-400">{item.non_sop_withdrawal}</td>
                  <td className="px-3 py-3 text-red-400">{item.human_error}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={16} className="px-4 py-12 text-center text-gray-400">
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
      <div className="mt-4 bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30 text-sm text-[#A7D8FF]">
        <div className="flex justify-between items-center">
          <span>Total Officers: {officers.length}</span>
          <span>Total Transactions: {totalTransactions}</span>
          <span className="text-green-400">Approved: {totalApproved}</span>
          <span className="text-red-400">Rejected: {totalRejected}</span>
        </div>
      </div>

      {/* Debug Info (Hanya Muncul di Console) */}
      {matchDebug.length > 0 && (
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
          <p>🔍 Debug: {matchDebug.length} transaksi diproses. Cek console untuk detail match.</p>
        </div>
      )}
    </div>
  )
}