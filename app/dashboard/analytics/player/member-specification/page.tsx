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
  slot_intensity: number
  live_casino_intensity: number
  sportbook_intensity: number
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

  const calculateGameIntensities = (winloseData: any[]): { slot: number; live_casino: number; sportbook: number } => {
    const intensities = { slot: 0, live_casino: 0, sportbook: 0 }
    let totalBets = 0
    
    winloseData.forEach(tx => {
      const productType = tx.product_type?.toLowerCase() || ''
      const betCount = tx.bet_count || 0
      totalBets += betCount
      
      if (productType.includes('slot')) {
        intensities.slot += betCount
      } else if (productType.includes('live') || productType.includes('casino')) {
        intensities.live_casino += betCount
      } else if (productType.includes('sport')) {
        intensities.sportbook += betCount
      }
    })
    
    if (totalBets > 0) {
      intensities.slot = (intensities.slot / totalBets) * 100
      intensities.live_casino = (intensities.live_casino / totalBets) * 100
      intensities.sportbook = (intensities.sportbook / totalBets) * 100
    }
    
    return intensities
  }

  // ===========================================
  // FETCH MEMBER DATA
  // ===========================================
  const fetchMemberData = async (boxId: number, memberId: string) => {
    if (!memberId || memberId.trim() === '') return

    setMemberBoxes(prev => prev.map(box => 
      box.id === boxId ? { ...box, loading: true, error: null, data: null } : box
    ))

    try {
      const cleanMemberId = memberId.trim().toLowerCase()
      
      // Fetch deposit transactions
      const { data: depositData, error: depositError } = await supabase
        .from('deposit_transactions')
        .select('nett_amount, approved_date')
        .eq('user_name', cleanMemberId)
        .eq('status', 'Approved')
        .order('approved_date', { ascending: true })

      if (depositError) throw depositError

      // Fetch withdrawal transactions
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawal_transactions')
        .select('nett_amount, approved_date')
        .eq('user_name', cleanMemberId)
        .eq('status', 'Approved')
        .order('approved_date', { ascending: true })

      if (withdrawalError) throw withdrawalError

      // Fetch winlose data for turnover and game intensities
      const { data: winloseData, error: winloseError } = await supabase
        .from('winlose_transactions')
        .select('*')
        .eq('account_id', cleanMemberId)

      if (winloseError) throw winloseError

      // Check if member exists
      if ((!depositData || depositData.length === 0) && 
          (!withdrawalData || withdrawalData.length === 0) && 
          (!winloseData || winloseData.length === 0)) {
        setMemberBoxes(prev => prev.map(box => 
          box.id === boxId ? { 
            ...box, 
            loading: false, 
            error: 'Member tidak ditemukan', 
            data: null 
          } : box
        ))
        return
      }

      // Calculate metrics
      const totalDeposit = depositData?.reduce((sum, tx) => sum + (tx.nett_amount || 0), 0) || 0
      const totalDepositCount = depositData?.length || 0
      const avgDeposit = totalDepositCount > 0 ? totalDeposit / totalDepositCount : 0

      const totalWithdrawal = withdrawalData?.reduce((sum, tx) => sum + (tx.nett_amount || 0), 0) || 0
      const totalWithdrawalCount = withdrawalData?.length || 0
      const avgWithdrawal = totalWithdrawalCount > 0 ? totalWithdrawal / totalWithdrawalCount : 0

      const totalTurnover = winloseData?.reduce((sum, tx) => sum + (tx.net_turnover || 0), 0) || 0
      
      const avgDepositInterval = calculateAverageInterval(depositData?.map(tx => tx.approved_date) || [])
      const avgWithdrawalInterval = calculateAverageInterval(withdrawalData?.map(tx => tx.approved_date) || [])
      const depositFrequency = calculateFrequency(depositData?.map(tx => tx.approved_date) || [])
      const withdrawalFrequency = calculateFrequency(withdrawalData?.map(tx => tx.approved_date) || [])
      
      const gameIntensities = calculateGameIntensities(winloseData || [])
      
      const memberData: MemberDetailData = {
        member_id: cleanMemberId,
        asset_code: 'XLY',
        total_deposit: totalDeposit,
        total_deposit_count: totalDepositCount,
        avg_deposit: avgDeposit,
        total_withdrawal: totalWithdrawal,
        total_withdrawal_count: totalWithdrawalCount,
        avg_withdrawal: avgWithdrawal,
        total_turnover: totalTurnover,
        total_bonus: 0,
        highest_deposit: depositData?.length ? Math.max(...depositData.map(tx => tx.nett_amount)) : 0,
        lowest_deposit: depositData?.length ? Math.min(...depositData.map(tx => tx.nett_amount)) : 0,
        highest_withdrawal: withdrawalData?.length ? Math.max(...withdrawalData.map(tx => tx.nett_amount)) : 0,
        lowest_withdrawal: withdrawalData?.length ? Math.min(...withdrawalData.map(tx => tx.nett_amount)) : 0,
        highest_bet: 0,
        lowest_bet: 0,
        avg_bet: 0,
        avg_deposit_interval_hours: avgDepositInterval,
        avg_withdrawal_interval_hours: avgWithdrawalInterval,
        deposit_frequency_days: depositFrequency,
        withdrawal_frequency_days: withdrawalFrequency,
        slot_intensity: gameIntensities.slot,
        live_casino_intensity: gameIntensities.live_casino,
        sportbook_intensity: gameIntensities.sportbook,
        last_updated: new Date().toISOString()
      }

      setMemberBoxes(prev => prev.map(box => 
        box.id === boxId ? { ...box, loading: false, data: memberData, error: null } : box
      ))

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

  const getSpiderData = (data: MemberDetailData | null) => {
    if (!data) return []
    
    const maxDeposit = 100000000
    const maxTurnover = 500000000
    const maxWithdrawal = 100000000
    
    return [
      { subject: 'Total Deposit', value: Math.min((data.total_deposit / maxDeposit) * 100, 100), originalValue: data.total_deposit },
      { subject: 'Total Turnover', value: Math.min((data.total_turnover / maxTurnover) * 100, 100), originalValue: data.total_turnover },
      { subject: 'Slot Intensity', value: data.slot_intensity, originalValue: data.slot_intensity },
      { subject: 'Live Casino', value: data.live_casino_intensity, originalValue: data.live_casino_intensity },
      { subject: 'Sportbook', value: data.sportbook_intensity, originalValue: data.sportbook_intensity },
      { subject: 'Total Withdrawal', value: Math.min((data.total_withdrawal / maxWithdrawal) * 100, 100), originalValue: data.total_withdrawal }
    ]
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const subject = data.subject
      const originalValue = data.originalValue
      
      let displayValue = ''
      if (subject === 'Slot Intensity' || subject === 'Live Casino' || subject === 'Sportbook') {
        displayValue = `${data.value.toFixed(1)}%`
      } else {
        displayValue = formatCurrency(originalValue || 0)
      }
      
      return (
        <div className="bg-[#0B1A33] border border-[#FFD700] rounded-lg p-2 shadow-xl">
          <p className="text-[#FFD700] font-bold text-xs">{subject}</p>
          <p className="text-white text-xs">{displayValue}</p>
        </div>
      )
    }
    return null
  }

  // ===========================================
  // RENDER
  // ===========================================
  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <Link href="/dashboard/analytics" className="text-[#FFD700] hover:underline">
          ← BACK TO ANALYTICS
        </Link>
        <div className="text-[#FFD700] font-bold text-xl">👥 MEMBER SPECIFICATION</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {memberBoxes.map((box) => (
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
                  placeholder="Masukkan ID Member..."
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
                    <h4 className="text-sm font-bold text-[#FFD700] mb-3 text-center">Performance Radar</h4>
                    <div style={{ height: '280px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getSpiderData(box.data)}>
                          <PolarGrid stroke="#FFD70030" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#A7D8FF', fontSize: 10 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#FFD700', fontSize: 8 }} />
                          <Radar name="Member" dataKey="value" stroke="#FFD700" fill="#FFD700" fillOpacity={0.3} />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-[#0B1A33]/30 rounded-lg p-3">
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

                    <div className="bg-[#0B1A33]/30 rounded-lg p-3">
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

                    <div className="bg-[#0B1A33]/30 rounded-lg p-3">
                      <h5 className="text-purple-400 font-bold text-sm mb-2">🎮 GAME & BETTING</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-[#A7D8FF]">Total Turnover:</span> <span className="text-blue-400">{formatCurrency(box.data.total_turnover)}</span></div>
                      </div>
                    </div>

                    <div className="bg-[#0B1A33]/30 rounded-lg p-3">
                      <h5 className="text-[#FFD700] font-bold text-sm mb-2">📅 ACTIVITY FREQUENCY</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-[#A7D8FF]">Deposit Routine:</span> <span className="text-white">{formatDays(box.data.deposit_frequency_days)}</span></div>
                        <div><span className="text-[#A7D8FF]">Withdrawal Routine:</span> <span className="text-white">{formatDays(box.data.withdrawal_frequency_days)}</span></div>
                      </div>
                    </div>

                    <div className="bg-[#0B1A33]/30 rounded-lg p-3">
                      <h5 className="text-cyan-400 font-bold text-sm mb-2">🎯 GAME INTENSITY</h5>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A7D8FF]">Slot Games:</span>
                          <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${box.data.slot_intensity}%` }}></div>
                          </div>
                          <span className="text-white">{box.data.slot_intensity.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A7D8FF]">Live Casino:</span>
                          <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${box.data.live_casino_intensity}%` }}></div>
                          </div>
                          <span className="text-white">{box.data.live_casino_intensity.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#A7D8FF]">Sportbook:</span>
                          <div className="flex-1 mx-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${box.data.sportbook_intensity}%` }}></div>
                          </div>
                          <span className="text-white">{box.data.sportbook_intensity.toFixed(1)}%</span>
                        </div>
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
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}