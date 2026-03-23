'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts'

// ===========================================
// TYPES
// ===========================================
interface MemberDetailData {
  member_id: string
  asset_code: string
  total_deposit: number
  total_deposit_count: number
  avg_deposit: number
  total_withdrawal: number
  total_withdrawal_count: number
  avg_withdrawal: number
  total_turnover: number
  total_bonus: number
  highest_deposit: number
  lowest_deposit: number
  highest_withdrawal: number
  lowest_withdrawal: number
  highest_bet: number
  lowest_bet: number
  avg_bet: number
  avg_deposit_interval_hours: number
  avg_withdrawal_interval_hours: number
  deposit_frequency_days: number
  withdrawal_frequency_days: number
  slot_turnover: number
  live_casino_turnover: number
  sportbook_turnover: number
  last_updated: string
}

interface MemberBox {
  id: number
  searchValue: string
  data: MemberDetailData | null
  loading: boolean
  error: string | null
}

export default function MemberSpecificationPage() {
  const [memberBoxes, setMemberBoxes] = useState<MemberBox[]>([
    { id: 1, searchValue: '', data: null, loading: false, error: null },
    { id: 2, searchValue: '', data: null, loading: false, error: null },
    { id: 3, searchValue: '', data: null, loading: false, error: null }
  ])
  
  const [chartReady, setChartReady] = useState<{ [key: number]: boolean }>({})

  // ===========================================
  // 4 LAPISAN SEGI ENAM: 1jt, 10jt, 100jt, 1M
  // ===========================================
  const MAX_DOMAIN = 1_000_000_000 // 1M
  const FIXED_TICKS = [0, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000]

  // ===========================================
  // PAGINATION HELPER
  // ===========================================
  const fetchAllWithPagination = async (queryBuilder: any) => {
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
  const calculateAverageInterval = (dates: string[]): number => {
    if (dates.length < 2) return 0
    const timestamps = dates.map(d => new Date(d).getTime()).sort((a, b) => a - b)
    let totalInterval = 0
    for (let i = 1; i < timestamps.length; i++) {
      totalInterval += (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60)
    }
    return totalInterval / (timestamps.length - 1)
  }

  const calculateFrequency = (dates: string[]): number => {
    if (dates.length < 2) return 0
    const timestamps = dates.map(d => new Date(d).getTime()).sort((a, b) => a - b)
    const firstDate = timestamps[0]
    const lastDate = timestamps[timestamps.length - 1]
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24)
    return daysDiff / (dates.length - 1)
  }

  const categorizeProductType = (productType: string): string => {
    const type = productType?.toLowerCase() || ''
    if (type.includes('slot') || type.includes('pp') || type.includes('pg') || type.includes('hacksaw') || type.includes('btgaming') || type.includes('megawin') || type.includes('kingmidas') || type.includes('playtech') || type.includes('onlyplay') || type.includes('marblex')) {
      return 'slot'
    }
    if (type.includes('live') || type.includes('casino') || type.includes('vplus') || type.includes('ace gaming')) {
      return 'live_casino'
    }
    if (type.includes('sport') || type.includes('ibc')) {
      return 'sportbook'
    }
    return 'other'
  }

  // ===========================================
  // GET ACTUAL MEMBER ID
  // ===========================================
  const getActualMemberId = async (searchId: string): Promise<string | null> => {
    try {
      let cleanSearch = searchId.trim()
      if (cleanSearch.toUpperCase().startsWith('XLY')) {
        cleanSearch = cleanSearch.substring(3)
      }
      
      const { data: depositData } = await supabase
        .from('deposit_transactions')
        .select('user_name')
        .ilike('user_name', cleanSearch)
        .limit(1)
      
      if (depositData && depositData.length > 0) {
        return depositData[0].user_name
      }
      
      const { data: withdrawalData } = await supabase
        .from('withdrawal_transactions')
        .select('user_name')
        .ilike('user_name', cleanSearch)
        .limit(1)
      
      if (withdrawalData && withdrawalData.length > 0) {
        return withdrawalData[0].user_name
      }
      
      const { data: winloseData } = await supabase
        .from('winlose_transactions')
        .select('account_id')
        .ilike('account_id', `%${cleanSearch}%`)
        .limit(1)
      
      if (winloseData && winloseData.length > 0) {
        return winloseData[0].account_id
      }
      
      return null
    } catch (error) {
      console.error('Error finding member:', error)
      return null
    }
  }

  // ===========================================
  // FETCH MEMBER DATA
  // ===========================================
  const fetchMemberData = async (boxId: number, memberId: string) => {
    if (!memberId || memberId.trim() === '') return

    setMemberBoxes(prev => prev.map(box => 
      box.id === boxId ? { ...box, loading: true, error: null, data: null } : box
    ))
    
    setChartReady(prev => ({ ...prev, [boxId]: false }))

    try {
      const searchTerm = memberId.trim()
      const actualId = await getActualMemberId(searchTerm)
      
      if (!actualId) {
        setMemberBoxes(prev => prev.map(box => 
          box.id === boxId ? { 
            ...box, 
            loading: false, 
            error: `Member "${searchTerm}" tidak ditemukan`, 
            data: null 
          } : box
        ))
        return
      }

      console.log(`✅ ID member ditemukan: ${actualId}`)

      let cleanId = actualId
      if (cleanId.toUpperCase().startsWith('XLY')) {
        cleanId = cleanId.substring(3)
      }

      // FETCH DEPOSIT
      let depositQuery = supabase
        .from('deposit_transactions')
        .select('nett_amount, approved_date')
        .ilike('user_name', cleanId)
        .eq('status', 'Approved')
        .order('approved_date', { ascending: true })

      const depositData = await fetchAllWithPagination(depositQuery)

      // FETCH WITHDRAWAL
      let withdrawalQuery = supabase
        .from('withdrawal_transactions')
        .select('nett_amount, approved_date')
        .ilike('user_name', cleanId)
        .eq('status', 'Approved')
        .order('approved_date', { ascending: true })

      const withdrawalData = await fetchAllWithPagination(withdrawalQuery)

      // FETCH WINLOSE
      let winloseQuery = supabase
        .from('winlose_transactions')
        .select('product_type, net_turnover')
        .ilike('account_id', `%${cleanId}%`)

      const winloseData = await fetchAllWithPagination(winloseQuery)
      console.log(`📊 Data winlose: ${winloseData.length} rows`)

      // HITUNG METRICS
      const totalDeposit = depositData.reduce((sum, tx) => sum + (tx.nett_amount || 0), 0)
      const totalDepositCount = depositData.length
      const avgDeposit = totalDepositCount > 0 ? totalDeposit / totalDepositCount : 0

      const totalWithdrawal = withdrawalData.reduce((sum, tx) => sum + (tx.nett_amount || 0), 0)
      const totalWithdrawalCount = withdrawalData.length
      const avgWithdrawal = totalWithdrawalCount > 0 ? totalWithdrawal / totalWithdrawalCount : 0

      const totalTurnover = winloseData.reduce((sum, tx) => sum + (tx.net_turnover || 0), 0)
      
      let slotTurnover = 0
      let liveCasinoTurnover = 0
      let sportbookTurnover = 0
      
      winloseData.forEach(tx => {
        const category = categorizeProductType(tx.product_type)
        const turnover = tx.net_turnover || 0
        
        if (category === 'slot') {
          slotTurnover += turnover
        } else if (category === 'live_casino') {
          liveCasinoTurnover += turnover
        } else if (category === 'sportbook') {
          sportbookTurnover += turnover
        }
      })
      
      const avgDepositInterval = calculateAverageInterval(depositData.map(tx => tx.approved_date))
      const avgWithdrawalInterval = calculateAverageInterval(withdrawalData.map(tx => tx.approved_date))
      const depositFrequency = calculateFrequency(depositData.map(tx => tx.approved_date))
      const withdrawalFrequency = calculateFrequency(withdrawalData.map(tx => tx.approved_date))
      
      const memberData: MemberDetailData = {
        member_id: cleanId,
        asset_code: 'XLY',
        total_deposit: totalDeposit,
        total_deposit_count: totalDepositCount,
        avg_deposit: avgDeposit,
        total_withdrawal: totalWithdrawal,
        total_withdrawal_count: totalWithdrawalCount,
        avg_withdrawal: avgWithdrawal,
        total_turnover: totalTurnover,
        total_bonus: 0,
        highest_deposit: depositData.length ? Math.max(...depositData.map(tx => tx.nett_amount)) : 0,
        lowest_deposit: depositData.length ? Math.min(...depositData.map(tx => tx.nett_amount)) : 0,
        highest_withdrawal: withdrawalData.length ? Math.max(...withdrawalData.map(tx => tx.nett_amount)) : 0,
        lowest_withdrawal: withdrawalData.length ? Math.min(...withdrawalData.map(tx => tx.nett_amount)) : 0,
        highest_bet: 0,
        lowest_bet: 0,
        avg_bet: 0,
        avg_deposit_interval_hours: avgDepositInterval,
        avg_withdrawal_interval_hours: avgWithdrawalInterval,
        deposit_frequency_days: depositFrequency,
        withdrawal_frequency_days: withdrawalFrequency,
        slot_turnover: slotTurnover,
        live_casino_turnover: liveCasinoTurnover,
        sportbook_turnover: sportbookTurnover,
        last_updated: new Date().toISOString()
      }

      console.log(`✅ Data member loaded:`, memberData)

      setMemberBoxes(prev => prev.map(box => 
        box.id === boxId ? { ...box, loading: false, data: memberData, error: null } : box
      ))
      
      setTimeout(() => {
        setChartReady(prev => ({ ...prev, [boxId]: true }))
      }, 100)

    } catch (error) {
      console.error('Error fetching member data:', error)
      setMemberBoxes(prev => prev.map(box => 
        box.id === boxId ? { 
          ...box, 
          loading: false, 
          error: 'Gagal mengambil data member', 
          data: null 
        } : box
      ))
    }
  }

  const handleSearch = (boxId: number, value: string) => {
    setMemberBoxes(prev => prev.map(box => 
      box.id === boxId ? { ...box, searchValue: value } : box
    ))
    fetchMemberData(boxId, value)
  }

  // ===========================================
  // FORMATTERS
  // ===========================================
  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  const formatHours = (hours: number): string => {
    if (hours === 0) return '-'
    if (hours < 24) return `${hours.toFixed(1)} jam`
    return `${(hours / 24).toFixed(1)} hari`
  }

  const formatDays = (days: number): string => {
    if (days === 0) return '-'
    return `${days.toFixed(1)} hari`
  }

  // ===========================================
  // SPIDER CHART DATA
  // ===========================================
  const getSpiderData = (data: MemberDetailData | null) => {
    if (!data) return []
    
    return [
      { subject: 'Total Deposit', value: data.total_deposit, originalValue: data.total_deposit },
      { subject: 'Total Turnover', value: data.total_turnover, originalValue: data.total_turnover },
      { subject: 'Slot Turnover', value: data.slot_turnover, originalValue: data.slot_turnover },
      { subject: 'Live Casino', value: data.live_casino_turnover, originalValue: data.live_casino_turnover },
      { subject: 'Sportbook', value: data.sportbook_turnover, originalValue: data.sportbook_turnover },
      { subject: 'Total Withdrawal', value: data.total_withdrawal, originalValue: data.total_withdrawal }
    ]
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#0B1A33] border border-[#FFD700] rounded-lg p-2 shadow-xl">
          <p className="text-[#FFD700] font-bold text-xs">{data.subject}</p>
          <p className="text-white text-xs">{formatCurrency(data.originalValue || 0)}</p>
          <p className="text-[#A7D8FF] text-[10px] mt-1">Skala: 0 - 1M (1jt | 10jt | 100jt | 1M)</p>
        </div>
      )
    }
    return null
  }

  const formatRadiusTick = (value: number) => {
    if (value === 0) return '0'
    if (value === 1_000_000) return '1jt'
    if (value === 10_000_000) return '10jt'
    if (value === 100_000_000) return '100jt'
    if (value === 1_000_000_000) return '1M'
    return ''
  }

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Link href="/dashboard/analytics/player" className="text-[#FFD700] hover:underline">
          ← BACK TO ANALYTICS PLAYER
        </Link>
        <div className="text-[#FFD700] font-bold text-xl">👥 MEMBER SPECIFICATION</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {memberBoxes.map((box) => {
          const spiderData = box.data ? getSpiderData(box.data) : []
          
          return (
            <div key={box.id} className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 overflow-hidden flex flex-col">
              <div className="bg-[#0B1A33] p-4 border-b border-[#FFD700]/30">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                    <span className="text-[#FFD700] font-bold">{box.id}</span>
                  </div>
                  <h3 className="text-[#FFD700] font-bold">Search Member</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={box.searchValue}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setMemberBoxes(prev => prev.map(b => 
                        b.id === box.id ? { ...b, searchValue: newValue } : b
                      ))
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(box.id, box.searchValue)}
                    placeholder="Masukkan ID Member (case insensitive)..."
                    className="flex-1 bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFD700]"
                  />
                  <button
                    onClick={() => handleSearch(box.id, box.searchValue)}
                    disabled={box.loading}
                    className="bg-[#FFD700] text-[#0B1A33] px-4 py-2 rounded-lg font-medium hover:bg-[#FFD700]/90 disabled:opacity-50 transition-all"
                  >
                    {box.loading ? '...' : 'Cari'}
                  </button>
                </div>
              </div>

              <div className="p-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {box.loading && (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
                  </div>
                )}

                {box.error && !box.loading && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">😞</div>
                    <p className="text-red-400">{box.error}</p>
                    <p className="text-xs text-[#A7D8FF] mt-2">Coba dengan ID member yang lain</p>
                  </div>
                )}

                {box.data && !box.loading && (
                  <>
                    <div className="bg-[#0B1A33]/50 rounded-lg p-3 mb-4 text-center">
                      <div className="text-xs text-[#A7D8FF]">Member ID</div>
                      <div className="text-[#FFD700] font-bold text-lg">{box.data.member_id}</div>
                      <div className="text-xs text-[#A7D8FF]">Asset: {box.data.asset_code}</div>
                    </div>

                    {/* RADAR CHART - GRID SEGI ENAM + POLYGON MEMBER */}
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-[#FFD700] mb-3 text-center">Performance Radar</h4>
                      <div style={{ width: '100%', height: 450, minHeight: 450 }}>
                        {chartReady[box.id] && spiderData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={450}>
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={spiderData}>
                              {/* GRID SEGI ENAM SEBAGAI DUDUKAN */}
                              <PolarGrid
                                gridType="polygon"
                                stroke="#FFD700"
                                strokeWidth={1.5}
                                strokeOpacity={0.6}
                              />
                              {/* LABEL SISI */}
                              <PolarAngleAxis 
                                dataKey="subject" 
                                tick={{ 
                                  fill: '#A7D8FF', 
                                  fontSize: 10, 
                                  fontWeight: 'bold'
                                }}
                              />
                              {/* RADIUS AXIS - PAKSA 4 LAPISAN */}
                              <PolarRadiusAxis
                                angle={90}
                                domain={[0, MAX_DOMAIN]}
                                ticks={FIXED_TICKS as any}
                                tick={{ 
                                  fill: '#FFD700', 
                                  fontSize: 10, 
                                  fontWeight: 'bold'
                                }}
                                tickFormatter={formatRadiusTick}
                                axisLine={false}
                              />
                              {/* POLYGON MEMBER (GARIS YANG NYAMBUNGIN TITIK) */}
                              <Radar
                                name={box.data.member_id}
                                dataKey="value"
                                stroke="#00E5FF"
                                strokeWidth={3}
                                fill="#00E5FF"
                                fillOpacity={0.25}
                                dot={{
                                  fill: "#00E5FF",
                                  stroke: "#FFFFFF",
                                  strokeWidth: 2,
                                  r: 5
                                }}
                                activeDot={{ r: 8, fill: "#00E5FF", stroke: "#FFFFFF", strokeWidth: 2 }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-center text-xs text-[#FFD700] mt-3 font-bold bg-[#0B1A33]/50 py-1 rounded-full mx-auto w-fit px-3">
                        ⬤ 4 Lapisan Segi Enam: 1jt (dalam) | 10jt | 100jt | 1M (luar)
                      </div>
                    </div>

                    {/* DETAIL DATA */}
                    <div className="space-y-3">
                      <div className="bg-[#0B1A33]/30 rounded-lg p-3 border-l-4 border-green-400">
                        <h5 className="text-green-400 font-bold text-sm mb-2">💰 DEPOSIT</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-[#A7D8FF]">Total Deposit:</span> <span className="text-white">{formatCurrency(box.data.total_deposit)}</span></div>
                          <div><span className="text-[#A7D8FF]">Total Forms:</span> <span className="text-white">{formatNumber(box.data.total_deposit_count)}</span></div>
                          <div><span className="text-[#A7D8FF]">Average Deposit:</span> <span className="text-white">{formatCurrency(box.data.avg_deposit)}</span></div>
                          <div><span className="text-[#A7D8FF]">Highest Deposit:</span> <span className="text-green-400">{formatCurrency(box.data.highest_deposit)}</span></div>
                          <div><span className="text-[#A7D8FF]">Lowest Deposit:</span> <span className="text-red-400">{formatCurrency(box.data.lowest_deposit)}</span></div>
                          <div><span className="text-[#A7D8FF]">Avg Interval:</span> <span className="text-white">{formatHours(box.data.avg_deposit_interval_hours)}</span></div>
                        </div>
                      </div>

                      <div className="bg-[#0B1A33]/30 rounded-lg p-3 border-l-4 border-red-400">
                        <h5 className="text-red-400 font-bold text-sm mb-2">💸 WITHDRAWAL</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-[#A7D8FF]">Total Withdrawal:</span> <span className="text-white">{formatCurrency(box.data.total_withdrawal)}</span></div>
                          <div><span className="text-[#A7D8FF]">Total Forms:</span> <span className="text-white">{formatNumber(box.data.total_withdrawal_count)}</span></div>
                          <div><span className="text-[#A7D8FF]">Average Withdrawal:</span> <span className="text-white">{formatCurrency(box.data.avg_withdrawal)}</span></div>
                          <div><span className="text-[#A7D8FF]">Highest Withdrawal:</span> <span className="text-red-400">{formatCurrency(box.data.highest_withdrawal)}</span></div>
                          <div><span className="text-[#A7D8FF]">Lowest Withdrawal:</span> <span className="text-green-400">{formatCurrency(box.data.lowest_withdrawal)}</span></div>
                          <div><span className="text-[#A7D8FF]">Avg Interval:</span> <span className="text-white">{formatHours(box.data.avg_withdrawal_interval_hours)}</span></div>
                        </div>
                      </div>

                      <div className="bg-[#0B1A33]/30 rounded-lg p-3 border-l-4 border-purple-400">
                        <h5 className="text-purple-400 font-bold text-sm mb-2">🎮 GAME TURNOVER</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-[#A7D8FF]">Slot:</span> <span className="text-white">{formatCurrency(box.data.slot_turnover)}</span></div>
                          <div><span className="text-[#A7D8FF]">Live Casino:</span> <span className="text-white">{formatCurrency(box.data.live_casino_turnover)}</span></div>
                          <div><span className="text-[#A7D8FF]">Sportbook:</span> <span className="text-white">{formatCurrency(box.data.sportbook_turnover)}</span></div>
                          <div><span className="text-[#A7D8FF]">Total Turnover:</span> <span className="text-blue-400 font-bold">{formatCurrency(box.data.total_turnover)}</span></div>
                        </div>
                      </div>

                      <div className="bg-[#0B1A33]/30 rounded-lg p-3 border-l-4 border-[#FFD700]">
                        <h5 className="text-[#FFD700] font-bold text-sm mb-2">📅 ACTIVITY FREQUENCY</h5>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-[#A7D8FF]">Deposit Routine:</span> <span className="text-white">{formatDays(box.data.deposit_frequency_days)}</span></div>
                          <div><span className="text-[#A7D8FF]">Withdrawal Routine:</span> <span className="text-white">{formatDays(box.data.withdrawal_frequency_days)}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-[#A7D8FF] text-right border-t border-[#FFD700]/20 pt-2">
                      Last updated: {new Date(box.data.last_updated).toLocaleString('id-ID')}
                    </div>
                  </>
                )}

                {!box.data && !box.loading && !box.error && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-[#A7D8FF] text-sm">Masukkan ID member untuk melihat detail</p>
                    <p className="text-xs text-[#A7D8FF] mt-1">Contoh: surya28, Bradley2020, Memelah1233</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}