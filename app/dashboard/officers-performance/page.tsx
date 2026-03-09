'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

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
  dep_human_error: number
  
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
  wd_human_error: number
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

// Warna untuk pie chart
const COLORS = [
  '#FFD700', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6b7280',
  '#84cc16', '#06b6d4', '#d946ef', '#f43f5e', '#64748b'
]

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

  // Data untuk pie chart
  const [depositPieData, setDepositPieData] = useState<any[]>([])
  const [withdrawalPieData, setWithdrawalPieData] = useState<any[]>([])

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
  // FETCH OFFICERS - Tambah Mozartdp & Mozartwd
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
        },
        // Tambah MOZARTDP untuk deposit
        {
          id: 'mozartdp',
          panel_id: 'MOZARTDP',
          full_name: 'MOZARTDP (AUTO)',
          department: 'AUTOMATION',
          status: 'SYSTEM'
        },
        // Tambah MOZARTWD untuk withdrawal
        {
          id: 'mozartwd',
          panel_id: 'MOZARTWD',
          full_name: 'MOZARTWD (AUTO)',
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
      const year = yesterday.getFullYear()
      const month = String(yesterday.getMonth() + 1).padStart(2, '0')
      const day = String(yesterday.getDate()).padStart(2, '0')
      startDate = `${year}-${month}-${day}`
      endDate = `${year}-${month}-${day}`
      periodText = `Yesterday (${startDate})`
    } 
    else if (filterType === 'custom') {
      startDate = customStartDate
      endDate = customEndDate
      periodText = `${startDate} s/d ${endDate}`
    }

    return { 
      startDate: `${startDate} 00:00:00`, 
      endDate: `${endDate} 23:59:59`, 
      periodText 
    }
  }

  // ===========================================
  // FETCH KPI - Tanpa redirect Mozart
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

      // Inisialisasi dengan SEMUA officer (termasuk Mozartdp & Mozartwd)
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

      // Proses Deposit - Pakai handler asli (MOZARTDP akan masuk ke panel_id MOZARTDP)
      depositData?.forEach((tx: any) => {
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const handler = tx.handler
        
        const officer = officers.find(o => 
          o.panel_id?.toLowerCase() === handler.toLowerCase()
        )
        
        const targetPanelId = officer ? officer.panel_id : 'SYSTEM'
        
        if (!kpiMap[targetPanelId]) return
        
        const kpi = kpiMap[targetPanelId]
        
        kpi.dep_total++

        const status = tx.status?.toLowerCase()
        const isSystem = targetPanelId === 'SYSTEM'
        
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
            kpi.dep_failed++
            kpi.dep_fail_count++
            kpi.dep_fail_minutes_sum += (tx.duration_minutes || 0)
          }
        } else {
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

        if (tx.reason?.toLowerCase().includes('mistake') ||
            tx.reason?.toLowerCase().includes('crossbank') ||
            tx.reason?.toLowerCase().includes('cross asset') ||
            tx.reason?.toLowerCase().includes('wrong process')) {
          kpi.dep_human_error++
        }
      })

      // Proses Withdrawal - Pakai handler asli (MOZARTWD akan masuk ke panel_id MOZARTWD)
      withdrawalData?.forEach((tx: any) => {
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const handler = tx.handler
        
        const officer = officers.find(o => 
          o.panel_id?.toLowerCase() === handler.toLowerCase()
        )
        
        const targetPanelId = officer ? officer.panel_id : 'SYSTEM'
        
        if (!kpiMap[targetPanelId]) return
        
        const kpi = kpiMap[targetPanelId]
        
        kpi.wd_total++

        const status = tx.status?.toLowerCase()
        const isSystem = targetPanelId === 'SYSTEM'
        
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
            kpi.wd_failed++
            kpi.wd_fail_count++
            kpi.wd_fail_minutes_sum += (tx.duration_minutes || 0)
          }
        } else {
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

        if (tx.reason?.toLowerCase().includes('mistake') ||
            tx.reason?.toLowerCase().includes('crossbank') ||
            tx.reason?.toLowerCase().includes('cross asset') ||
            tx.reason?.toLowerCase().includes('wrong process')) {
          kpi.wd_human_error++
        }
      })

      // Format data untuk tabel
      const formattedData: KPIData[] = Object.values(kpiMap).map((kpi: any) => {
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

        return {
          officer_id: kpi.officer_id,
          panel_id: kpi.panel_id,
          officer_name: kpi.officer_name,
          department: kpi.department,
          status: kpi.status,
          
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
        }
      })

      // Urutkan: officer biasa, MOZARTDP, MOZARTWD, SYSTEM
      const sortedData = [
        ...formattedData.filter(item => 
          item.panel_id !== 'SYSTEM' && 
          item.panel_id !== 'MOZARTDP' && 
          item.panel_id !== 'MOZARTWD'
        ),
        ...formattedData.filter(item => item.panel_id === 'MOZARTDP'),
        ...formattedData.filter(item => item.panel_id === 'MOZARTWD'),
        ...formattedData.filter(item => item.panel_id === 'SYSTEM')
      ]
      
      console.log('✅ KPI Data:', sortedData)
      setKpiData(sortedData)

      // Buat data untuk pie chart
      const depositPie = sortedData
        .filter(item => item.dep_approved > 0)
        .map((item, index) => ({
          name: item.panel_id,
          fullName: item.officer_name,
          value: item.dep_approved,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)

      const withdrawalPie = sortedData
        .filter(item => item.wd_approved > 0)
        .map((item, index) => ({
          name: item.panel_id,
          fullName: item.officer_name,
          value: item.wd_approved,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.value - a.value)

      setDepositPieData(depositPie)
      setWithdrawalPieData(withdrawalPie)
      
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

  // ===========================================
  // SUMMARY PER TABEL (Filter Mozart)
  // ===========================================
  const depFiltered = kpiData.filter(item => item.panel_id !== 'MOZARTWD')
  const wdFiltered = kpiData.filter(item => item.panel_id !== 'MOZARTDP')

  const depTotal = depFiltered.reduce((sum, item) => sum + item.dep_total, 0)
  const depApproved = depFiltered.reduce((sum, item) => sum + item.dep_approved, 0)
  const depRejected = depFiltered.reduce((sum, item) => sum + item.dep_rejected, 0)
  const depFailed = depFiltered.reduce((sum, item) => sum + item.dep_failed, 0)
  const depHumanError = depFiltered.reduce((sum, item) => sum + item.dep_human_error, 0)

  const wdTotal = wdFiltered.reduce((sum, item) => sum + item.wd_total, 0)
  const wdApproved = wdFiltered.reduce((sum, item) => sum + item.wd_approved, 0)
  const wdRejected = wdFiltered.reduce((sum, item) => sum + item.wd_rejected, 0)
  const wdFailed = wdFiltered.reduce((sum, item) => sum + item.wd_failed, 0)
  const wdHumanError = wdFiltered.reduce((sum, item) => sum + item.wd_human_error, 0)

  const totalTransactions = kpiData.reduce((sum, item) => sum + item.dep_total + item.wd_total, 0)
  const totalApproved = kpiData.reduce((sum, item) => sum + item.dep_approved + item.wd_approved, 0)
  const totalRejected = kpiData.reduce((sum, item) => sum + item.dep_rejected + item.wd_rejected, 0)
  const totalFailed = kpiData.reduce((sum, item) => sum + item.dep_failed + item.wd_failed, 0)
  const totalHumanError = kpiData.reduce((sum, item) => sum + item.dep_human_error + item.wd_human_error, 0)

  const { periodText } = getDateRange()

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-[#FFD700] hover:underline inline-block mb-4">
          ← BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-3xl font-bold text-[#FFD700]">PERFORMANCE SUMMARY OFFICERS</h1>
        <p className="text-[#A7D8FF] mt-2">Performance monitoring all officers (including SYSTEM)</p>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          <select 
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="month">Bulanan</option>
            <option value="yesterday">Yesterday</option>
            <option value="custom">Custom Range</option>
          </select>

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

      {/* PIE CHARTS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1A2F4A] rounded-lg border border-blue-500/30 p-4">
          <h3 className="text-lg font-bold text-blue-400 mb-4 text-center">
            DEPOSIT APPROVED DISTRIBUTION
          </h3>
          {depositPieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={depositPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {depositPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0B1A33', 
                      borderColor: '#FFD700',
                      color: '#FFFFFF'
                    }}
                    itemStyle={{ color: '#FFFFFF' }}
                    labelStyle={{ color: '#FFD700' }}
                    formatter={(value: any, name: any, props: any) => {
                      return [`${value} approved`, props.payload.fullName];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#A7D8FF]">
              No deposit approved data
            </div>
          )}
          <div className="mt-2 text-center text-xs text-[#A7D8FF]">
            Total Approved: {depApproved}
          </div>
        </div>

        <div className="bg-[#1A2F4A] rounded-lg border border-green-500/30 p-4">
          <h3 className="text-lg font-bold text-green-400 mb-4 text-center">
            WITHDRAWAL APPROVED DISTRIBUTION
          </h3>
          {withdrawalPieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={withdrawalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {withdrawalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0B1A33', 
                      borderColor: '#FFD700',
                      color: '#FFFFFF'
                    }}
                    itemStyle={{ color: '#FFFFFF' }}
                    labelStyle={{ color: '#FFD700' }}
                    formatter={(value: any, name: any, props: any) => {
                      return [`${value} approved`, props.payload.fullName];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#A7D8FF]">
              No withdrawal approved data
            </div>
          )}
          <div className="mt-2 text-center text-xs text-[#A7D8FF]">
            Total Approved: {wdApproved}
          </div>
        </div>
      </div>

      {/* TABEL DEPOSIT - Hanya MOZARTDP */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-blue-400 flex items-center">
            <span className="bg-blue-500 w-2 h-6 rounded-full mr-2"></span>
            DEPOSIT TRANSACTIONS
          </h2>
          <div className="text-xs bg-blue-900/30 px-3 py-1 rounded-full border border-blue-500/30">
            <span className="text-blue-400">Total: {depTotal}</span>
            <span className="text-green-400 ml-3">App: {depApproved}</span>
            <span className="text-red-400 ml-3">Rej: {depRejected}</span>
            <span className="text-orange-400 ml-3">Fail: {depFailed}</span>
            <span className="text-red-400 ml-3 font-bold">HE: {depHumanError}</span>
          </div>
        </div>
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
                kpiData
                  .filter(item => item.panel_id !== 'MOZARTWD') // Hanya filter MOZARTWD
                  .map((item, idx) => {
                    const filteredIndex = kpiData
                      .filter(i => i.panel_id !== 'MOZARTWD')
                      .findIndex(i => i.panel_id === item.panel_id)
                    
                    return (
                      <tr 
                        key={`dep-${item.panel_id}`} 
                        className={`border-b border-blue-500/10 hover:bg-[#0B1A33]/50 ${
                          item.panel_id === 'SYSTEM' || item.panel_id === 'MOZARTDP' ? 'bg-purple-900/20' : ''
                        }`}
                      >
                        <td className="px-2 py-2">{filteredIndex + 1}</td>
                        <td className="px-2 py-2 text-blue-400">{item.panel_id}</td>
                        <td className="px-2 py-2">{item.officer_name}</td>
                        <td className="px-2 py-2">{item.department}</td>
                        <td className="px-2 py-2">
                          <span className={`px-1 py-0.5 rounded text-[10px] ${
                            item.panel_id === 'SYSTEM' || item.panel_id === 'MOZARTDP' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        
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
                        
                        <td className="px-2 py-2 text-red-400">{item.dep_human_error}</td>
                      </tr>
                    )
                  })
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

      {/* TABEL WITHDRAWAL - Hanya MOZARTWD */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-green-400 flex items-center">
            <span className="bg-green-500 w-2 h-6 rounded-full mr-2"></span>
            WITHDRAWAL TRANSACTIONS
          </h2>
          <div className="text-xs bg-green-900/30 px-3 py-1 rounded-full border border-green-500/30">
            <span className="text-green-400">Total: {wdTotal}</span>
            <span className="text-green-400 ml-3">App: {wdApproved}</span>
            <span className="text-red-400 ml-3">Rej: {wdRejected}</span>
            <span className="text-orange-400 ml-3">Fail: {wdFailed}</span>
            <span className="text-red-400 ml-3 font-bold">HE: {wdHumanError}</span>
          </div>
        </div>
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
                kpiData
                  .filter(item => item.panel_id !== 'MOZARTDP') // Hanya filter MOZARTDP
                  .map((item, idx) => {
                    const filteredIndex = kpiData
                      .filter(i => i.panel_id !== 'MOZARTDP')
                      .findIndex(i => i.panel_id === item.panel_id)
                    
                    return (
                      <tr 
                        key={`wd-${item.panel_id}`} 
                        className={`border-b border-green-500/10 hover:bg-[#0B1A33]/50 ${
                          item.panel_id === 'SYSTEM' || item.panel_id === 'MOZARTWD' ? 'bg-purple-900/20' : ''
                        }`}
                      >
                        <td className="px-2 py-2">{filteredIndex + 1}</td>
                        <td className="px-2 py-2 text-green-400">{item.panel_id}</td>
                        <td className="px-2 py-2">{item.officer_name}</td>
                        <td className="px-2 py-2">{item.department}</td>
                        <td className="px-2 py-2">
                          <span className={`px-1 py-0.5 rounded text-[10px] ${
                            item.panel_id === 'SYSTEM' || item.panel_id === 'MOZARTWD' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        
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
                        
                        <td className="px-2 py-2 text-red-400">{item.wd_human_error}</td>
                      </tr>
                    )
                  })
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

      {/* SUMMARY GABUNGAN */}
      <div className="mt-4 bg-[#1A2F4A] p-3 rounded-lg border border-[#FFD700]/30 text-xs text-[#A7D8FF]">
        <div className="flex justify-between">
          <span>Total Officers: {kpiData.filter(o => o.panel_id !== 'MOZARTDP' && o.panel_id !== 'MOZARTWD').length - 1} + SYSTEM + MOZART</span>
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