'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function KPIWeightingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // State untuk menyimpan data bobot dari database
  const [csData, setCsData] = useState([]);
  const [depositData, setDepositData] = useState([]);
  const [withdrawalData, setWithdrawalData] = useState([]);
  const [penaltyData, setPenaltyData] = useState([]);

  // ===========================================
  // LOAD DATA BOBOT DARI SUPABASE
  // ===========================================
  useEffect(() => {
    fetchWeightingData();
  }, []);

  const fetchWeightingData = async () => {
    try {
      setLoading(true);
      
      // Ambil semua data bobot
      const { data, error } = await supabase
        .from('bobot_kpi')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // Kelompokkan berdasarkan kategori
      const cs = data.filter(item => item.kategori === 'CS');
      const deposit = data.filter(item => item.kategori === 'DEPOSIT');
      const withdrawal = data.filter(item => item.kategori === 'WITHDRAWAL');
      const penalty = data.filter(item => item.kategori === 'PENALTI');

      setCsData(cs.length ? cs : getDefaultCSData());
      setDepositData(deposit.length ? deposit : getDefaultDepositData());
      setWithdrawalData(withdrawal.length ? withdrawal : getDefaultWithdrawalData());
      setPenaltyData(penalty.length ? penalty : getDefaultPenaltyData());

    } catch (error) {
      console.error('Error fetching bobot:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data bobot' });
      
      // Set default data jika gagal load
      setCsData(getDefaultCSData());
      setDepositData(getDefaultDepositData());
      setWithdrawalData(getDefaultWithdrawalData());
      setPenaltyData(getDefaultPenaltyData());
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // DEFAULT DATA (SESUAI EXCEL)
  // ===========================================
  const getDefaultCSData = () => [
    { kategori: 'CS', sub_kategori: 'Volume Chat', rentang: '>7,2%', poin: '9,5 - 10', urutan: 1 },
    { kategori: 'CS', sub_kategori: 'Volume Chat', rentang: '6,6-7,1%', poin: '9,0 - 9,4', urutan: 2 },
    { kategori: 'CS', sub_kategori: 'Volume Chat', rentang: '6-6,5%', poin: '8,0 - 8,9', urutan: 3 },
    { kategori: 'CS', sub_kategori: 'Volume Chat', rentang: '<5,9%', poin: '0-7,9', urutan: 4 },
    { kategori: 'CS', sub_kategori: 'TIME MANAGEMENT', rentang: '<6%', poin: '9,6 - 10', urutan: 5 },
    { kategori: 'CS', sub_kategori: 'TIME MANAGEMENT', rentang: '6-7,9%', poin: '9,0 - 9,5', urutan: 6 },
    { kategori: 'CS', sub_kategori: 'TIME MANAGEMENT', rentang: '8-9,9%', poin: '8,0 - 8,9', urutan: 7 },
    { kategori: 'CS', sub_kategori: 'TIME MANAGEMENT', rentang: '>10%', poin: '0 - 7,9', urutan: 8 },
    { kategori: 'CS', sub_kategori: 'Problem Solving', rentang: '<5,9%', poin: '9,6 - 10', urutan: 9 },
    { kategori: 'CS', sub_kategori: 'Problem Solving', rentang: '6-6,5%', poin: '9,0 - 9,5', urutan: 10 },
    { kategori: 'CS', sub_kategori: 'Problem Solving', rentang: '6,6-7,1%', poin: '8,0 - 8,9', urutan: 11 },
    { kategori: 'CS', sub_kategori: 'Problem Solving', rentang: '>3,8%', poin: '0 - 7,9', urutan: 12 },
    { kategori: 'CS', sub_kategori: 'Communication', rentang: '<5,9%', poin: '9,6 - 10', urutan: 13 },
    { kategori: 'CS', sub_kategori: 'Communication', rentang: '6-6,5%', poin: '9,0 - 9,5', urutan: 14 },
    { kategori: 'CS', sub_kategori: 'Communication', rentang: '6,6-7,1%', poin: '8,0 - 8,9', urutan: 15 },
    { kategori: 'CS', sub_kategori: 'Communication', rentang: '>7,2%', poin: '0 - 7,9', urutan: 16 },
    { kategori: 'CS', sub_kategori: 'Attendance', rentang: '90% - 100%', poin: '9,6 - 10', urutan: 17 },
    { kategori: 'CS', sub_kategori: 'Attendance', rentang: '79% - 89%', poin: '8,6 - 9,5', urutan: 18 },
    { kategori: 'CS', sub_kategori: 'Attendance', rentang: '68% - 78%', poin: '7,1 - 8,5', urutan: 19 },
    { kategori: 'CS', sub_kategori: 'Attendance', rentang: '57% - 67%', poin: '6,0 - 7,0', urutan: 20 },
    { kategori: 'CS', sub_kategori: 'Attendance', rentang: '56%<', poin: '0 - 5,9', urutan: 21 },
    { kategori: 'CS', sub_kategori: 'Team Work', rentang: 'BD', poin: '0', urutan: 22 },
    { kategori: 'CS', sub_kategori: 'Team Work', rentang: 'SP 1', poin: '0', urutan: 23 },
    { kategori: 'CS', sub_kategori: 'Team Work', rentang: 'SP 2', poin: '-1', urutan: 24 },
    { kategori: 'CS', sub_kategori: 'Team Work', rentang: 'SARKAS', poin: '-1', urutan: 25 }
  ];

  const getDefaultDepositData = () => [
    { kategori: 'DEPOSIT', sub_kategori: 'HUMAN ERROR', rentang: '< 0.047', poin: '9,6 - 10', urutan: 1 },
    { kategori: 'DEPOSIT', sub_kategori: 'HUMAN ERROR', rentang: '0.047 - 0.056', poin: '8,6 - 9,5', urutan: 2 },
    { kategori: 'DEPOSIT', sub_kategori: 'HUMAN ERROR', rentang: '0.057 - 0.072', poin: '7,1 - 8,5', urutan: 3 },
    { kategori: 'DEPOSIT', sub_kategori: 'HUMAN ERROR', rentang: '0.073 - 0.083', poin: '6,0 - 7,0', urutan: 4 },
    { kategori: 'DEPOSIT', sub_kategori: 'HUMAN ERROR', rentang: '> 0.083', poin: '0 - 5,9', urutan: 5 },
    { kategori: 'DEPOSIT', sub_kategori: 'Attendance', rentang: '1', poin: '9,6 - 10', urutan: 6 },
    { kategori: 'DEPOSIT', sub_kategori: 'Attendance', rentang: '98% - 99%', poin: '8,6 - 9,5', urutan: 7 },
    { kategori: 'DEPOSIT', sub_kategori: 'Attendance', rentang: '96% - 97%', poin: '7,1 - 8,5', urutan: 8 },
    { kategori: 'DEPOSIT', sub_kategori: 'Attendance', rentang: '92% - 95%', poin: '6,0 - 7,0', urutan: 9 },
    { kategori: 'DEPOSIT', sub_kategori: 'Attendance', rentang: '< 91%', poin: '0 - 5,9', urutan: 10 },
    { kategori: 'DEPOSIT', sub_kategori: 'FOLLOW SOP', rentang: '100,0', poin: '9,6 - 10', urutan: 11 },
    { kategori: 'DEPOSIT', sub_kategori: 'FOLLOW SOP', rentang: '99,0', poin: '8,6 - 9,5', urutan: 12 },
    { kategori: 'DEPOSIT', sub_kategori: 'FOLLOW SOP', rentang: '98,0', poin: '7,1 - 8,5', urutan: 13 },
    { kategori: 'DEPOSIT', sub_kategori: 'FOLLOW SOP', rentang: '96 - 98', poin: '6,0 - 7,0', urutan: 14 },
    { kategori: 'DEPOSIT', sub_kategori: 'FOLLOW SOP', rentang: '< 95', poin: '0 - 5,9', urutan: 15 },
    { kategori: 'DEPOSIT', sub_kategori: 'PROBLEM SOLVING', rentang: '< 0.019', poin: '9,6 - 10', urutan: 16 },
    { kategori: 'DEPOSIT', sub_kategori: 'PROBLEM SOLVING', rentang: '0.028 - 0.019', poin: '8,6 - 9,5', urutan: 17 },
    { kategori: 'DEPOSIT', sub_kategori: 'PROBLEM SOLVING', rentang: '0.044 - 0.029', poin: '7,1 - 8,5', urutan: 18 },
    { kategori: 'DEPOSIT', sub_kategori: 'PROBLEM SOLVING', rentang: '0.055 - 0.045', poin: '6,0 - 7,0', urutan: 19 },
    { kategori: 'DEPOSIT', sub_kategori: 'PROBLEM SOLVING', rentang: '> 0.055', poin: '0 - 5,9', urutan: 20 },
    { kategori: 'DEPOSIT', sub_kategori: 'INTERVAL', rentang: '< 1,5', poin: '9,6 - 10', urutan: 21 },
    { kategori: 'DEPOSIT', sub_kategori: 'INTERVAL', rentang: '1.5 - 3', poin: '8,6 - 9,5', urutan: 22 },
    { kategori: 'DEPOSIT', sub_kategori: 'INTERVAL', rentang: '3 - 4', poin: '7,1 - 8,5', urutan: 23 },
    { kategori: 'DEPOSIT', sub_kategori: 'INTERVAL', rentang: '4 - 5', poin: '6,0 - 7,0', urutan: 24 },
    { kategori: 'DEPOSIT', sub_kategori: 'INTERVAL', rentang: '> 5', poin: '0 - 5,9', urutan: 25 }
  ];

  const getDefaultWithdrawalData = () => [
    { kategori: 'WITHDRAWAL', sub_kategori: 'HUMAN ERROR', rentang: '< 0.047', poin: '9,6 - 10', urutan: 1 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'HUMAN ERROR', rentang: '0.047 - 0.056', poin: '8,6 - 9,5', urutan: 2 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'HUMAN ERROR', rentang: '0.057 - 0.072', poin: '7,1 - 8,5', urutan: 3 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'HUMAN ERROR', rentang: '0.073 - 0.083', poin: '6,0 - 7,0', urutan: 4 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'Attendance', rentang: '1', poin: '9,6 - 10', urutan: 5 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'Attendance', rentang: '98% - 99%', poin: '8,6 - 9,5', urutan: 6 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'Attendance', rentang: '96% - 97%', poin: '7,1 - 8,5', urutan: 7 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'Attendance', rentang: '92% - 95%', poin: '6,0 - 7,0', urutan: 8 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'Attendance', rentang: '< 91%', poin: '0 - 5,9', urutan: 9 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'FOLLOW SOP', rentang: '100,0', poin: '9,6 - 10', urutan: 10 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'FOLLOW SOP', rentang: '99,0', poin: '8,6 - 9,5', urutan: 11 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'FOLLOW SOP', rentang: '98,0', poin: '7,1 - 8,5', urutan: 12 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'FOLLOW SOP', rentang: '96 - 98', poin: '6,0 - 7,0', urutan: 13 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'FOLLOW SOP', rentang: '< 95', poin: '0 - 5,9', urutan: 14 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'PROBLEM SOLVING', rentang: '< 0.019', poin: '9,6 - 10', urutan: 15 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'PROBLEM SOLVING', rentang: '0.028 - 0.019', poin: '8,6 - 9,5', urutan: 16 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'PROBLEM SOLVING', rentang: '0.044 - 0.029', poin: '7,1 - 8,5', urutan: 17 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'PROBLEM SOLVING', rentang: '0.055 - 0.045', poin: '6,0 - 7,0', urutan: 18 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'PROBLEM SOLVING', rentang: '> 0.055', poin: '0 - 5,9', urutan: 19 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'INTERVAL', rentang: '< 1,5', poin: '9,6 - 10', urutan: 20 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'INTERVAL', rentang: '1.5 - 3', poin: '8,6 - 9,5', urutan: 21 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'INTERVAL', rentang: '3 - 4', poin: '7,1 - 8,5', urutan: 22 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'INTERVAL', rentang: '4 - 5', poin: '6,0 - 7,0', urutan: 23 },
    { kategori: 'WITHDRAWAL', sub_kategori: 'INTERVAL', rentang: '> 5', poin: '0 - 5,9', urutan: 24 }
  ];

  const getDefaultPenaltyData = () => [
    { kategori: 'PENALTI', sub_kategori: 'ALPHA', rentang: 'A', poin: '-10 (AKUMULASI X2)', urutan: 1 },
    { kategori: 'PENALTI', sub_kategori: 'UNPAID LEAVE', rentang: 'U', poin: '-5', urutan: 2 },
    { kategori: 'PENALTI', sub_kategori: 'SAKIT', rentang: 'S', poin: '-3', urutan: 3 },
    { kategori: 'PENALTI', sub_kategori: 'IZIN', rentang: 'I', poin: '-5', urutan: 4 },
    { kategori: 'PENALTI', sub_kategori: 'DIRUMAHKAN', rentang: 'D', poin: '-1', urutan: 5 }
  ];

  // ===========================================
  // HANDLE EDIT DATA
  // ===========================================
  const handleEdit = (kategori, index, field, value) => {
    switch(kategori) {
      case 'CS':
        const newCs = [...csData];
        newCs[index][field] = value;
        setCsData(newCs);
        break;
      case 'DEPOSIT':
        const newDep = [...depositData];
        newDep[index][field] = value;
        setDepositData(newDep);
        break;
      case 'WITHDRAWAL':
        const newWd = [...withdrawalData];
        newWd[index][field] = value;
        setWithdrawalData(newWd);
        break;
      case 'PENALTI':
        const newPen = [...penaltyData];
        newPen[index][field] = value;
        setPenaltyData(newPen);
        break;
    }
  };

  // ===========================================
  // SYNC KE SUPABASE
  // ===========================================
  const syncToDatabase = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });

      // Gabungkan semua data
      const allData = [
        ...csData,
        ...depositData,
        ...withdrawalData,
        ...penaltyData
      ];

      // Hapus semua data lama
      const { error: deleteError } = await supabase
        .from('bobot_kpi')
        .delete()
        .neq('id', 0); // Hapus semua

      if (deleteError) throw deleteError;

      // Insert data baru
      const { error: insertError } = await supabase
        .from('bobot_kpi')
        .insert(allData);

      if (insertError) throw insertError;

      setMessage({ type: 'success', text: 'Data bobot berhasil disimpan!' });
      
      // Refresh data
      fetchWeightingData();

    } catch (error) {
      console.error('Error saving bobot:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan data: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-4 text-[#FFD700]">Loading bobot KPI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* BACK LINK */}
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/summary-kpi-data"
          className="inline-flex items-center gap-2 text-[#A7D8FF] hover:text-[#FFD700] transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO SUMMARY KPI
        </Link>

        {/* SYNC BUTTON */}
        <button
          onClick={syncToDatabase}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#FFD700] text-[#0B1A33] px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#FFD700]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B1A33]"></div>
              SYNCING...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              SYNC TO DATABASE
            </>
          )}
        </button>
      </div>

      {/* MESSAGE */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
          'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <h1 className="text-3xl font-bold text-[#FFD700] mb-2">KPI WEIGHTING SETTINGS</h1>
      <p className="text-[#A7D8FF] mb-8">Atur bobot penilaian untuk setiap aspek KPI</p>

      {/* ========== CUSTOMER SERVICE TABLE ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4 bg-blue-500/10 p-2 rounded-lg">CUSTOMER SERVICE KPI</h2>
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF]">
                <th className="text-left py-2 px-2">Sub Kategori</th>
                <th className="text-left py-2 px-2 min-w-[150px]">Rentang</th>
                <th className="text-left py-2 px-2 min-w-[120px]">Poin</th>
              </tr>
            </thead>
            <tbody>
              {csData.map((item, idx) => (
                <tr key={`cs-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  <td className="py-2 px-2 text-[#FFD700]">{item.sub_kategori}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.rentang || ''}
                      onChange={(e) => handleEdit('CS', idx, 'rentang', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.poin || ''}
                      onChange={(e) => handleEdit('CS', idx, 'poin', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== DEPOSIT TABLE ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4 bg-green-500/10 p-2 rounded-lg">DEPOSIT KPI</h2>
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF]">
                <th className="text-left py-2 px-2">Sub Kategori</th>
                <th className="text-left py-2 px-2 min-w-[150px]">Rentang</th>
                <th className="text-left py-2 px-2 min-w-[120px]">Poin</th>
              </tr>
            </thead>
            <tbody>
              {depositData.map((item, idx) => (
                <tr key={`dep-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  <td className="py-2 px-2 text-[#FFD700]">{item.sub_kategori}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.rentang || ''}
                      onChange={(e) => handleEdit('DEPOSIT', idx, 'rentang', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.poin || ''}
                      onChange={(e) => handleEdit('DEPOSIT', idx, 'poin', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== WITHDRAWAL TABLE ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4 bg-yellow-500/10 p-2 rounded-lg">WITHDRAWAL KPI</h2>
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1200px]">
            <thead>
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF]">
                <th className="text-left py-2 px-2">Sub Kategori</th>
                <th className="text-left py-2 px-2 min-w-[150px]">Rentang</th>
                <th className="text-left py-2 px-2 min-w-[120px]">Poin</th>
              </tr>
            </thead>
            <tbody>
              {withdrawalData.map((item, idx) => (
                <tr key={`wd-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  <td className="py-2 px-2 text-[#FFD700]">{item.sub_kategori}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.rentang || ''}
                      onChange={(e) => handleEdit('WITHDRAWAL', idx, 'rentang', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.poin || ''}
                      onChange={(e) => handleEdit('WITHDRAWAL', idx, 'poin', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== PENALTY TABLE ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4 bg-red-500/10 p-2 rounded-lg">PENALTI KPI</h2>
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF]">
                <th className="text-left py-2 px-2">Kode</th>
                <th className="text-left py-2 px-2 min-w-[200px]">Keterangan</th>
                <th className="text-left py-2 px-2 min-w-[120px]">Poin</th>
              </tr>
            </thead>
            <tbody>
              {penaltyData.map((item, idx) => (
                <tr key={`pen-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                  <td className="py-2 px-2 text-[#FFD700]">
                    <input
                      type="text"
                      value={item.rentang || ''}
                      onChange={(e) => handleEdit('PENALTI', idx, 'rentang', e.target.value)}
                      className="w-20 bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.sub_kategori || ''}
                      onChange={(e) => handleEdit('PENALTI', idx, 'sub_kategori', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.poin || ''}
                      onChange={(e) => handleEdit('PENALTI', idx, 'poin', e.target.value)}
                      className="w-full bg-[#0B1A33] border border-[#FFD700]/30 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-[#FFD700]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Weighting Settings • Edit bobot penilaian sesuai kebutuhan</p>
        <p className="mt-1">Perubahan akan tersimpan setelah klik tombol SYNC TO DATABASE</p>
      </div>
    </div>
  );
}