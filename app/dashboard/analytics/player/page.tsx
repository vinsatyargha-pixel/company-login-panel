'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

// ===========================================
// TYPES
// ===========================================
interface MemberStats {
  account_id: string
  asset_code: string
  member_id: string
  total_net_turnover: number
  member_total: number
  win_rate: number
  games_played: number
  biggest_win: number
}

interface ProductStats {
  product_type: string
  total_net_turnover: number
  member_total: number
  member_count: number
  bet_count: number
  win_rate: number
}

interface WinDetail {
  account_id: string
  asset_code: string
  member_id: string
  win_amount: number
  product_type: string
  date: string
}

interface NetDepositWithdraw {
  account_id: string
  asset_code: string
  member_id: string
  total_deposit: number
  total_withdraw: number
  net_amount: number
  transaction_count: number
}

interface TopDeposit {
  account_id: string
  asset_code: string
  member_id: string
  total_deposit: number
  transaction_count: number
  avg_deposit: number
}

interface TopWithdrawal {
  account_id: string
  asset_code: string
  member_id: string
  total_withdraw: number
  transaction_count: number
  avg_withdraw: number
}

interface PlayerRatio {
  member_id: string
  asset_code: string
  total_deposit: number
  total_withdraw: number
  ratio: number
  ratio_display: string
}

