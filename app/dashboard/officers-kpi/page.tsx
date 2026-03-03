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
  const [selectedFilter, setSelectedFilter] = useState('period1')
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState<KPIData[]>([])
  const [officers, setOfficers] = useState<Officer[]>([])
  const [error, setError] = useState<string | null>(null)

  // Filter options
  const filterOptions = [
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'period1', label: 'Jan-Jun 2026' },
    { value: 'period2', label: 'Jul-Dec 2026' },
  ]

  // ===========================================
  // GET DATE RANGE
  // ===========================================

  const getDateRange = (filter: string) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    switch(filter) {
      case 'yesterday':
        return {
          start: yesterday.toISOString().split('T')[0],
          end: yesterday.toISOString().split('T')[0]
        }
      
      case 'weekly':
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 7)
        return {
          start: weekAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        }
      
      case 'monthly':
        const monthAgo = new Date(today)
        monthAgo.setMonth(today.getMonth() - 1)
        return {
          start: monthAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        }
      
      case 'period1':
        return {
          start: '2026-01-01',
          end: '2026-06-30'
        }
      
      case 'period2':
        return {
          start: '2026-07-01',
          end: '2026-12-31'
        }
      
      default:
        return {
          start: yesterday.toISOString().split('T')[0],
          end: yesterday.toISOString().split('T')[0]
        }
    }
  }

  // ===========================================
  // FETCH DATA
  // ===========================================

  useEffect(() => {
    fetchOfficers()
  }, [])

  useEffect(() => {
    if (selectedFilter && officers.length > 0) {
      fetchKPI()
    }
  }, [selectedFilter, officers])

  const fetchOfficers = async () => {
    try {
      setError(null)
      console.log('🔍 Fetching officers...')
      
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, department')
        .in('department', ['CS DP WD', 'CAPTAIN'])
        .order('full_name')

      if (error) throw error
      
      console.log('📊 Officers found:', data?.length || 0)
      setOfficers(data || [])
      
    } catch (error: any) {
      console.error('❌ Error fetching officers:', error)
      setError(error.message)
    }
  }

  const fetchKPI = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const range = getDateRange(selectedFilter)
      console.log('🔍 Filter:', { selectedFilter, range })

      // Ambil data deposit
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select(`
          handler,
          status,
          duration_minutes,
          reason
        `)
        .gte('approved_date', range.start)
        .lte('approved_date', range.end)

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
        .gte('approved_date', range.start)
        .lte('approved_date', range.end)

      if (withdrawalError) throw withdrawalError

      console.log('📊 Deposit data:', depositData?.length || 0)
      console.log('📊 Withdrawal data:', withdrawalData?.length || 0)

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

      // Proses deposit
      depositData?.forEach((tx: any) => {
        // Pastikan handler ada dan string
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const officer = officers.find(o => 
          o.id?.toLowerCase() === tx.handler.toLowerCase()
        )
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
        // Pastikan handler ada dan string
        if (!tx.handler || typeof tx.handler !== 'string') return
        
        const officer = officers.find(o => 
          o.id?.toLowerCase() === tx.handler.toLowerCase()
        )
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
        <p className="text-[#A7D8FF] mt-2">Performance monitoring per officer</p>
      </div>

      {/* FILTER */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                selectedFilter === option.value
                  ? 'bg-[#FFD700] text-[#0B1A33]'
                  : 'bg-[#0B1A33] text-[#A7D8FF] hover:bg-[#2A3F5A]'
              }`}
            >
              {option.label}
            </button>
          ))}
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
                  <p className="text-lg mb-1">Belum ada data untuk periode ini</p>
                  <p className="text-sm">Coba pilih periode lain atau upload data terlebih dahulu</p>
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
    </div>
  )
}