// app/dashboard/transaction-metrics/page.js
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ===========================================
// HELPER: Format currency Rupiah
// ===========================================
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// ===========================================
// MAIN COMPONENT
// ===========================================

export default function TransactionMetricsPage() {
  // Filter states
  const [selectedAsset, setSelectedAsset] = useState('all') // 'all' atau 'LUCKY77'
  const [timeFilter, setTimeFilter] = useState('daily') // 'yesterday', 'daily', 'monthly', 'custom'
  
  // Date states
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  
  const [loading, setLoading] = useState(false)
  
  // Data structure
  const [totals, setTotals] = useState({
    // Main header
    total_deposit: 0,
    total_withdrawal: 0,
    total_bonus: 0,
    
    // Deposit breakdown
    deposit_approved: 0,
    deposit_rejected: 0,
    deposit_failed: 0,
    
    // Withdrawal breakdown
    withdrawal_approved: 0,
    withdrawal_rejected: 0,
    
    // Adjustment
    adjustment_plus: 0,
    adjustment_minus: 0,
    
    // Bonus breakdown
    bonus: 0,
    cashback: 0,
    commission: 0,
    referral: 0
  })

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const years = ['2024', '2025', '2026', '2027']
  
  // Asset options - LUCKY77 = XLY
  const assets = [
    { value: 'all', label: 'All Asset' },
    { value: 'LUCKY77', label: 'LUCKY77 (XLY)' }
  ]

  // ===========================================
  // INITIAL SETUP
  // ===========================================

  useEffect(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    setSelectedDate(todayStr)
    setSelectedMonth(months[today.getMonth()])
    setSelectedYear(today.getFullYear().toString())
    
    // Set default custom range (7 hari terakhir)
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 7)
    setCustomStartDate(start.toISOString().split('T')[0])
    setCustomEndDate(end.toISOString().split('T')[0])
  }, [])

  // ===========================================
  // GET DATE RANGE BASED ON FILTER
  // ===========================================

  const getDateRange = () => {
    let startDate = ''
    let endDate = ''
    let periodText = ''

    switch (timeFilter) {
      case 'yesterday':
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = yesterday.toISOString().split('T')[0]
        endDate = yesterday.toISOString().split('T')[0]
        periodText = `Yesterday (${startDate})`
        break
        
      case 'daily':
        startDate = selectedDate
        endDate = selectedDate
        periodText = selectedDate
        break
        
      case 'monthly':
        const monthIndex = months.indexOf(selectedMonth) + 1
        startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
        const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
        endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`
        periodText = `${selectedMonth} ${selectedYear}`
        break
        
      case 'custom':
        startDate = customStartDate
        endDate = customEndDate
        periodText = `${startDate} s/d ${endDate}`
        break
    }

    return { 
      startDate, 
      endDate, 
      periodText 
    }
  }

  // ===========================================
  // FETCH DATA (AKAN DIISI NANTI)
  // ===========================================

  const fetchData = async () => {
    setLoading(true)
    
    try {
      const { startDate, endDate, periodText } = getDateRange()
      console.log('🔍 Filter:', { 
        asset: selectedAsset, 
        dateRange: { startDate, endDate },
        period: periodText
      })
      
      // TODO: Ambil data dari database
      
      // SEMENTARA: Data dummy untuk testing tampilan
      setTotals({
        // Main header
        total_deposit: 1250000000,
        total_withdrawal: 875000000,
        total_bonus: 125000000,
        
        // Deposit breakdown
        deposit_approved: 1150000000,
        deposit_rejected: 75000000,
        deposit_failed: 25000000,
        
        // Withdrawal breakdown
        withdrawal_approved: 800000000,
        withdrawal_rejected: 75000000,
        
        // Adjustment
        adjustment_plus: 15000000,
        adjustment_minus: 5000000,
        
        // Bonus breakdown
        bonus: 50000000,
        cashback: 35000000,
        commission: 25000000,
        referral: 15000000
      })
      
    } catch (error) {
      console.error('❌ Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Trigger fetch when filters change
  useEffect(() => {
    fetchData()
  }, [selectedAsset, timeFilter, selectedDate, selectedMonth, selectedYear, customStartDate, customEndDate])

  const { periodText } = getDateRange()

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
      {/* Header */}
      <div className="mb-6">
        <Link href="/dashboard" className="text-[#FFD700] hover:underline inline-block mb-4">
          ← BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-3xl font-bold text-[#FFD700]">TRANSACTION METRICS</h1>
        <p className="text-[#A7D8FF] mt-2">Nilai transaksi deposit, withdrawal, bonus, dan adjustment</p>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex gap-4 items-center flex-wrap">
          {/* Asset Filter - LUCKY77 = XLY */}
          <select 
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
          >
            {assets.map((asset) => (
              <option key={asset.value} value={asset.value}>{asset.label}</option>
            ))}
          </select>

          {/* Time Filter Type */}
          <select 
            className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="yesterday">Yesterday</option>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Daily Filter */}
          {timeFilter === 'daily' && (
            <input
              type="date"
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          {/* Monthly Filter */}
          {timeFilter === 'monthly' && (
            <>
              <select 
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
              
              <select 
                className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[100px]"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </>
          )}

          {/* Custom Range Filter */}
          {timeFilter === 'custom' && (
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
            {selectedAsset === 'all' ? 'All Asset' : 'LUCKY77 (XLY)'} | {periodText}
          </div>
        </div>
      </div>

      {/* MAIN HEADER CARDS - Total Semua */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Total Deposit */}
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-950 p-6 rounded-lg border border-blue-500/30">
          <div className="text-blue-400 text-sm font-bold uppercase tracking-wider">Total Deposit</div>
          <div className="text-3xl font-bold text-white mt-2">
            {formatRupiah(totals.total_deposit)}
          </div>
          <div className="text-blue-300 text-xs mt-1">Semua status</div>
        </div>

        {/* Total Withdrawal */}
        <div className="bg-gradient-to-br from-green-900/50 to-green-950 p-6 rounded-lg border border-green-500/30">
          <div className="text-green-400 text-sm font-bold uppercase tracking-wider">Total Withdrawal</div>
          <div className="text-3xl font-bold text-white mt-2">
            {formatRupiah(totals.total_withdrawal)}
          </div>
          <div className="text-green-300 text-xs mt-1">Semua status</div>
        </div>

        {/* Total Bonus */}
        <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-950 p-6 rounded-lg border border-yellow-500/30">
          <div className="text-yellow-400 text-sm font-bold uppercase tracking-wider">Total Bonus</div>
          <div className="text-3xl font-bold text-white mt-2">
            {formatRupiah(totals.total_bonus)}
          </div>
          <div className="text-yellow-300 text-xs mt-1">Semua jenis bonus</div>
        </div>
      </div>

      {/* DEPOSIT SECTION */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-blue-400 mb-3 flex items-center">
          <span className="bg-blue-500 w-1 h-6 rounded-full mr-2"></span>
          DEPOSIT BREAKDOWN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Approved Deposit */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-400 text-sm font-medium">Approved</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.deposit_approved)}
                </div>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-xl">✓</span>
              </div>
            </div>
          </div>

          {/* Rejected Deposit */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-400 text-sm font-medium">Rejected</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.deposit_rejected)}
                </div>
              </div>
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xl">✗</span>
              </div>
            </div>
          </div>

          {/* Failed Deposit */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-orange-400 text-sm font-medium">Failed</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.deposit_failed)}
                </div>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="text-orange-400 text-xl">⚠</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WITHDRAWAL SECTION */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-green-400 mb-3 flex items-center">
          <span className="bg-green-500 w-1 h-6 rounded-full mr-2"></span>
          WITHDRAWAL BREAKDOWN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Approved Withdrawal */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-400 text-sm font-medium">Approved</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.withdrawal_approved)}
                </div>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-xl">✓</span>
              </div>
            </div>
          </div>

          {/* Rejected Withdrawal */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-400 text-sm font-medium">Rejected</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.withdrawal_rejected)}
                </div>
              </div>
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xl">✗</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADJUSTMENT SECTION */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-purple-400 mb-3 flex items-center">
          <span className="bg-purple-500 w-1 h-6 rounded-full mr-2"></span>
          ADJUSTMENT
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Adjustment + */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-green-400 text-sm font-medium">Adjustment +</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.adjustment_plus)}
                </div>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-xl">+</span>
              </div>
            </div>
          </div>

          {/* Adjustment - */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-400 text-sm font-medium">Adjustment -</div>
                <div className="text-2xl font-bold text-white mt-1">
                  {formatRupiah(totals.adjustment_minus)}
                </div>
              </div>
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <span className="text-red-400 text-xl">−</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BONUS SECTION */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-yellow-400 mb-3 flex items-center">
          <span className="bg-yellow-500 w-1 h-6 rounded-full mr-2"></span>
          BONUS BREAKDOWN
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bonus */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-yellow-500/30">
            <div className="text-yellow-400 text-sm font-medium">Bonus</div>
            <div className="text-xl font-bold text-white mt-1">
              {formatRupiah(totals.bonus)}
            </div>
          </div>

          {/* Cashback */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-yellow-500/30">
            <div className="text-yellow-400 text-sm font-medium">Cashback</div>
            <div className="text-xl font-bold text-white mt-1">
              {formatRupiah(totals.cashback)}
            </div>
          </div>

          {/* Commission */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-yellow-500/30">
            <div className="text-yellow-400 text-sm font-medium">Commission</div>
            <div className="text-xl font-bold text-white mt-1">
              {formatRupiah(totals.commission)}
            </div>
          </div>

          {/* Referral */}
          <div className="bg-[#1A2F4A] p-5 rounded-lg border border-yellow-500/30">
            <div className="text-yellow-400 text-sm font-medium">Referral</div>
            <div className="text-xl font-bold text-white mt-1">
              {formatRupiah(totals.referral)}
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Net Flow Card */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="flex justify-between items-center">
            <span className="text-[#A7D8FF]">Net Flow (Deposit - Withdrawal)</span>
            <span className={`text-2xl font-bold ${totals.total_deposit - totals.total_withdrawal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatRupiah(totals.total_deposit - totals.total_withdrawal)}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#A7D8FF]">Asset</span>
            <span className="text-white font-bold">{selectedAsset === 'all' ? 'All Asset' : 'LUCKY77 (XLY)'}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2">
            <span className="text-[#A7D8FF]">Periode</span>
            <span className="text-white">{periodText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}