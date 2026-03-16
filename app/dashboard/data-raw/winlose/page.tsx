'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

// ===========================================
// TYPES
// ===========================================
type Asset = {
  id: string
  asset_name: string
  asset_code: string
}

type WinloseData = {
  account_id: string
  product_type: string
  bet_count: number
  turnover: number
  net_turnover: number
  member_win: number
  member_total: number
}

type MemberStats = {
  account_id: string
  total_turnover: number
  total_winlose: number
  win_rate: number
  games_played: number
  biggest_win: number
  biggest_win_date?: string
}

type ProductStats = {
  product_type: string
  total_turnover: number
  total_winlose: number
  member_count: number
  bet_count: number
  win_rate: number
}

type WinDetail = {
  account_id: string
  win_amount: number
  product_type: string
  date: string
  turnover: number
}

export default function WinloseAnalyticsPage() {
  // ===========================================
  // STATES
  // ===========================================
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [topLimit, setTopLimit] = useState<number>(100)
  
  // Data states
  const [uniquePlayerCount, setUniquePlayerCount] = useState<number>(0)
  const [topMembers, setTopMembers] = useState<MemberStats[]>([])
  const [bigWins, setBigWins] = useState<WinDetail[]>([])
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [highestTurnover, setHighestTurnover] = useState<MemberStats[]>([])
  
  // Summary stats
  const [totalTurnover, setTotalTurnover] = useState<number>(0)
  const [totalWinlose, setTotalWinlose] = useState<number>(0)
  const [totalGames, setTotalGames] = useState<number>(0)

  const months: string[] = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]
  const years: string[] = ['2025', '2026', '2027']

  // ===========================================
  // INITIAL DATA
  // ===========================================
  useEffect(() => {
    const today = new Date()
    setSelectedMonth(months[today.getMonth()])
    setSelectedYear(today.getFullYear().toString())
    fetchAssets()
  }, [])

  useEffect(() => {
    if ((useCustomRange && customStartDate && customEndDate) || 
        (!useCustomRange && selectedMonth && selectedYear)) {
      fetchData()
    }
  }, [selectedMonth, selectedYear, selectedAsset, useCustomRange, customStartDate, customEndDate, topLimit])

  // ===========================================
  // FETCH ASSETS
  // ===========================================
  const fetchAssets = async (): Promise<void> => {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, asset_name, asset_code')
        .order('asset_name')
      setAssets(data || [])
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  // ===========================================
  // GET DATE RANGE
  // ===========================================
  const getDateRange = (): { start: string; end: string } => {
    if (useCustomRange && customStartDate && customEndDate) {
      return {
        start: customStartDate.toISOString().split('T')[0],
        end: customEndDate.toISOString().split('T')[0]
      }
    } else {
      const monthIndex = months.indexOf(selectedMonth) + 1
      const startDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-01`
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate()
      const endDate = `${selectedYear}-${String(monthIndex).padStart(2, '0')}-${lastDay}`
      return { start: startDate, end: endDate }
    }
  }

  // ===========================================
  // FETCH ALL DATA
  // ===========================================
  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      console.log('📅 FETCHING DATA:', { start, end, asset: selectedAsset })

      // BUILD QUERY
      let query = supabase
        .from('winlose_transactions')
        .select('*')
        .gte('period_start', start)
        .lte('period_end', end)

      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset)
        if (asset) {
          query = query.eq('website', asset.asset_code)
        }
      }

      const { data, error } = await query
      if (error) throw error

      if (!data || data.length === 0) {
        resetData()
        setLoading(false)
        return
      }

      console.log('📊 TOTAL DATA:', data.length)

      // ===========================================
      // 1. UNIQUE PLAYER COUNT
      // ===========================================
      const uniquePlayers = new Set(data.map((d: any) => d.account_id))
      setUniquePlayerCount(uniquePlayers.size)

      // ===========================================
      // 2. MEMBER STATS (untuk TOP members & Turnover)
      // ===========================================
      const memberMap = new Map<string, MemberStats>()
      const winDetails: WinDetail[] = []

      data.forEach((row: any) => {
        const account = row.account_id
        const winAmount = row.member_win || 0
        const turnover = row.turnover || 0
        
        if (!memberMap.has(account)) {
          memberMap.set(account, {
            account_id: account,
            total_turnover: 0,
            total_winlose: 0,
            win_rate: 0,
            games_played: 0,
            biggest_win: 0
          })
        }
        
        const stats = memberMap.get(account)!
        stats.total_turnover += turnover
        stats.total_winlose += winAmount
        stats.games_played += row.bet_count || 0
        
        // Track biggest win
        if (winAmount > stats.biggest_win) {
          stats.biggest_win = winAmount
          stats.biggest_win_date = row.period_start
        }
        
        // Collect all wins for Big Time Win
        if (winAmount > 0) {
          winDetails.push({
            account_id: account,
            win_amount: winAmount,
            product_type: row.product_type,
            date: row.period_start,
            turnover: turnover
          })
        }
      })

      // Calculate win rates
      memberMap.forEach(stats => {
        stats.win_rate = stats.total_turnover > 0 
          ? (stats.total_winlose / stats.total_turnover) * 100 
          : 0
      })

      const membersArray = Array.from(memberMap.values())

      // ===========================================
      // 3. TOP MEMBERS (by win rate)
      // ===========================================
      const topByWinRate = [...membersArray]
        .filter(m => m.games_played >= 5)
        .sort((a, b) => b.win_rate - a.win_rate)
        .slice(0, topLimit)
      setTopMembers(topByWinRate)

      // ===========================================
      // 4. BIG TIME WINS (all positive wins sorted)
      // ===========================================
      const sortedWins = winDetails
        .sort((a, b) => b.win_amount - a.win_amount)
        .slice(0, 50)
      setBigWins(sortedWins)

      // ===========================================
      // 5. PRODUCT STATS
      // ===========================================
      const productMap = new Map<string, ProductStats>()
      
      data.forEach((row: any) => {
        const product = row.product_type
        if (!product) return
        
        if (!productMap.has(product)) {
          productMap.set(product, {
            product_type: product,
            total_turnover: 0,
            total_winlose: 0,
            member_count: 0,
            bet_count: 0,
            win_rate: 0
          })
        }
        
        const stats = productMap.get(product)!
        stats.total_turnover += row.turnover || 0
        stats.total_winlose += row.member_win || 0
        stats.bet_count += row.bet_count || 0
      })

      // Calculate member count per product
      const memberPerProduct = new Map<string, Set<string>>()
      data.forEach((row: any) => {
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
        stats.win_rate = stats.total_turnover > 0 
          ? (stats.total_winlose / stats.total_turnover) * 100 
          : 0
      })

      const productsArray = Array.from(productMap.values())
        .sort((a, b) => b.total_winlose - a.total_winlose)
      setProductStats(productsArray)

      // ===========================================
      // 6. HIGHEST TURNOVER
      // ===========================================
      const topByTurnover = [...membersArray]
        .sort((a, b) => b.total_turnover - a.total_turnover)
        .slice(0, 100)
      setHighestTurnover(topByTurnover)

      // ===========================================
      // 7. SUMMARY STATS
      // ===========================================
      setTotalTurnover(data.reduce((sum: number, row: any) => sum + (row.turnover || 0), 0))
      setTotalWinlose(data.reduce((sum: number, row: any) => sum + (row.member_win || 0), 0))
      setTotalGames(data.reduce((sum: number, row: any) => sum + (row.bet_count || 0), 0))

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetData = (): void => {
    setUniquePlayerCount(0)
    setTopMembers([])
    setBigWins([])
    setProductStats([])
    setHighestTurnover([])
    setTotalTurnover(0)
    setTotalWinlose(0)
    setTotalGames(0)
  }

  // ===========================================
  // FORMATTERS
  // ===========================================
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatPercent = (num: number): string => {
    return num.toFixed(2) + '%'
  }

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/analytics" className="text-[#FFD700] hover:underline">
          ← BACK TO ANALYTICS
        </Link>
        <div className="text-[#FFD700] font-bold">WIN/LOSE ANALYTICS</div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* ASSET FILTER */}
          <div>
            <label className="text-xs text-[#A7D8FF] block mb-1">ASSET</label>
            <select 
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
              value={selectedAsset}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAsset(e.target.value)}
            >
              <option value="all">SEMUA ASSET</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.asset_name}
                </option>
              ))}
            </select>
          </div>

          {/* RANGE TYPE TOGGLE */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUseCustomRange(false)}
              className={`px-4 py-2 rounded-lg ${!useCustomRange ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setUseCustomRange(true)}
              className={`px-4 py-2 rounded-lg ${useCustomRange ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}
            >
              Custom Range
            </button>
          </div>

          {/* MONTHLY FILTERS */}
          {!useCustomRange && (
            <>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">BULAN</label>
                <select 
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[120px]"
                  value={selectedMonth}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedMonth(e.target.value)}
                >
                  {months.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">TAHUN</label>
                <select 
                  className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[100px]"
                  value={selectedYear}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedYear(e.target.value)}
                >
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </>
          )}

          {/* CUSTOM DATE RANGE */}
          {useCustomRange && (
            <>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">DARI TANGGAL</label>
                <DatePicker
                  selected={customStartDate}
                  onChange={(date: Date | null) => setCustomStartDate(date)}
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
                  onChange={(date: Date | null) => setCustomEndDate(date)}
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

          {/* TOP LIMIT SELECTOR */}
          <div>
            <label className="text-xs text-[#A7D8FF] block mb-1">TOP MEMBER</label>
            <select 
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[100px]"
              value={topLimit}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTopLimit(Number(e.target.value))}
            >
              <option value={3}>Top 3</option>
              <option value={10}>Top 10</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Unique Players</div>
          <div className="text-2xl font-bold text-[#FFD700]">{formatNumber(uniquePlayerCount)}</div>
          <div className="text-xs text-gray-400">Total ID unik</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Total Turnover</div>
          <div className="text-2xl font-bold text-blue-400">{formatCurrency(totalTurnover)}</div>
          <div className="text-xs text-gray-400">Total bet</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Net Win/Lose</div>
          <div className={`text-2xl font-bold ${totalWinlose >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(totalWinlose)}
          </div>
          <div className="text-xs text-gray-400">(Minus = Player Win)</div>
        </div>
        <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30">
          <div className="text-sm text-[#A7D8FF]">Total Games</div>
          <div className="text-2xl font-bold text-purple-400">{formatNumber(totalGames)}</div>
          <div className="text-xs text-gray-400">Total bet count</div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* TOP MEMBERS BY WIN RATE */}
          <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
            <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
              <h2 className="text-[#FFD700] font-bold">🏆 TOP {topLimit} MEMBERS (Win Rate)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B1A33]/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Rank</th>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Account ID</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win/Lose</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win Rate</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Games</th>
                  </tr>
                </thead>
                <tbody>
                  {topMembers.map((member, idx) => (
                    <tr key={member.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                      <td className="px-4 py-2 text-sm">
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                        {idx > 2 && `#${idx + 1}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-[#A7D8FF] font-mono">{member.account_id}</td>
                      <td className={`px-4 py-2 text-sm text-right ${member.total_winlose >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(member.total_winlose)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[#FFD700]">{formatPercent(member.win_rate)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatNumber(member.games_played)}</td>
                    </tr>
                  ))}
                  {topMembers.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PRODUCT STATS */}
          <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
            <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
              <h2 className="text-[#FFD700] font-bold">🎰 PERFORMANCE PER PROVIDER</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B1A33]/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Provider</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Turnover</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win/Lose</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win Rate</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Players</th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.map((product, idx) => (
                    <tr key={product.product_type} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                      <td className="px-4 py-2 text-sm font-medium">
                        <span className={idx === 0 ? 'text-green-400' : idx === productStats.length - 1 ? 'text-red-400' : ''}>
                          {product.product_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{formatCurrency(product.total_turnover)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${product.total_winlose >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(product.total_winlose)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-[#FFD700]">{formatPercent(product.win_rate)}</td>
                      <td className="px-4 py-2 text-sm text-right">{formatNumber(product.member_count)}</td>
                    </tr>
                  ))}
                  {productStats.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* BIG TIME WINS */}
          <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
            <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
              <h2 className="text-[#FFD700] font-bold">💰 BIG TIME WINS (Top 50)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B1A33]/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Rank</th>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Account</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win Amount</th>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Provider</th>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bigWins.map((win, idx) => (
                    <tr key={idx} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                      <td className="px-4 py-2 text-sm">#{idx + 1}</td>
                      <td className="px-4 py-2 text-sm text-[#A7D8FF] font-mono">{win.account_id}</td>
                      <td className="px-4 py-2 text-sm text-right text-green-400">{formatCurrency(win.win_amount)}</td>
                      <td className="px-4 py-2 text-sm">{win.product_type}</td>
                      <td className="px-4 py-2 text-sm text-gray-400">{win.date}</td>
                    </tr>
                  ))}
                  {bigWins.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* HIGHEST TURNOVER */}
          <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
            <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
              <h2 className="text-[#FFD700] font-bold">📊 HIGHEST TURNOVER (Top 100)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0B1A33]/50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Rank</th>
                    <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Account ID</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Turnover</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win/Lose</th>
                    <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Games</th>
                  </tr>
                </thead>
                <tbody>
                  {highestTurnover.map((member, idx) => (
                    <tr key={member.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                      <td className="px-4 py-2 text-sm">#{idx + 1}</td>
                      <td className="px-4 py-2 text-sm text-[#A7D8FF] font-mono">{member.account_id}</td>
                      <td className="px-4 py-2 text-sm text-right text-blue-400">{formatCurrency(member.total_turnover)}</td>
                      <td className={`px-4 py-2 text-sm text-right ${member.total_winlose >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(member.total_winlose)}
                      </td>
                      <td className="px-4 py-2 text-sm text-right">{formatNumber(member.games_played)}</td>
                    </tr>
                  ))}
                  {highestTurnover.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Tidak ada data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] p-6 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
            <p className="text-[#FFD700] mt-4">Loading data...</p>
          </div>
        </div>
      )}
    </div>
  )
}