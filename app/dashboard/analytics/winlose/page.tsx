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
  total_turnover: number
  total_winlose: number
  win_rate: number
  games_played: number
  biggest_win: number
}

interface ProductStats {
  product_type: string
  total_turnover: number
  total_winlose: number
  member_count: number
  bet_count: number
  win_rate: number
}

interface WinDetail {
  account_id: string
  win_amount: number
  product_type: string
  date: string
}

export default function WinloseAnalyticsPage() {
  // ===========================================
  // STATES
  // ===========================================
  const [selectedMonth, setSelectedMonth] = useState('Januari')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasData, setHasData] = useState(false)
  
  // Summary stats
  const [uniquePlayerCount, setUniquePlayerCount] = useState(0)
  const [totalTurnover, setTotalTurnover] = useState(0)
  const [totalWinlose, setTotalWinlose] = useState(0)
  const [totalGames, setTotalGames] = useState(0)
  
  // Detail data
  const [topMembers, setTopMembers] = useState<MemberStats[]>([])
  const [productStats, setProductStats] = useState<ProductStats[]>([])
  const [bigWins, setBigWins] = useState<WinDetail[]>([])
  const [highestTurnover, setHighestTurnover] = useState<MemberStats[]>([])

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const years = ['2025', '2026', '2027']

  // ===========================================
  // FETCH DATA FROM SUPABASE
  // ===========================================
  useEffect(() => {
    if (!useCustomRange && selectedMonth && selectedYear) {
      fetchData()
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (useCustomRange && customStartDate && customEndDate) {
      fetchData()
    }
  }, [useCustomRange, customStartDate, customEndDate])

  const getDateRange = () => {
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

  const fetchData = async () => {
    try {
      setLoading(true)
      const { start, end } = getDateRange()
      
      console.log('📅 FETCHING DATA PERIODE:', { start, end })

      const { data, error } = await supabase
        .from('winlose_transactions')
        .select('*')
        .gte('period_start', start)
        .lte('period_end', end)

      if (error) throw error

      if (!data || data.length === 0) {
        setHasData(false)
        resetData()
        setLoading(false)
        return
      }

      console.log('📊 DATA FOUND:', data.length)
      setHasData(true)

      // ===========================================
      // 1. UNIQUE PLAYER COUNT
      // ===========================================
      const uniquePlayers = new Set(data.map((d: any) => d.account_id))
      setUniquePlayerCount(uniquePlayers.size)

      // ===========================================
      // 2. SUMMARY STATS
      // ===========================================
      const turnover = data.reduce((sum: number, row: any) => sum + (row.turnover || 0), 0)
      const winlose = data.reduce((sum: number, row: any) => sum + (row.member_win || 0), 0)
      const games = data.reduce((sum: number, row: any) => sum + (row.bet_count || 0), 0)
      
      setTotalTurnover(turnover)
      setTotalWinlose(winlose)
      setTotalGames(games)

      // ===========================================
      // 3. MEMBER STATS
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
        
        if (winAmount > stats.biggest_win) {
          stats.biggest_win = winAmount
        }
        
        if (winAmount > 0) {
          winDetails.push({
            account_id: account,
            win_amount: winAmount,
            product_type: row.product_type,
            date: row.period_start
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

      // Top members by win rate
      const topByWinRate = [...membersArray]
        .filter(m => m.games_played >= 5)
        .sort((a, b) => b.win_rate - a.win_rate)
        .slice(0, 100)
      setTopMembers(topByWinRate)

      // Highest turnover
      const topByTurnover = [...membersArray]
        .sort((a, b) => b.total_turnover - a.total_turnover)
        .slice(0, 100)
      setHighestTurnover(topByTurnover)

      // Big time wins
      const sortedWins = winDetails
        .sort((a, b) => b.win_amount - a.win_amount)
        .slice(0, 50)
      setBigWins(sortedWins)

      // ===========================================
      // 4. PRODUCT STATS
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

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetData = () => {
    setUniquePlayerCount(0)
    setTotalTurnover(0)
    setTotalWinlose(0)
    setTotalGames(0)
    setTopMembers([])
    setProductStats([])
    setBigWins([])
    setHighestTurnover([])
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
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/analytics" className="text-[#FFD700] hover:underline">
          ← BACK TO ANALYTICS
        </Link>
        <div className="text-[#FFD700] font-bold">WIN/LOSE ANALYTICS</div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
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

          {/* CUSTOM DATE RANGE */}
          {useCustomRange && (
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

      {/* LOADING STATE */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
        </div>
      )}

      {/* NO DATA STATE */}
      {!loading && !hasData && (
        <div className="bg-[#1A2F4A] p-12 rounded-lg text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-xl text-[#FFD700] font-bold mb-2">Belum Ada Data</h2>
          <p className="text-[#A7D8FF]">
            Pilih periode yang ada datanya (Januari 2026) atau upload data dulu di menu Winlose Data Raw
          </p>
        </div>
      )}

      {/* DATA DISPLAY */}
      {!loading && hasData && (
        <>
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
                  <h2 className="text-[#FFD700] font-bold">🏆 TOP 100 MEMBERS (Win Rate)</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Rank</th>
                        <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Account</th>
                        <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win/Lose</th>
                        <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Win Rate</th>
                        <th className="px-4 py-2 text-right text-xs text-[#A7D8FF]">Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMembers.map((member, idx) => (
                        <tr key={member.account_id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                          <td className="px-4 py-2 text-sm">#{idx + 1}</td>
                          <td className="px-4 py-2 text-sm text-[#A7D8FF] font-mono">{member.account_id}</td>
                          <td className={`px-4 py-2 text-sm text-right ${member.total_winlose >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatCurrency(member.total_winlose)}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-[#FFD700]">{formatPercent(member.win_rate)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatNumber(member.games_played)}</td>
                        </tr>
                      ))}
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
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
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
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HIGHEST TURNOVER */}
              <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
                <div className="bg-[#0B1A33] px-4 py-3 border-b border-[#FFD700]/30">
                  <h2 className="text-[#FFD700] font-bold">📊 HIGHEST TURNOVER (Top 100)</h2>
                </div>
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[#0B1A33]/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Rank</th>
                        <th className="px-4 py-2 text-left text-xs text-[#A7D8FF]">Account</th>
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
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}