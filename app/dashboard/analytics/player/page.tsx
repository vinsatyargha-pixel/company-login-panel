'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

// ===========================================
// TYPES - TAMBAH INTERFACE UNTUK RATIO
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

// INTERFACE BARU UNTUK RATIO WITHDRAW/DEPOSIT
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
  const [topMembers, setTopMembers] = useState<MemberStats[]>([])      // Masih dipake untuk HIGHEST NET TURNOVER
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [bigWins, setBigWins] = useState<WinDetail[]>([])
  const [highestNetTurnover, setHighestNetTurnover] = useState<MemberStats[]>([])
  const [netDepositWithdraw, setNetDepositWithdraw] = useState<NetDepositWithdraw[]>([])
  const [topDeposit, setTopDeposit] = useState<TopDeposit[]>([])
  const [topWithdrawal, setTopWithdrawal] = useState<TopWithdrawal[]>([])
  
  // STATE BARU UNTUK RATIO WITHDRAW/DEPOSIT
  const [topRatioPlayers, setTopRatioPlayers] = useState<PlayerRatio[]>([])

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const years = ['2025', '2026', '2027']
  const assets = ['XLY']

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================
  const parseAccountId = (fullId: string): { asset_code: string; member_id: string } => {
    if (!fullId) return { asset_code: 'XLY', member_id: '' }
    const asset_code = fullId.substring(0, 3).toUpperCase()
    const member_id = fullId.substring(3)
    return { asset_code, member_id }
  }

  const formatMemberId = (userName: string, assetCode: string = 'XLY'): string => {
    if (!userName) return ''
    if (userName.startsWith('XLY')) return userName
    return assetCode + userName
  }

  const filterByAsset = (row: any): boolean => {
    if (selectedAsset === 'all') return true
    if (row.brand) return row.brand === selectedAsset
    const id = row.account_id || row.user_name
    if (id) {
      const { asset_code } = parseAccountId(id)
      return asset_code === selectedAsset
    }
    return false
  }

  // ===========================================
  // GET DATE RANGE - FIXED YESTERDAY WITH JAKARTA TIMEZONE
  // ===========================================
  const getDateRange = () => {
    // YESTERDAY - PAKSA JAKARTA TIMEZONE (FIXED)
    if (rangeType === 'yesterday') {
      // Paksa ke Jakarta time
      const jakartaNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
      
      // Kurangi 1 hari untuk yesterday
      const yesterday = new Date(jakartaNow)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Format YYYY-MM-DD
      const year = yesterday.getFullYear()
      const month = String(yesterday.getMonth() + 1).padStart(2, '0')
      const day = String(yesterday.getDate()).padStart(2, '0')
      const dateStr = `${year}-${month}-${day}`
      
      console.log('📅 YESTERDAY (JAKARTA):', {
        jakartaNow: jakartaNow.toLocaleString('id-ID'),
        yesterday: yesterday.toLocaleString('id-ID'),
        dateStr: dateStr
      })
      
      return {
        start: dateStr,
        end: dateStr
      }
    }
    
    // CUSTOM RANGE
    if (rangeType === 'custom' && customStartDate && customEndDate) {
      return {
        start: customStartDate.toISOString().split('T')[0],
        end: customEndDate.toISOString().split('T')[0]
      }
    }
    
    // MONTHLY (default)
    const monthIndex = months.indexOf(selectedMonth) + 1
    const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
    const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
    const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`
    return { start: startDate, end: endDate }
  }

  // ===========================================
  // FETCH DATA
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
      
      console.log('📅 FETCHING DATA PERIODE:', { 
        start, 
        end, 
        rangeType,
        startFull: start + ' 00:00:00',
        endFull: end + ' 23:59:59'
      })

      // ===========================================
      // 1. FETCH WINLOSE TRANSACTIONS
      // ===========================================
      const { data: winloseData, error: winloseError } = await supabase
        .from('winlose_transactions')
        .select('*')
        .gte('period_start', start)
        .lte('period_start', end)

      if (winloseError) throw winloseError

      console.log('📊 WINLOSE DATA:', winloseData?.length || 0, 'rows')

      // ===========================================
      // 2. FETCH DEPOSIT & WITHDRAWAL
      // ===========================================
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select('user_name, nett_amount, brand')
        .eq('status', 'Approved')
        .gte('approved_date', start + ' 00:00:00')
        .lte('approved_date', end + ' 23:59:59')

      const { data: withdrawData, error: withdrawError } = await supabase
        .from('withdrawal_transactions')
        .select('user_name, nett_amount, brand')
        .eq('status', 'Approved')
        .gte('approved_date', start + ' 00:00:00')
        .lte('approved_date', end + ' 23:59:59')

      if (depositError || withdrawError) {
        console.error('Deposit/Withdraw error:', depositError || withdrawError)
      }

      console.log('💰 DEPOSIT DATA:', depositData?.length || 0, 'rows')
      console.log('💰 WITHDRAW DATA:', withdrawData?.length || 0, 'rows')

      // ===========================================
      // PROCESS WINLOSE DATA (UNTUK BOX LAINNYA)
      // ===========================================
      if (!winloseData || winloseData.length === 0) {
        setHasData(false)
        resetData()
        setLoading(false)
        return
      }

      // Filter by asset
      const filteredWinlose = winloseData.filter((row: any) => filterByAsset(row))

      if (filteredWinlose.length === 0) {
        setHasData(false)
        resetData()
        setLoading(false)
        return
      }

      setHasData(true)

      // ===========================================
      // SUMMARY STATS (dari winlose)
      // ===========================================
      const validRows = filteredWinlose.filter((row: any) => 
        row.account_id && row.account_id !== '' && !row.account_id.toString().includes('Sub Total')
      )

      const totalNetTurnover = validRows.reduce((sum: number, row: any) => sum + (row.net_turnover || 0), 0)
      const totalMemberTotal = validRows.reduce((sum: number, row: any) => sum + (row.member_total || 0), 0)
      const totalGames = validRows.reduce((sum: number, row: any) => sum + (row.bet_count || 0), 0)

      setTotalNetTurnover(totalNetTurnover)
      setNetWinLose(totalMemberTotal)
      setTotalGames(totalGames)

      const uniquePlayers = new Set(validRows.map((d: any) => d.account_id))
      setUniquePlayerCount(uniquePlayers.size)

      // ===========================================
      // MEMBER STATS (untuk HIGHEST NET TURNOVER)
      // ===========================================
      const memberMap = new Map<string, MemberStats>()
      const winDetails: WinDetail[] = []

      validRows.forEach((row: any) => {
        const fullId = row.account_id
        const { asset_code, member_id } = parseAccountId(fullId)
        const memberTotal = row.member_total || 0
        const netTurnover = row.net_turnover || 0
        
        if (!memberMap.has(fullId)) {
          memberMap.set(fullId, {
            account_id: fullId,
            asset_code,
            member_id,
            total_net_turnover: 0,
            member_total: 0,
            win_rate: 0,
            games_played: 0,
            biggest_win: 0
          })
        }
        
        const stats = memberMap.get(fullId)!
        stats.total_net_turnover += netTurnover
        stats.member_total += memberTotal
        stats.games_played += row.bet_count || 0
        
        if (memberTotal > stats.biggest_win) {
          stats.biggest_win = memberTotal
        }
        
        if (memberTotal > 0) {
          winDetails.push({
            account_id: fullId,
            asset_code,
            member_id,
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

      // ===========================================
      // PRODUCT STATS (TETAP)
      // ===========================================
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
        const account = row.account_id
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
      // PROCESS DEPOSIT & WITHDRAWAL (UNTUK NET DEPOSIT, TOP DEPOSIT, TOP WITHDRAW, DAN RATIO)
      // ===========================================
      const netMap = new Map<string, NetDepositWithdraw>()
      const depositMap = new Map<string, TopDeposit>()
      const withdrawMap = new Map<string, TopWithdrawal>()
      
      // MAP BARU UNTUK RATIO WITHDRAW/DEPOSIT
      const ratioMap = new Map<string, PlayerRatio>()

      depositData?.forEach((row: any) => {
        if (!filterByAsset(row)) return
        
        const fullId = formatMemberId(row.user_name, row.brand || selectedAsset)
        const { asset_code, member_id } = parseAccountId(fullId)
        const amount = row.nett_amount || 0
        
        // NET MAP (tetap)
        if (!netMap.has(fullId)) {
          netMap.set(fullId, {
            account_id: fullId,
            asset_code,
            member_id,
            total_deposit: 0,
            total_withdraw: 0,
            net_amount: 0,
            transaction_count: 0
          })
        }
        const netStats = netMap.get(fullId)!
        netStats.total_deposit += amount
        netStats.net_amount += amount
        netStats.transaction_count += 1

        // DEPOSIT MAP (tetap)
        if (!depositMap.has(fullId)) {
          depositMap.set(fullId, {
            account_id: fullId,
            asset_code,
            member_id,
            total_deposit: 0,
            transaction_count: 0,
            avg_deposit: 0
          })
        }
        const depStats = depositMap.get(fullId)!
        depStats.total_deposit += amount
        depStats.transaction_count += 1
        depStats.avg_deposit = depStats.total_deposit / depStats.transaction_count

        // RATIO MAP (baru)
        if (!ratioMap.has(fullId)) {
          ratioMap.set(fullId, {
            member_id,
            asset_code,
            total_deposit: 0,
            total_withdraw: 0,
            ratio: 0,
            ratio_display: '0:1'
          })
        }
        ratioMap.get(fullId)!.total_deposit += amount
      })

      withdrawData?.forEach((row: any) => {
        if (!filterByAsset(row)) return
        
        const fullId = formatMemberId(row.user_name, row.brand || selectedAsset)
        const { asset_code, member_id } = parseAccountId(fullId)
        const amount = row.nett_amount || 0
        
        // NET MAP (tetap)
        if (!netMap.has(fullId)) {
          netMap.set(fullId, {
            account_id: fullId,
            asset_code,
            member_id,
            total_deposit: 0,
            total_withdraw: 0,
            net_amount: 0,
            transaction_count: 0
          })
        }
        const netStats = netMap.get(fullId)!
        netStats.total_withdraw += amount
        netStats.net_amount -= amount
        netStats.transaction_count += 1

        // WITHDRAW MAP (tetap)
        if (!withdrawMap.has(fullId)) {
          withdrawMap.set(fullId, {
            account_id: fullId,
            asset_code,
            member_id,
            total_withdraw: 0,
            transaction_count: 0,
            avg_withdraw: 0
          })
        }
        const wdStats = withdrawMap.get(fullId)!
        wdStats.total_withdraw += amount
        wdStats.transaction_count += 1
        wdStats.avg_withdraw = wdStats.total_withdraw / wdStats.transaction_count

        // RATIO MAP (baru)
        if (!ratioMap.has(fullId)) {
          ratioMap.set(fullId, {
            member_id,
            asset_code,
            total_deposit: 0,
            total_withdraw: 0,
            ratio: 0,
            ratio_display: '0:1'
          })
        }
        ratioMap.get(fullId)!.total_withdraw += amount
      })

      // HITUNG RATIO UNTUK SETIAP PLAYER (WITHDRAW / DEPOSIT)
      ratioMap.forEach((player) => {
        if (player.total_deposit > 0) {
          player.ratio = player.total_withdraw / player.total_deposit
          // Format dengan 1 desimal: contoh 10.5:1
          player.ratio_display = player.ratio.toFixed(1) + ':1'
        } else if (player.total_withdraw > 0) {
          // Kalau deposit 0 tapi withdraw ada (freebet/jackpot) - ini yang paling untung
          player.ratio_display = '∞:1'
          player.ratio = Infinity
        } else {
          player.ratio_display = '0:1'
          player.ratio = 0
        }
      })

      // SET STATE UNTUK SEMUA BOX
      setNetDepositWithdraw(
        Array.from(netMap.values())
          .sort((a, b) => b.net_amount - a.net_amount)
          .slice(0, 100)
      )

      setTopDeposit(
        Array.from(depositMap.values())
          .sort((a, b) => b.total_deposit - a.total_deposit)
          .slice(0, 100)
      )

      setTopWithdrawal(
        Array.from(withdrawMap.values())
          .sort((a, b) => b.total_withdraw - a.total_withdraw)
          .slice(0, 100)
      )

      // SET TOP RATIO PLAYERS - SORTING DARI TERTINGGI (PALING UNTUNG) KE TERENDAH
      setTopRatioPlayers(
        Array.from(ratioMap.values())
          .sort((a, b) => {
            // Infinity dianggap paling besar (paling untung)
            if (a.ratio === Infinity && b.ratio === Infinity) return 0
            if (a.ratio === Infinity) return -1
            if (b.ratio === Infinity) return 1
            return b.ratio - a.ratio // DESCENDING: dari terbesar ke terkecil
          })
          .slice(0, 100)
      )

      console.log('✅ SEMUA DATA BERHASIL DIPROSES')
      console.log('📊 TOP RATIO PLAYERS (PALING UNTUNG):', topRatioPlayers.length)

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
    setTopMembers([])
    setProductStats([])
    setBigWins([])
    setHighestNetTurnover([])
    setNetDepositWithdraw([])
    setTopDeposit([])
    setTopWithdrawal([])
    setTopRatioPlayers([]) // RESET JUGA
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
          {/* ASSET FILTER */}
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

          {/* RANGE TYPE TOGGLE */}
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

          {/* MONTHLY FILTERS */}
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

          {/* CUSTOM RANGE FILTERS */}
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

          {/* MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* BOX RATIO WITHDRAW/DEPOSIT - HEADER SUDAH DIGANTI */}
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
                        // Tentukan warna berdasarkan ratio (semakin tinggi semakin untung)
                        let ratioColor = 'text-gray-400'
                        let badge = ''
                        
                        if (player.ratio === Infinity) {
                          ratioColor = 'text-purple-400 font-bold'
                          badge = '🎁' // Freebet/Jackpot (paling untung)
                        } else if (player.ratio > 5) {
                          ratioColor = 'text-green-400 font-bold'
                          badge = '🔥' // Panas banget
                        } else if (player.ratio > 2) {
                          ratioColor = 'text-green-400'
                          badge = '👍' // Untung besar
                        } else if (player.ratio > 1) {
                          ratioColor = 'text-blue-400'
                          badge = '💰' // Untung
                        } else if (player.ratio === 1) {
                          ratioColor = 'text-yellow-400'
                          badge = '⚖️' // Balik modal
                        } else if (player.ratio < 1 && player.ratio > 0) {
                          ratioColor = 'text-red-400'
                          badge = '📉' // Rugi
                        } else {
                          ratioColor = 'text-gray-400'
                          badge = '💤' // No activity
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

              {/* BOX BIG WINS (TETAP) */}
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

            {/* RIGHT COLUMN (TETAP) */}
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

          {/* NET DEPOSIT VS WITHDRAW (TETAP) */}
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

          {/* TOP DEPOSIT & WITHDRAWAL (TETAP) */}
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