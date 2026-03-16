'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

export default function WinloseAnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState('Januari')
  const [selectedYear, setSelectedYear] = useState('2026')
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined)
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined)
  const [useCustomRange, setUseCustomRange] = useState(false)
  const [loading, setLoading] = useState(false)

  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const years = ['2025', '2026', '2027']

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6">
        <Link href="/dashboard/analytics" className="text-[#FFD700] hover:underline">
          ← BACK TO ANALYTICS
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">WIN/LOSE ANALYTICS</h1>

      {/* FILTER SECTION - INI YANG SUDAH FIX TOTAL */}
      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* RANGE TYPE TOGGLE */}
          <div className="flex items-center gap-2">
            <button onClick={() => setUseCustomRange(false)} className={`px-4 py-2 rounded-lg ${!useCustomRange ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}>
              Bulanan
            </button>
            <button onClick={() => setUseCustomRange(true)} className={`px-4 py-2 rounded-lg ${useCustomRange ? 'bg-[#FFD700] text-[#0B1A33]' : 'bg-[#0B1A33] text-white'}`}>
              Custom Range
            </button>
          </div>

          {/* MONTHLY FILTERS */}
          {!useCustomRange && (
            <>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">BULAN</label>
                <select className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                  {months.map(month => <option key={month} value={month}>{month}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A7D8FF] block mb-1">TAHUN</label>
                <select className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </>
          )}

          {/* CUSTOM DATE RANGE - PERHATIKAN INI! SUDAH BENAR! */}
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

      {/* PLACEHOLDER CONTENT */}
      <div className="bg-[#1A2F4A] p-8 rounded-lg text-center text-[#A7D8FF]">
        Pilih periode untuk melihat data win/lose
      </div>
    </div>
  )
}