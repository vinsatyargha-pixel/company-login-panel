'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

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
  race_turnover: number
  original_turnover: number
  etc_turnover: number
  last_updated: string
}

interface MemberBox {
  id: number
  searchValue: string
  data: MemberDetailData | null
  loading: boolean
  error: string | null
}

interface TopMember {
  account_id: string
  member_id: string
  total_net_turnover: number
}

export default function MemberSpecificationPage() {
  const [memberBoxes, setMemberBoxes] = useState<MemberBox[]>([
    { id: 1, searchValue: '', data: null, loading: false, error: null },
    { id: 2, searchValue: '', data: null, loading: false, error: null },
    { id: 3, searchValue: '', data: null, loading: false, error: null }
  ])
  
  const [chartReady, setChartReady] = useState<{ [key: number]: boolean }>({})
  const [topMembers, setTopMembers] = useState<TopMember[]>([])
  const [loadingTopMembers, setLoadingTopMembers] = useState(true)

  // ===========================================
  // MAPPING PROVIDER KE KATEGORI (SAMA DENGAN PLAYER OVERVIEW)
  // ===========================================
  const getProviderCategory = (productType: string): string => {
    const type = productType?.toLowerCase() || ''
    
    // CASINO
    if (type.includes('dream gaming') || 
        type.includes('opuslivecasino') || 
        type.includes('pp live casino')) {
      return 'CASINO'
    }
    
    // ORIGINAL
    if (type.includes('ace gaming')) {
      return 'ORIGINAL'
    }
    
    // RACE
    if (type.includes('marblex')) {
      return 'RACE'
    }
    
    // SPORTS
    if (type.includes('saba platform')) {
      return 'SPORTS'
    }
    
    // SLOTS (default)
    return 'SLOTS'
  }

  // ===========================================
  // FETCH TOP 3 MEMBERS BERDASARKAN NET TURNOVER
  // ===========================================
  const fetchTopMembers = async () => {
    try {
      setLoadingTopMembers(true)
      
      // Ambil data winlose untuk periode terbaru (bulan ini)
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
      
      // Query winlose untuk bulan ini
      let winloseQuery = supabase
        .from('winlose_transactions')
        .select('account_id, net_turnover')
        .gte('period_start', startDate)
        .lte('period_end', endDate)
      
      const winloseData = await fetchAllWithPagination(winloseQuery)
      
      // Agregasi per member
      const memberMap = new Map<string, number>()
      
      winloseData.forEach((row: any) => {
        let accountId = row.account_id
        // Bersihkan prefix XLY
        if (accountId && accountId.toUpperCase().startsWith('XLY')) {
          accountId = accountId.substring(3)
        }
        if (accountId) {
          const current = memberMap.get(accountId) || 0
          memberMap.set(accountId, current + (row.net_turnover || 0))
        }
      })
      
      // Convert ke array dan sort
      const sortedMembers = Array.from(memberMap.entries())
        .map(([account_id, total_net_turnover]) => ({
          account_id,
          member_id: account_id,
          total_net_turnover
        }))
        .sort((a, b) => b.total_net_turnover - a.total_net_turnover)
        .slice(0, 3)
      
      setTopMembers(sortedMembers)
      console.log('🏆 TOP 3 MEMBERS:', sortedMembers)
      
      // Auto-fill member boxes dengan top 3 members
      setMemberBoxes(prev => prev.map((box, idx) => {
        if (sortedMembers[idx]) {
          return {
            ...box,
            searchValue: sortedMembers[idx].member_id,
            data: null,
            loading: false,
            error: null
          }
        }
        return box
      }))
      
    } catch (error) {
      console.error('Error fetching top members:', error)
    } finally {
      setLoadingTopMembers(false)
    }
  }

  // ===========================================
  // SKALA LINEAR ANTAR LAYER
  // ===========================================
  const LAYER_VALUES = [0, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000]
  const LAYER_RADII = [0, 18, 36, 54, 72]
  
  // SEGI ENAM - POSISI BARU
  const SIDES = [
    { name: 'DEPOSIT', angle: -90 },      // 12:00 (atas)
    { name: 'SLOT', angle: -30 },         // 02:00
    { name: 'CASINO', angle: 30 },        // 04:00
    { name: 'SPORTS', angle: 90 },        // 06:00 (bawah)
    { name: 'ETC', angle: 150 },          // 08:00
    { name: 'WITHDRAW', angle: 210 }      // 10:00
  ]
  
  const CENTER_X = 100
  const CENTER_Y = 100
  const MAX_RADIUS = 72

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
        let accountId = winloseData[0].account_id
        if (accountId.toUpperCase().startsWith('XLY')) {
          accountId = accountId.substring(3)
        }
        return accountId
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
      
      // HITUNG PER KATEGORI MENGGUNAKAN getProviderCategory
      let slotTurnover = 0
      let liveCasinoTurnover = 0
      let sportbookTurnover = 0
      let raceTurnover = 0
      let originalTurnover = 0
      
      winloseData.forEach(tx => {
        const category = getProviderCategory(tx.product_type)
        const turnover = tx.net_turnover || 0
        
        if (category === 'SLOTS') {
          slotTurnover += turnover
        } else if (category === 'CASINO') {
          liveCasinoTurnover += turnover
        } else if (category === 'SPORTS') {
          sportbookTurnover += turnover
        } else if (category === 'RACE') {
          raceTurnover += turnover
        } else if (category === 'ORIGINAL') {
          originalTurnover += turnover
        }
      })
      
      // ETC = RACE + ORIGINAL
      const etcTurnover = raceTurnover + originalTurnover
      
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
        race_turnover: raceTurnover,
        original_turnover: originalTurnover,
        etc_turnover: etcTurnover,
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

  // Auto-fetch top members dan data mereka saat halaman dimuat
  useEffect(() => {
    const init = async () => {
      await fetchTopMembers()
      // Setelah top members didapat, fetch data mereka
      setTimeout(() => {
        memberBoxes.forEach((box, idx) => {
          if (box.searchValue) {
            fetchMemberData(box.id, box.searchValue)
          }
        })
      }, 500)
    }
    init()
  }, [])

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
  // HEXAGON GRID UTILITY
  // ===========================================
  const getHexagonPoints = (radius: number) => {
    const angles = SIDES.map(s => s.angle * Math.PI / 180)
    return angles.map(angle => ({
      x: CENTER_X + radius * Math.cos(angle),
      y: CENTER_Y + radius * Math.sin(angle)
    }))
  }

  const getRadiusFromValue = (value: number): number => {
    if (value <= 0) return 0
    if (value >= LAYER_VALUES[LAYER_VALUES.length - 1]) return MAX_RADIUS
    
    for (let i = 0; i < LAYER_VALUES.length - 1; i++) {
      const lowerVal = LAYER_VALUES[i]
      const upperVal = LAYER_VALUES[i + 1]
      
      if (value >= lowerVal && value <= upperVal) {
        const lowerRad = LAYER_RADII[i]
        const upperRad = LAYER_RADII[i + 1]
        const ratio = (value - lowerVal) / (upperVal - lowerVal)
        return lowerRad + ratio * (upperRad - lowerRad)
      }
    }
    
    return MAX_RADIUS
  }

  const getDataPolygonPoints = (values: number[]) => {
    const angles = SIDES.map(s => s.angle * Math.PI / 180)
    return angles.map((angle, i) => {
      const radius = getRadiusFromValue(values[i])
      const x = CENTER_X + radius * Math.cos(angle)
      const y = CENTER_Y + radius * Math.sin(angle)
      return `${x},${y}`
    }).join(' ')
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
        {memberBoxes.map((box, boxIndex) => {
          const data = box.data
          
          // Urutan values sesuai SIDES baru
          const values = data ? [
            data.total_deposit,           // DEPOSIT - 12:00
            data.slot_turnover,           // SLOT - 02:00
            data.live_casino_turnover,    // CASINO - 04:00
            data.sportbook_turnover,      // SPORTS - 06:00 (bawah)
            data.etc_turnover,            // ETC - 08:00 (RACE + ORIGINAL)
            data.total_withdrawal         // WITHDRAW - 10:00
          ] : [0, 0, 0, 0, 0, 0]
          
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

                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-[#FFD700] mb-3 text-center">POLYGON METRICS</h4>
                      <div className="flex justify-center">
                        <svg viewBox="0 0 200 200" width="300" height="300" style={{ margin: '0 auto' }}>
                          {/* 4 LAPISAN SEGI ENAM */}
                          {[18, 36, 54, 72].map((radius, idx) => {
                            const points = getHexagonPoints(radius)
                            const pointStr = points.map(p => `${p.x},${p.y}`).join(' ')
                            return (
                              <polygon
                                key={`layer-${idx}`}
                                points={pointStr}
                                fill="none"
                                stroke="#FFD700"
                                strokeWidth="1.2"
                                strokeOpacity="0.5"
                              />
                            )
                          })}
                          
                          {/* GARIS RADIAL */}
                          {getHexagonPoints(72).map((point, idx) => (
                            <line
                              key={`radial-${idx}`}
                              x1={CENTER_X}
                              y1={CENTER_Y}
                              x2={point.x}
                              y2={point.y}
                              stroke="#FFD700"
                              strokeWidth="0.8"
                              strokeOpacity="0.35"
                            />
                          ))}
                          
                          {/* POLYGON DATA MEMBER */}
                          {data && (
                            <polygon
                              points={getDataPolygonPoints(values)}
                              fill="#00E5FF"
                              fillOpacity="0.25"
                              stroke="#00E5FF"
                              strokeWidth="1.5"
                              strokeLinejoin="round"
                            />
                          )}
                          
                          {/* LABEL 6 SISI */}
                          {SIDES.map((side, idx) => {
                            const angle = side.angle * Math.PI / 180
                            const radius = 92
                            const x = CENTER_X + radius * Math.cos(angle)
                            const y = CENTER_Y + radius * Math.sin(angle)
                            return (
                              <text
                                key={`label-${idx}`}
                                x={x}
                                y={y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="9"
                                fontWeight="bold"
                                fill="#A7D8FF"
                              >
                                {side.name}
                              </text>
                            )
                          })}
                        </svg>
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
                          <div><span className="text-[#A7D8FF]">Race:</span> <span className="text-white">{formatCurrency(box.data.race_turnover)}</span></div>
                          <div><span className="text-[#A7D8FF]">Original:</span> <span className="text-white">{formatCurrency(box.data.original_turnover)}</span></div>
                          <div><span className="text-[#A7D8FF]">ETC:</span> <span className="text-yellow-400">{formatCurrency(box.data.etc_turnover)}</span></div>
                          <div className="col-span-2 mt-1 pt-1 border-t border-[#FFD700]/20"><span className="text-[#A7D8FF]">Total Turnover:</span> <span className="text-blue-400 font-bold">{formatCurrency(box.data.total_turnover)}</span></div>
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
                    {topMembers.length > 0 && (
                      <>
                        <p className="text-xs text-[#FFD700] mt-3">✨ Top 3 Net Turnover bulan ini:</p>
                        {topMembers.map((member, idx) => (
                          <div key={idx} className="text-xs text-[#A7D8FF] mt-1">
                            {idx + 1}. {member.member_id} ({formatCurrency(member.total_net_turnover)})
                          </div>
                        ))}
                      </>
                    )}
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