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
  dep_failed: number
  dep_approve_rate: string
  dep_reject_rate: string
  dep_fail_rate: string
  dep_avg_approve: string
  dep_avg_reject: string
  dep_avg_fail: string
  dep_sop: number
  dep_non_sop: number
  dep_human_error: number  // HUMAN ERROR KHUSUS DEPOSIT
  
  // WITHDRAWAL
  wd_total: number
  wd_approved: number
  wd_rejected: number
  wd_failed: number
  wd_approve_rate: string
  wd_reject_rate: string
  wd_fail_rate: string
  wd_avg_approve: string
  wd_avg_reject: string
  wd_avg_fail: string
  wd_sop: number
  wd_non_sop: number
  wd_human_error: number   // HUMAN ERROR KHUSUS WITHDRAWAL
  
  // TOTAL GABUNGAN (untuk summary)
  total_transactions: number
  total_approved: number
  total_rejected: number
  total_failed: number
  total_human_error: number
}

// ===========================================
// HELPER: Konversi menit ke HH:MM:SS
// ===========================================
const minutesToHHMMSS = (minutes: number): string => {
  if (!minutes || minutes < 0) return '00:00:00'
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = Math.floor((minutes * 60) % 60)
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function OfficersKPIPage() {
  // Filter states
  const [filterType, setFilterType] = useState<'month' | 'yesterday' | 'custom'>('month')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
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
    
    // Set default custom range (7 hari terakhir)
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    setCustomStartDate(start.toISOString().split('T')[0])
    setCustomEndDate(end.toISOString().split('T')[0])
    
    fetchOfficers()
  }, [])

  useEffect(() => {
    if (officers.length > 0) {
      fetchKPI()
    }
  }, [filterType, selectedMonth, selectedYear, customStartDate, customEndDate, officers])

  // ===========================================
  // FETCH OFFICERS
  // ===========================================

  const fetchOfficers = async () => {
    try {
      setError(null)
      console.log('🔍 Fetching officers...')
      
      const { data, error } = await supabase
        .from('officers')
        .select('id, panel_id, full_name, department, status')
        .eq('department', 'CS DP WD')
        .order('full_name')

      if (error) throw error
      
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
  // GET DATE RANGE BASED ON FILTER
  // ===========================================
  const getDateRange = () => {
    let startDate = ''
    let endDate = ''
    let periodText = ''

    if (filterType === 'month') {
      const monthIndex = months.indexOf(selectedMonth) + 1
      startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
      endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`
      periodText = `${selectedMonth} ${selectedYear}`
    } 
    else if (filterType === 'yesterday') {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      startDate = yesterday.toISOString().split('T')[0]
      endDate = yesterday.toISOString().split('T')[0]
      periodText = `Yesterday (${startDate})`
    } 
    else if (filterType === 'custom') {
      startDate = customStartDate
      endDate = customEndDate
      periodText = `${startDate} s/d ${endDate}`
    }

    return { startDate, endDate, periodText }
  }

  // ===========================================
  // FETCH KPI
  // ===========================================

  const fetchKPI = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { startDate, endDate, periodText } = getDateRange()
      console.log('🔍 Filter:', { filterType, startDate, endDate, periodText })

      // Ambil data deposit
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select('handler, status, duration_minutes, reason')
        .gte('approved_date::date', startDate)
        .lte('approved_date::date', endDate)

      if (depositError) throw depositError

      // Ambil data withdrawal
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_transactions')
        .select('handler, status, duration_minutes, reason')
        .gte('approved_date::date', startDate)
        .lte('approved_date::date', endDate)

      if (withdrawalError) throw withdrawalError

      console.log('📊 Deposit:', depositData?.length || 0)
      console.log('📊 Withdrawal:', withdrawalData?.length || 0)

      // Hitung KPI per officer
      const kpiMap: { [key: string]: any } = {}

      // Inisialisasi dengan SEMUA officer
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
          dep_failed: 0,
          dep_approve_minutes_sum: 0,
          dep_reject_minutes_sum: 0,
          dep_fail_minutes_sum: 0,
          dep_approve_count: 0,
          dep_reject_count: 0,
          dep_fail_count: 0,
          dep_sop: 0,
          dep_non_sop: 0,
          dep_human_error: 0,
          
          // Withdrawal
          wd_total: 0,
          wd_approved: 0,
          wd_rejected: 0,
          wd_failed: 0,
          wd_approve_minutes_sum: 0,
          wd_reject_minutes_sum: 0,
          wd_fail_minutes_sum: 0,
          wd_approve_count: 0,
          wd_reject_count: 0,
          wd_fail_count: 0,
          wd_sop: 0,
          wd_non_sop: 0,
          wd_human_error: 0,
        }
      })

      // Proses Deposit
depositData?.forEach((tx: any) => {
  if (!tx.handler || typeof tx.handler !== 'string') return
  
  const officer = officers.find(o => 
    o.panel_id?.toLowerCase() === tx.handler.toLowerCase()
  )
  
  const targetPanelId = officer ? officer.panel_id : 'SYSTEM'
  const kpi = kpiMap[targetPanelId]
  
  kpi.dep_total++

  const status = tx.status?.toLowerCase()
  const isSystem = targetPanelId === 'SYSTEM'
  
  // 🔥 FIX: Kalo SYSTEM, semua yang bukan approved dianggap FAIL
  if (isSystem) {
    if (status === 'approved') {
      kpi.dep_approved++
      kpi.dep_approve_count++
      kpi.dep_approve_minutes_sum += (tx.duration_minutes || 0)
      
      if (tx.duration_minutes <= 3) {
        kpi.dep_sop++
      } else {
        kpi.dep_non_sop++
      }
    } else {
      // SYSTEM: rejected, failed, dll semua dianggap FAIL
      kpi.dep_failed++
      kpi.dep_fail_count++
      kpi.dep_fail_minutes_sum += (tx.duration_minutes || 0)
    }
  } else {
    // Officer biasa: bedakan approved, rejected, fail
    if (status === 'approved') {
      kpi.dep_approved++
      kpi.dep_approve_count++
      kpi.dep_approve_minutes_sum += (tx.duration_minutes || 0)
      
      if (tx.duration_minutes <= 3) {
        kpi.dep_sop++
      } else {
        kpi.dep_non_sop++
      }
    } else if (status === 'rejected') {
      kpi.dep_rejected++
      kpi.dep_reject_count++
      kpi.dep_reject_minutes_sum += (tx.duration_minutes || 0)
    } else if (status?.includes('fail')) {
      kpi.dep_failed++
      kpi.dep_fail_count++
      kpi.dep_fail_minutes_sum += (tx.duration_minutes || 0)
    }
  }

  // Human error DEPOSIT
  if (tx.reason?.toLowerCase().includes('mistake') ||
      tx.reason?.toLowerCase().includes('crossbank') ||
      tx.reason?.toLowerCase().includes('cross asset') ||
      tx.reason?.toLowerCase().includes('wrong process')) {
    kpi.dep_human_error++
  }
})

// ===========================================
// Proses Withdrawal (sama logicnya)
// ===========================================
withdrawalData?.forEach((tx: any) => {
  if (!tx.handler || typeof tx.handler !== 'string') return
  
  const officer = officers.find(o => 
    o.panel_id?.toLowerCase() === tx.handler.toLowerCase()
  )
  
  const targetPanelId = officer ? officer.panel_id : 'SYSTEM'
  const kpi = kpiMap[targetPanelId]
  
  kpi.wd_total++

  const status = tx.status?.toLowerCase()
  const isSystem = targetPanelId === 'SYSTEM'
  
  // 🔥 FIX: Kalo SYSTEM, semua yang bukan approved dianggap FAIL
  if (isSystem) {
    if (status === 'approved') {
      kpi.wd_approved++
      kpi.wd_approve_count++
      kpi.wd_approve_minutes_sum += (tx.duration_minutes || 0)
      
      if (tx.duration_minutes <= 5) {
        kpi.wd_sop++
      } else {
        kpi.wd_non_sop++
      }
    } else {
      // SYSTEM: rejected, failed, dll semua dianggap FAIL
      kpi.wd_failed++
      kpi.wd_fail_count++
      kpi.wd_fail_minutes_sum += (tx.duration_minutes || 0)
    }
  } else {
    // Officer biasa: bedakan approved, rejected, fail
    if (status === 'approved') {
      kpi.wd_approved++
      kpi.wd_approve_count++
      kpi.wd_approve_minutes_sum += (tx.duration_minutes || 0)
      
      if (tx.duration_minutes <= 5) {
        kpi.wd_sop++
      } else {
        kpi.wd_non_sop++
      }
    } else if (status === 'rejected') {
      kpi.wd_rejected++
      kpi.wd_reject_count++
      kpi.wd_reject_minutes_sum += (tx.duration_minutes || 0)
    } else if (status?.includes('fail')) {
      kpi.wd_failed++
      kpi.wd_fail_count++
      kpi.wd_fail_minutes_sum += (tx.duration_minutes || 0)
    }
  }

  // Human error WITHDRAWAL
  if (tx.reason?.toLowerCase().includes('mistake') ||
      tx.reason?.toLowerCase().includes('crossbank') ||
      tx.reason?.toLowerCase().includes('cross asset') ||
      tx.reason?.toLowerCase().includes('wrong process')) {
    kpi.wd_human_error++
  }
})

      // Format data untuk tabel
      const formattedData: KPIData[] = Object.values(kpiMap).map((kpi: any) => {
        // Deposit rates & intervals
        const dep_approve_rate = kpi.dep_total > 0 
          ? ((kpi.dep_approved / kpi.dep_total) * 100).toFixed(2) : '0.00'
        const dep_reject_rate = kpi.dep_total > 0 
          ? ((kpi.dep_rejected / kpi.dep_total) * 100).toFixed(2) : '0.00'
        const dep_fail_rate = kpi.dep_total > 0
          ? ((kpi.dep_failed / kpi.dep_total) * 100).toFixed(2) : '0.00'
        
        const dep_avg_approve = kpi.dep_approve_count > 0 
          ? minutesToHHMMSS(kpi.dep_approve_minutes_sum / kpi.dep_approve_count) : '-'
        const dep_avg_reject = kpi.dep_reject_count > 0 
          ? minutesToHHMMSS(kpi.dep_reject_minutes_sum / kpi.dep_reject_count) : '-'
        const dep_avg_fail = kpi.dep_fail_count > 0
          ? minutesToHHMMSS(kpi.dep_fail_minutes_sum / kpi.dep_fail_count) : '-'

        // Withdrawal rates & intervals
        const wd_approve_rate = kpi.wd_total > 0 
          ? ((kpi.wd_approved / kpi.wd_total) * 100).toFixed(2) : '0.00'
        const wd_reject_rate = kpi.wd_total > 0 
          ? ((kpi.wd_rejected / kpi.wd_total) * 100).toFixed(2) : '0.00'
        const wd_fail_rate = kpi.wd_total > 0
          ? ((kpi.wd_failed / kpi.wd_total) * 100).toFixed(2) : '0.00'
        
        const wd_avg_approve = kpi.wd_approve_count > 0 
          ? minutesToHHMMSS(kpi.wd_approve_minutes_sum / kpi.wd_approve_count) : '-'
        const wd_avg_reject = kpi.wd_reject_count > 0 
          ? minutesToHHMMSS(kpi.wd_reject_minutes_sum / kpi.wd_reject_count) : '-'
        const wd_avg_fail = kpi.wd_fail_count > 0
          ? minutesToHHMMSS(kpi.wd_fail_minutes_sum / kpi.wd_fail_count) : '-'

        // Total gabungan untuk summary
        const total_trans = kpi.dep_total + kpi.wd_total
        const total_app = kpi.dep_approved + kpi.wd_approved
        const total_rej = kpi.dep_rejected + kpi.wd_rejected
        const total_fail = kpi.dep_failed + kpi.wd_failed
        const total_he = kpi.dep_human_error + kpi.wd_human_error

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
          dep_failed: kpi.dep_failed,
          dep_approve_rate,
          dep_reject_rate,
          dep_fail_rate,
          dep_avg_approve,
          dep_avg_reject,
          dep_avg_fail,
          dep_sop: kpi.dep_sop,
          dep_non_sop: kpi.dep_non_sop,
          dep_human_error: kpi.dep_human_error,
          
          // Withdrawal
          wd_total: kpi.wd_total,
          wd_approved: kpi.wd_approved,
          wd_rejected: kpi.wd_rejected,
          wd_failed: kpi.wd_failed,
          wd_approve_rate,
          wd_reject_rate,
          wd_fail_rate,
          wd_avg_approve,
          wd_avg_reject,
          wd_avg_fail,
          wd_sop: kpi.wd_sop,
          wd_non_sop: kpi.wd_non_sop,
          wd_human_error: kpi.wd_human_error,
          
          // Total
          total_transactions: total_trans,
          total_approved: total_app,
          total_rejected: total_rej,
          total_failed: total_fail,
          total_human_error: total_he,
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
  const totalFailed = kpiData.reduce((sum, item) => sum + item.total_failed, 0)
  const totalHumanError = kpiData.reduce((sum, item) => sum + item.total_human_error, 0)

  const { periodText } = getDateRange()

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

      {/* FILTER SECTION */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          {/* Filter Type */}
          <select 
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="month">Bulanan</option>
            <option value="yesterday">Yesterday</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Month Filter */}
          {filterType === 'month' && (
            <>
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
            </>
          )}

          {/* Custom Range Filter */}
          {filterType === 'custom' && (
            <>
              <input
                type="date"
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span className="text-[#A7D8FF]">s/d</span>
              <input
                type="date"
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </>
          )}

          <div className="ml-auto text-[#A7D8FF]">
            Periode: {periodText}
          </div>
        </div>
      </div>

      {/* TABEL DEPOSIT */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-blue-400 mb-2 flex items-center">
          <span className="bg-blue-500 w-2 h-6 rounded-full mr-2"></span>
          DEPOSIT TRANSACTIONS
        </h2>
        <div className="bg-[#1A2F4A] rounded-lg border border-blue-500/30 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0B1A33] border-b border-blue-500/30">
              <tr>
                <th rowSpan={2} className="px-2 py-2 text-blue-400">No</th>
                <th rowSpan={2} className="px-2 py-2 text-blue-400">Panel ID</th>
                <th rowSpan={2} className="px-2 py-2 text-blue-400">Officer</th>
                <th rowSpan={2} className="px-2 py-2 text-blue-400">Dept</th>
                <th rowSpan={2} className="px-2 py-2 text-blue-400">Status</th>
                <th colSpan={10} className="px-2 py-1 text-center text-blue-400 border-x border-blue-500/30">DEPOSIT</th>
                <th rowSpan={2} className="px-2 py-2 text-blue-400">Human Error</th>
              </tr>
              <tr className="border-b border-blue-500/30">
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Total</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Rej</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Fail</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App%</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">⏱️ App</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">⏱️ Rej</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">⏱️ Fail</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">SOP</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Non</th>
              </tr>
            </thead>
            <tbody>
              {kpiData.length > 0 ? (
                kpiData.map((item, idx) => (
                  <tr 
                    key={`dep-${item.panel_id}`} 
                    className={`border-b border-blue-500/10 hover:bg-[#0B1A33]/50 ${
                      item.panel_id === 'SYSTEM' ? 'bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-2 py-2">{idx + 1}</td>
                    <td className="px-2 py-2 text-blue-400">{item.panel_id}</td>
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
                    
                    {/* Deposit Data */}
                    <td className="px-2 py-2 font-bold text-blue-400">{item.dep_total}</td>
                    <td className="px-2 py-2 text-green-400">{item.dep_approved}</td>
                    <td className="px-2 py-2 text-red-400">{item.dep_rejected}</td>
                    <td className="px-2 py-2 text-orange-400">{item.dep_failed}</td>
                    <td className="px-2 py-2">{item.dep_approve_rate}%</td>
                    <td className="px-2 py-2 text-blue-400 font-mono">{item.dep_avg_approve}</td>
                    <td className="px-2 py-2 text-red-400 font-mono">{item.dep_avg_reject}</td>
                    <td className="px-2 py-2 text-orange-400 font-mono">{item.dep_avg_fail}</td>
                    <td className="px-2 py-2 text-green-400">{item.dep_sop}</td>
                    <td className="px-2 py-2 text-yellow-400">{item.dep_non_sop}</td>
                    
                    {/* Human Error Deposit */}
                    <td className="px-2 py-2 text-red-400">{item.dep_human_error}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-lg mb-1">Belum ada data deposit untuk {periodText}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABEL WITHDRAWAL */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-green-400 mb-2 flex items-center">
          <span className="bg-green-500 w-2 h-6 rounded-full mr-2"></span>
          WITHDRAWAL TRANSACTIONS
        </h2>
        <div className="bg-[#1A2F4A] rounded-lg border border-green-500/30 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-[#0B1A33] border-b border-green-500/30">
              <tr>
                <th rowSpan={2} className="px-2 py-2 text-green-400">No</th>
                <th rowSpan={2} className="px-2 py-2 text-green-400">Panel ID</th>
                <th rowSpan={2} className="px-2 py-2 text-green-400">Officer</th>
                <th rowSpan={2} className="px-2 py-2 text-green-400">Dept</th>
                <th rowSpan={2} className="px-2 py-2 text-green-400">Status</th>
                <th colSpan={10} className="px-2 py-1 text-center text-green-400 border-x border-green-500/30">WITHDRAWAL</th>
                <th rowSpan={2} className="px-2 py-2 text-green-400">Human Error</th>
              </tr>
              <tr className="border-b border-green-500/30">
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Total</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Rej</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Fail</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">App%</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">⏱️ App</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">⏱️ Rej</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">⏱️ Fail</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">SOP</th>
                <th className="px-2 py-1 text-[#A7D8FF] text-[10px]">Non</th>
              </tr>
            </thead>
            <tbody>
              {kpiData.length > 0 ? (
                kpiData.map((item, idx) => (
                  <tr 
                    key={`wd-${item.panel_id}`} 
                    className={`border-b border-green-500/10 hover:bg-[#0B1A33]/50 ${
                      item.panel_id === 'SYSTEM' ? 'bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-2 py-2">{idx + 1}</td>
                    <td className="px-2 py-2 text-green-400">{item.panel_id}</td>
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
                    
                    {/* Withdrawal Data */}
                    <td className="px-2 py-2 font-bold text-green-400">{item.wd_total}</td>
                    <td className="px-2 py-2 text-green-400">{item.wd_approved}</td>
                    <td className="px-2 py-2 text-red-400">{item.wd_rejected}</td>
                    <td className="px-2 py-2 text-orange-400">{item.wd_failed}</td>
                    <td className="px-2 py-2">{item.wd_approve_rate}%</td>
                    <td className="px-2 py-2 text-blue-400 font-mono">{item.wd_avg_approve}</td>
                    <td className="px-2 py-2 text-red-400 font-mono">{item.wd_avg_reject}</td>
                    <td className="px-2 py-2 text-orange-400 font-mono">{item.wd_avg_fail}</td>
                    <td className="px-2 py-2 text-green-400">{item.wd_sop}</td>
                    <td className="px-2 py-2 text-yellow-400">{item.wd_non_sop}</td>
                    
                    {/* Human Error Withdrawal */}
                    <td className="px-2 py-2 text-red-400">{item.wd_human_error}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-lg mb-1">Belum ada data withdrawal untuk {periodText}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-4 bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30 text-xs text-[#A7D8FF]">
        <div className="flex justify-between">
          <span>Total Officers: {kpiData.length - 1} + SYSTEM</span>
          <span>Total Transactions: {totalTransactions}</span>
          <span className="text-green-400">Approved: {totalApproved}</span>
          <span className="text-red-400">Rejected: {totalRejected}</span>
          <span className="text-orange-400">Failed: {totalFailed}</span>
          <span className="text-red-400 font-bold">Human Error: {totalHumanError}</span>
        </div>
      </div>
    </div>
  )
}