export default function PlayerOverviewPage() {
  // ===========================================
  // STATES
  // ===========================================
  const [selectedAsset, setSelectedAsset] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('Januari')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)
  const [rangeType, setRangeType] = useState<'monthly' | 'custom' | 'yesterday'>('monthly')
  const [loading, setLoading] = useState(false)
  const [hasData, setHasData] = useState(false)
  
  // Summary stats
  const [uniquePlayerCount, setUniquePlayerCount] = useState(0)
  const [totalNetTurnover, setTotalNetTurnover] = useState(0)
  const [netWinLose, setNetWinLose] = useState(0)
  const [totalGames, setTotalGames] = useState(0)
  
  // Detail data
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [bigWins, setBigWins] = useState<WinDetail[]>([])
  const [highestNetTurnover, setHighestNetTurnover] = useState<MemberStats[]>([])
  const [netDepositWithdraw, setNetDepositWithdraw] = useState<NetDepositWithdraw[]>([])
  const [topDeposit, setTopDeposit] = useState<TopDeposit[]>([])
  const [topWithdrawal, setTopWithdrawal] = useState<TopWithdrawal[]>([])
  const [topRatioPlayers, setTopRatioPlayers] = useState<PlayerRatio[]>([])

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const years = ['2025', '2026', '2027']
  const assets = ['XLY']

  // ===========================================
  // FETCH ALL DATA WITH PAGINATION
  // ===========================================
  const fetchAllDataWithPagination = async (queryBuilder: any) => {
    let allData: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data, error } = await queryBuilder
        .range(page * pageSize, (page + 1) * pageSize - 1)

      if (error) throw error

      if (data && data.length > 0) {
        allData = [...allData, ...data]
        page++
        hasMore = data.length === pageSize
      } else {
        hasMore = false
      }
    }

    return allData
  }

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  
  // Buang prefix XLY dari account_id
  const cleanAccountId = (fullId: string): string => {
    if (!fullId) return ''
    if (fullId.toUpperCase().startsWith('XLY')) {
      return fullId.substring(3)
    }
    return fullId
  }

  const formatMemberId = (userName: string, brand: string = 'XLY'): string => {
    if (!userName) return ''
    const cleanName = userName.trim()
    const assetCode = brand && brand.trim() !== '' ? brand.trim().toUpperCase() : 'XLY'
    return assetCode + cleanName
  }

  const parseAccountId = (fullId: string): { asset_code: string; member_id: string } => {
    if (!fullId) return { asset_code: 'XLY', member_id: '' }
    const possibleAsset = fullId.substring(0, 3).toUpperCase()
    const validAssets = ['XLY', 'XLA', 'XLB', 'XLC']
    if (validAssets.includes(possibleAsset)) {
      return {
        asset_code: possibleAsset,
        member_id: fullId.substring(3)
      }
    }
    return {
      asset_code: 'XLY',
      member_id: fullId
    }
  }

  const filterByAsset = (row: any): boolean => {
    if (selectedAsset === 'all') return true
    if (row.brand && row.brand.trim() !== '') {
      return row.brand === selectedAsset
    }
    const id = row.account_id || row.user_name
    if (id) {
      const { asset_code } = parseAccountId(id)
      return asset_code === selectedAsset
    }
    return true
  }

  // ===========================================
  // GET DATE RANGE (KONSISTEN UNTUK SEMUA QUERY)
  // ===========================================
  const getDateRange = () => {
    if (rangeType === 'yesterday') {
      const jakartaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
      const yesterday = new Date(jakartaNow)
      yesterday.setDate(yesterday.getDate() - 1)
      const year = yesterday.getFullYear()
      const month = String(yesterday.getMonth() + 1).padStart(2, '0')
      const day = String(yesterday.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      return { start: dateStr, end: dateStr }
    }
    
    if (rangeType === 'custom' && customStartDate && customEndDate) {
      return {
        start: customStartDate.toISOString().split('T')[0],
        end: customEndDate.toISOString().split('T')[0]
      }
    }
    
    const monthIndex = months.indexOf(selectedMonth) + 1
    const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
    const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
    const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`
    return { start: startDate, end: endDate }
  }

  // ===========================================
  // FETCH DATA - SEMUA QUERY PAKAI FILTER YANG SAMA
  // ===========================================
  useEffect(() => {
    if (rangeType === 'monthly' && selectedMonth && selectedYear) {
      fetchAllData()
    }
  }, [selectedMonth, selectedYear, selectedAsset, rangeType])

  useEffect(() => {
    if (rangeType === 'yesterday') {
      fetchAllData()
    }
  }, [selectedAsset, rangeType])

  useEffect(() => {
    if (rangeType === 'custom' && customStartDate && customEndDate) {
      fetchAllData()
    }
  }, [customStartDate, customEndDate, selectedAsset, rangeType])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      console.log('📅 FETCHING DATA PERIODE:', { start, end, rangeType })

      // ===========================================
      // 1. FETCH WINLOSE TRANSACTIONS
      // ===========================================
      const { data: winloseData, error: winloseError } = await supabase
        .from('winlose_transactions')
        .select('*')
        .gte('period_start', start)
        .lte('period_end', end)

      if (winloseError) throw winloseError

      // ===========================================
      // 2. FETCH DEPOSIT & WITHDRAWAL DENGAN FILTER TANGGAL YANG SAMA
      // ===========================================
      let depositQuery = supabase
        .from('deposit_transactions')
        .select('user_name, nett_amount, brand, approved_date')
        .eq('status', 'Approved')
        .gte('approved_date', start + ' 00:00:00')
        .lte('approved_date', end + ' 23:59:59')

      let withdrawQuery = supabase
        .from('withdrawal_transactions')
        .select('user_name, nett_amount, brand, approved_date')
        .eq('status', 'Approved')
        .gte('approved_date', start + ' 00:00:00')
        .lte('approved_date', end + ' 23:59:59')

      const depositData = await fetchAllDataWithPagination(depositQuery)
      const withdrawData = await fetchAllDataWithPagination(withdrawQuery)

      console.log('📊 DEPOSIT DATA TOTAL:', depositData.length, 'rows')
      console.log('📊 WITHDRAW DATA TOTAL:', withdrawData.length, 'rows')

      // ===========================================
      // PROCESS WINLOSE DATA
      // ===========================================
      if (!winloseData || winloseData.length === 0) {
        setHasData(false)
        resetData()
        setLoading(false)
        return
      }

      const filteredWinlose = winloseData.filter((row: any) => filterByAsset(row))

      if (filteredWinlose.length === 0) {
        setHasData(false)
        resetData()
        setLoading(false)
        return
      }

      setHasData(true)

      const validRows = filteredWinlose.filter((row: any) => 
        row.account_id && row.account_id !== '' && !row.account_id.toString().includes('Sub Total')
      )

      const totalNetTurnover = validRows.reduce((sum: number, row: any) => sum + (row.net_turnover || 0), 0)
      const totalMemberTotal = validRows.reduce((sum: number, row: any) => sum + (row.member_total || 0), 0)
      const totalGames = validRows.reduce((sum: number, row: any) => sum + (row.bet_count || 0), 0)

      setTotalNetTurnover(totalNetTurnover)
      setNetWinLose(totalMemberTotal)
      setTotalGames(totalGames)

      const uniquePlayers = new Set(validRows.map((d: any) => cleanAccountId(d.account_id)))
      setUniquePlayerCount(uniquePlayers.size)

      // MEMBER STATS
      const memberMap = new Map<string, MemberStats>()
      const winDetails: WinDetail[] = []

      validRows.forEach((row: any) => {
        const fullId = row.account_id
        const cleanId = cleanAccountId(fullId)
        const { asset_code, member_id } = parseAccountId(fullId)
        const memberTotal = row.member_total || 0
        const netTurnover = row.net_turnover || 0
        
        if (!memberMap.has(cleanId)) {
          memberMap.set(cleanId, {
            account_id: cleanId,
            asset_code,
            member_id: cleanId,
            total_net_turnover: 0,
            member_total: 0,
            win_rate: 0,
            games_played: 0,
            biggest_win: 0
          })
        }
        
        const stats = memberMap.get(cleanId)!
        stats.total_net_turnover += netTurnover
        stats.member_total += memberTotal
        stats.games_played += row.bet_count || 0
        
        if (memberTotal > stats.biggest_win) {
          stats.biggest_win = memberTotal
        }
        
        if (memberTotal > 0) {
          winDetails.push({
            account_id: cleanId,
            asset_code,
            member_id: cleanId,
            win_amount: memberTotal,
            product_type: row.product_type,
            date: row.period_start
          })
        }
      })

      memberMap.forEach(stats => {
        stats.win_rate = stats.total_net_turnover > 0 
          ? (stats.member_total / stats.total_net_turnover) * 100 
          : 0
      })

      const membersArray = Array.from(memberMap.values())

      setHighestNetTurnover(
        [...membersArray]
          .sort((a, b) => b.total_net_turnover - a.total_net_turnover)
          .slice(0, 100)
      )

      setBigWins(
        winDetails
          .sort((a, b) => b.win_amount - a.win_amount)
          .slice(0, 50)
      )

      // PRODUCT STATS
      const productMap = new Map<string, ProductStats>()
      
      validRows.forEach((row: any) => {
        const product = row.product_type
        if (!product) return
        
        if (!productMap.has(product)) {
          productMap.set(product, {
            product_type: product,
            total_net_turnover: 0,
            member_total: 0,
            member_count: 0,
            bet_count: 0,
            win_rate: 0
          })
        }
        
        const stats = productMap.get(product)!
        stats.total_net_turnover += row.net_turnover || 0
        stats.member_total += row.member_total || 0
        stats.bet_count += row.bet_count || 0
      })

      const memberPerProduct = new Map<string, Set<string>>()
      validRows.forEach((row: any) => {
        const product = row.product_type
        const account = cleanAccountId(row.account_id)
        if (!product || !account) return
        
        if (!memberPerProduct.has(product)) {
          memberPerProduct.set(product, new Set())
        }
        memberPerProduct.get(product)!.add(account)
      })

      productMap.forEach((stats, product) => {
        stats.member_count = memberPerProduct.get(product)?.size || 0
        stats.win_rate = stats.total_net_turnover > 0 
          ? (stats.member_total / stats.total_net_turnover) * 100 
          : 0
      })

      setProductStats(
        Array.from(productMap.values())
          .sort((a, b) => b.member_total - a.member_total)
      )

      // ===========================================
      // PROCESS RATIO WITHDRAW/DEPOSIT
      // ===========================================
      const ratioMap = new Map<string, PlayerRatio>()

      depositData?.forEach((row: any) => {
        if (!filterByAsset(row)) return
        const key = row.user_name?.toLowerCase().trim() || ''
        const amount = row.nett_amount || 0
        
        if (!ratioMap.has(key)) {
          ratioMap.set(key, {
            member_id: row.user_name,
            asset_code: row.brand || 'XLY',
            total_deposit: 0,
            total_withdraw: 0,
            ratio: 0,
            ratio_display: '0:1'
          })
        }
        ratioMap.get(key)!.total_deposit += amount
      })

      withdrawData?.forEach((row: any) => {
        if (!filterByAsset(row)) return
        const key = row.user_name?.toLowerCase().trim() || ''
        const amount = row.nett_amount || 0
        
        if (!ratioMap.has(key)) {
          ratioMap.set(key, {
            member_id: row.user_name,
            asset_code: row.brand || 'XLY',
            total_deposit: 0,
            total_withdraw: 0,
            ratio: 0,
            ratio_display: '0:1'
          })
        }
        ratioMap.get(key)!.total_withdraw += amount
      })

      ratioMap.forEach((player) => {
        if (player.total_deposit > 0) {
          player.ratio = player.total_withdraw / player.total_deposit
          player.ratio_display = player.ratio.toFixed(1) + ':1'
        } else if (player.total_withdraw > 0) {
          player.ratio_display = '∞:1'
          player.ratio = Infinity
        } else {
          player.ratio_display = '0:1'
          player.ratio = 0
        }
      })

      setTopRatioPlayers(
        Array.from(ratioMap.values())
          .sort((a, b) => {
            if (a.ratio === Infinity && b.ratio === Infinity) return 0
            if (a.ratio === Infinity) return -1
            if (b.ratio === Infinity) return 1
            return b.ratio - a.ratio
          })
          .slice(0, 100)
      )

      // ===========================================
      // PROCESS NET DEPOSIT VS WITHDRAW, TOP DEPOSIT, TOP WITHDRAWAL
      // ===========================================
      const netMap = new Map<string, NetDepositWithdraw>()
      const depositMapData = new Map<string, TopDeposit>()
      const withdrawMapData = new Map<string, TopWithdrawal>()

      // PROCESS DEPOSIT
      depositData?.forEach((row: any) => {
        if (!filterByAsset(row)) return
        const key = row.user_name?.toLowerCase().trim() || ''
        const amount = row.nett_amount || 0

        // NET MAP
        if (!netMap.has(key)) {
          netMap.set(key, {
            account_id: key,
            asset_code: row.brand || 'XLY',
            member_id: row.user_name,
            total_deposit: 0,
            total_withdraw: 0,
            net_amount: 0,
            transaction_count: 0
          })
        }
        const netData = netMap.get(key)!
        netData.total_deposit += amount
        netData.net_amount = netData.total_deposit - netData.total_withdraw
        netData.transaction_count++

        // DEPOSIT MAP
        if (!depositMapData.has(key)) {
          depositMapData.set(key, {
            account_id: key,
            asset_code: row.brand || 'XLY',
            member_id: row.user_name,
            total_deposit: 0,
            transaction_count: 0,
            avg_deposit: 0
          })
        }
        const depData = depositMapData.get(key)!
        depData.total_deposit += amount
        depData.transaction_count++
        depData.avg_deposit = depData.total_deposit / depData.transaction_count
      })

      // PROCESS WITHDRAW
      withdrawData?.forEach((row: any) => {
        if (!filterByAsset(row)) return
        const key = row.user_name?.toLowerCase().trim() || ''
        const amount = row.nett_amount || 0

        // NET MAP
        if (!netMap.has(key)) {
          netMap.set(key, {
            account_id: key,
            asset_code: row.brand || 'XLY',
            member_id: row.user_name,
            total_deposit: 0,
            total_withdraw: 0,
            net_amount: 0,
            transaction_count: 0
          })
        }
        const netData = netMap.get(key)!
        netData.total_withdraw += amount
        netData.net_amount = netData.total_deposit - netData.total_withdraw
        netData.transaction_count++

        // WITHDRAW MAP
        if (!withdrawMapData.has(key)) {
          withdrawMapData.set(key, {
            account_id: key,
            asset_code: row.brand || 'XLY',
            member_id: row.user_name,
            total_withdraw: 0,
            transaction_count: 0,
            avg_withdraw: 0
          })
        }
        const wdData = withdrawMapData.get(key)!
        wdData.total_withdraw += amount
        wdData.transaction_count++
        wdData.avg_withdraw = wdData.total_withdraw / wdData.transaction_count
      })

      // SET STATE
      setNetDepositWithdraw(
        Array.from(netMap.values())
          .sort((a, b) => b.net_amount - a.net_amount)
          .slice(0, 100)
      )

      setTopDeposit(
        Array.from(depositMapData.values())
          .sort((a, b) => b.total_deposit - a.total_deposit)
          .slice(0, 100)
      )

      setTopWithdrawal(
        Array.from(withdrawMapData.values())
          .sort((a, b) => b.total_withdraw - a.total_withdraw)
          .slice(0, 100)
      )

      console.log('📊 FINAL DATA:', {
        netDepositWithdraw: netMap.size,
        topDeposit: depositMapData.size,
        topWithdrawal: withdrawMapData.size,
        topRatio: ratioMap.size,
        totalDepositRows: depositData.length,
        totalWithdrawRows: withdrawData.length
      })

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetData = () => {
    setUniquePlayerCount(0)
    setTotalNetTurnover(0)
    setNetWinLose(0)
    setTotalGames(0)
    setProductStats([])
    setBigWins([])
    setHighestNetTurnover([])
    setNetDepositWithdraw([])
    setTopDeposit([])
    setTopWithdrawal([])
    setTopRatioPlayers([])
  }

  // ===========================================
  // FORMATTERS
  // ===========================================
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatPercent = (num: number) => {
    return num.toFixed(2) + '%'
  }

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* HEADER */}
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Link href="/dashboard/analytics" className="text-[#FFD700] hover:underline">
          ← BACK TO ANALYTICS
        </Link>
        <div className="text-[#FFD700] font-bold text-xl">👤 PLAYER OVERVIEW</div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-[#A7D8FF] block mb-1">ASSET</label>
            <select 
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[120px]"
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
            >
              <option value="all">SEMUA ASSET</option>
              {assets.map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setRangeType('monthly')} 
              className={`px-4 py-2 rounded-lg ${rangeType === 'monthly' ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}
            >
              Bulanan
            </button>
            <button 
              onClick={() => setRangeType('yesterday')} 
              className={`px-4 py-2 rounded-lg ${rangeType === 'yesterday' ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}
            >
              Yesterday
            </button>
            <button 
              onClick={() => setRangeType('custom')} 
              className={`px-4 py-2 rounded-lg ${rangeType === 'custom' ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}
            >
              Custom Range
            </button>
          </div>

          {rangeType === 'monthly' && (
            <>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">BULAN</label>
                <select 
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">TAHUN</label>
                <select 
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </>
          )}

          {rangeType === 'custom' && (
            <>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">DARI TANGGAL</label>
                <DatePicker
                  selected={customStartDate}
                  onChange={(date: Date | null) => setCustomStartDate(date || undefined)}
                  selectsStart
                  startDate={customStartDate}
                  endDate={customEndDate}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pilih tanggal"
                />
              </div>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">SAMPAI TANGGAL</label>
                <DatePicker
                  selected={customEndDate}
                  onChange={(date: Date | null) => setCustomEndDate(date || undefined)}
                  selectsEnd
                  startDate={customStartDate}
                  endDate={customEndDate}
                  minDate={customStartDate}
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Pilih tanggal"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
        </div>
      )}

      {!loading && !hasData && (
        <div className="bg-[#1A2F4A] p-12 rounded-lg text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-xl text-[#FFD700] font-bold mb-2">Belum Ada Data Player</h2>
          <p className="text-[#A7D8FF]">
            Pilih periode yang ada datanya atau upload data dulu
          </p>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
              <div className="text-sm text-[#A7D8FF]">Active Players</div>
              <div className="text-2xl font-bold text-[#FFD700]">{formatNumber(uniquePlayerCount)}</div>
            </div>
            <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
              <div className="text-sm text-[#A7D8FF]">Total Net Turnover</div>
              <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalNetTurnover)}</div>
            </div>
            <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
              <div className="text-sm text-[#A7D8FF]">Net Win/Lose</div>
              <div className={`text-2xl font-bold ${netWinLose <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netWinLose)}
              </div>
            </div>
            <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
              <div className="text-sm text-[#A7D8FF]">Total Bet/times</div>
              <div className="text-2xl font-bold text-purple-400">{formatNumber(totalGames)}</div>
            </div>
          </div>

          {/* MEMBER SPECIFICATION BUTTON */}
          <Link href="/dashboard/analytics/player/member-specification">
            <div className="mb-6 relative group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] rounded-xl blur-lg animate-pulse opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-[#1A2F4A] to-[#2A3F5A] border border-[#FFD700] rounded-xl p-4 flex items-center justify-between hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#FFD700]/20 flex items-center justify-center animate-bounce">
                    <svg className="w-6 h-6 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#FFD700]">👥 MEMBER SPECIFICATION</h3>
                    <p className="text-xs text-[#A7D8FF]">Detail spesifikasi member, analisis mendalam tiap player</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD700] text-sm font-medium animate-pulse">Klik untuk lihat detail →</span>
                  <svg className="w-5 h-5 text-[#FFD700] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* BOX RATIO WITHDRAW/DEPOSIT */}
              <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
                <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                  <h2 className="text-[#FFD700] font-bold">📊 TOP 100 RATIO WITHDRAW/DEPOSIT</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">#</th>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Player</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Asset</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Deposit</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Withdraw</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Ratio (W/D)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topRatioPlayers.map((player, idx) => {
                        let ratioColor = 'text-gray-400'
                        let badge = ''
                        
                        if (player.ratio === Infinity) {
                          ratioColor = 'text-purple-400 font-bold'
                          badge = '🎁'
                        } else if (player.ratio > 5) {
                          ratioColor = 'text-green-400 font-bold'
                          badge = '🔥'
                        } else if (player.ratio > 2) {
                          ratioColor = 'text-green-400'
                          badge = '👍'
                        } else if (player.ratio > 1) {
                          ratioColor = 'text-blue-400'
                          badge = '💰'
                        } else if (player.ratio === 1) {
                          ratioColor = 'text-yellow-400'
                          badge = '⚖️'
                        } else if (player.ratio > 0) {
                          ratioColor = 'text-red-400'
                          badge = '📉'
                        } else {
                          ratioColor = 'text-gray-400'
                          badge = '💤'
                        }
                        
                        return (
                          <tr key={player.member_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                            <td className="px-2 py-1 text-sm">#{idx + 1}</td>
                            <td className="px-2 py-1 text-sm text-[#A7D8FF]">{player.member_id}</td>
                            <td className="px-2 py-1 text-sm text-right text-[#FFD700]">{player.asset_code}</td>
                            <td className="px-2 py-1 text-sm text-right text-green-400">{formatCurrency(player.total_deposit)}</td>
                            <td className="px-2 py-1 text-sm text-right text-red-400">{formatCurrency(player.total_withdraw)}</td>
                            <td className={`px-2 py-1 text-sm text-right ${ratioColor}`}>
                              {badge} {player.ratio_display}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BOX BIG WINS */}
              <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
                <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                  <h2 className="text-[#FFD700] font-bold">💰 BIG WINS (Top 50)</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">#</th>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Player</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Win</th>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bigWins.map((win, idx) => (
                        <tr key={idx} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                          <td className="px-2 py-1 text-sm">#{idx + 1}</td>
                          <td className="px-2 py-1 text-sm text-[#A7D8FF]">{win.member_id}</td>
                          <td className="px-2 py-1 text-sm text-right text-red-400">{formatCurrency(win.win_amount)}</td>
                          <td className="px-2 py-1 text-sm">{win.product_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
                <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                  <h2 className="text-[#FFD700] font-bold">📊 HIGHEST NET TURNOVER (Top 100)</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">#</th>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Player</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Asset</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Net Turnover</th>
                      </tr>
                    </thead>
                    <tbody>
                      {highestNetTurnover.map((member, idx) => (
                        <tr key={member.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                          <td className="px-2 py-1 text-sm">#{idx + 1}</td>
                          <td className="px-2 py-1 text-sm text-[#A7D8FF]">{member.member_id}</td>
                          <td className="px-2 py-1 text-sm text-right text-[#FFD700]">{member.asset_code}</td>
                          <td className="px-2 py-1 text-sm text-right text-blue-400">{formatCurrency(member.total_net_turnover)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
                <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                  <h2 className="text-[#FFD700] font-bold">🎰 PROVIDER PERFORMANCE</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Provider</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Net Turnover</th>
                        <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Member Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productStats.map((product) => (
                        <tr key={product.product_type} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                          <td className="px-2 py-1 text-sm font-medium">{product.product_type}</td>
                          <td className="px-2 py-1 text-sm text-right">{formatCurrency(product.total_net_turnover)}</td>
                          <td className={`px-2 py-1 text-sm text-right ${product.member_total <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(product.member_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* NET DEPOSIT VS WITHDRAW */}
          <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden mb-6">
            <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
              <h2 className="text-[#FFD700] font-bold">💰 NET DEPOSIT VS WITHDRAW (Top 100)</h2>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-[#0B1A33]/50 sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">#</th>
                    <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Player</th>
                    <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Asset</th>
                    <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Deposit</th>
                    <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Withdraw</th>
                    <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Net</th>
                    <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Trans</th>
                  </tr>
                </thead>
                <tbody>
                  {netDepositWithdraw.map((item, idx) => (
                    <tr key={item.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                      <td className="px-2 py-1 text-sm">#{idx + 1}</td>
                      <td className="px-2 py-1 text-sm text-[#A7D8FF]">{item.member_id}</td>
                      <td className="px-2 py-1 text-sm text-right text-[#FFD700]">{item.asset_code}</td>
                      <td className="px-2 py-1 text-sm text-right text-green-400">{formatCurrency(item.total_deposit)}</td>
                      <td className="px-2 py-1 text-sm text-right text-red-400">{formatCurrency(item.total_withdraw)}</td>
                      <td className={`px-2 py-1 text-sm text-right font-bold ${item.net_amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(item.net_amount)}
                      </td>
                      <td className="px-2 py-1 text-sm text-right">{item.transaction_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TOP DEPOSIT & WITHDRAWAL */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
              <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                <h2 className="text-[#FFD700] font-bold">🏦 TOP DEPOSIT (By Total)</h2>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#0B1A33]/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">#</th>
                      <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Player</th>
                      <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Asset</th>
                      <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Total Deposit</th>
                      <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Trans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDeposit.map((item, idx) => (
                      <tr key={item.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                        <td className="px-2 py-1 text-sm">#{idx + 1}</td>
                        <td className="px-2 py-1 text-sm text-[#A7D8FF]">{item.member_id}</td>
                        <td className="px-2 py-1 text-sm text-right text-[#FFD700]">{item.asset_code}</td>
                        <td className="px-2 py-1 text-sm text-right text-green-400">{formatCurrency(item.total_deposit)}</td>
                        <td className="px-2 py-1 text-sm text-right">{item.transaction_count}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
              <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                <h2 className="text-[#FFD700] font-bold">💸 TOP WITHDRAWAL (By Total)</h2>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-[#0B1A33]/50 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">#</th>
                      <th className="px-2 py-2 text-left text-xs text-[#A7D8FF]">Player</th>
                      <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Asset</th>
                      <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Total Withdraw</th>
                      <th className="px-2 py-2 text-right text-xs text-[#A7D8FF]">Trans</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topWithdrawal.map((item, idx) => (
                      <tr key={item.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                        <td className="px-2 py-1 text-sm">#{idx + 1}</td>
                        <td className="px-2 py-1 text-sm text-[#A7D8FF]">{item.member_id}</td>
                        <td className="px-2 py-1 text-sm text-right text-[#FFD700]">{item.asset_code}</td>
                        <td className="px-2 py-1 text-sm text-right text-red-400">{formatCurrency(item.total_withdraw)}</td>
                        <td className="px-2 py-1 text-sm text-right">{item.transaction_count}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}