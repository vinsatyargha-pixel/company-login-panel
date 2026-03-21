'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// ===========================================
// HELPER: Convert minutes to HH:MM:SS
// ===========================================
const formatTime = (minutes) => {
  if (!minutes || minutes === 0 || minutes === '0') return '-';
  
  const totalSeconds = Math.floor(parseFloat(minutes) * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ===========================================
// HELPER: Get first and last day of month
// ===========================================
const getMonthDateRange = (tahun, bulan) => {
  const startDate = `${tahun}-${bulan.toString().padStart(2, '0')}-01`;
  const endDate = new Date(tahun, bulan, 0).toISOString().split('T')[0];
  return { startDate, endDate };
};

// ===========================================
// AGENT MAPPING (ALIAS → NAMA LENGKAP)
// ===========================================
const AGENT_MAP = {
  'Novita Airin': 'Achmad Naufal Zakiy',
  'Rissa Aulita': 'Goldie Mountana',
  'Layla Diyah': 'Lie Fung Kien (Vini)',
  'Melissa Lin': 'Mushollina Nul Hakim',
  'Fania Lolita': 'Ronaldo Ichwan',
  'Lisa saraswati': 'Sulaeman',
  'BOT': 'BOT',
  'System': 'System',
  'SYSTEM': 'System'
};

export default function SummaryKPIDataPage() {
  const router = useRouter();
  const [tahun, setTahun] = useState('2026');
  const [bulanAwal, setBulanAwal] = useState('1');
  const [bulanAkhir, setBulanAkhir] = useState('6');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk user role
  const [userRole, setUserRole] = useState(null);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // State untuk menyimpan data transaksi
  const [depositData, setDepositData] = useState({});
  const [withdrawalData, setWithdrawalData] = useState({});
  
  // ===== STATE UNTUK CHAT CS =====
  const [chatData, setChatData] = useState({});
  const [botChatCount, setBotChatCount] = useState(0);
  const [loadingChat, setLoadingChat] = useState(false);
  
  // ===== STATE UNTUK HUMAN ERROR & PROBLEM SOLVING =====
  const [humanErrorData, setHumanErrorData] = useState({});
  const [loadingHumanError, setLoadingHumanError] = useState(false);

  // Daftar bulan
  const bulanList = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  // ===========================================
  // CEK USER ROLE
  // ===========================================
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('officers')
            .select('role')
            .eq('email', user.email)
            .maybeSingle();
          
          if (!error && data) {
            setUserRole(data.role);
          } else {
            setUserRole('staff');
          }
        } else {
          setUserRole('staff');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('staff');
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, []);

  // ===========================================
  // FETCH OFFICERS CS DP WD
  // ===========================================
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('officers')
          .select('*')
          .eq('department', 'CS DP WD')
          .order('full_name', { ascending: true });

        if (error) throw error;
        
        const systemOfficer = {
          full_name: 'System',
          panel_id: 'System',
          department: 'System',
          status: 'SYSTEM',
          join_date: '-'
        };
        
        setOfficers([...(data || []), systemOfficer]);
        
      } catch (error) {
        console.error('Error fetching officers:', error);
        setOfficers([{
          full_name: 'System',
          panel_id: 'System',
          department: 'System',
          status: 'SYSTEM',
          join_date: '-'
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  // ===========================================
  // FETCH DEPOSIT TRANSACTIONS
  // ===========================================
  useEffect(() => {
    const fetchDepositTransactions = async () => {
      try {
        const { startDate, endDate } = getMonthDateRange(tahun, parseInt(bulanAkhir));
        
        const { data, error } = await supabase
          .from('deposit_transactions')
          .select('*')
          .gte('approved_date', `${tahun}-${bulanAwal.padStart(2, '0')}-01`)
          .lte('approved_date', endDate);

        if (error) throw error;

        const grouped = {};
        
        data.forEach(tx => {
          const handler = tx.handler || 'system';
          
          if (!grouped[handler]) {
            grouped[handler] = {
              totalApproved: 0,
              totalReject: 0,
              totalSOP: 0,
              totalNonSOP: 0,
              totalDuration: 0,
              approvedCount: 0,
              rejectCount: 0,
              rejectDuration: 0
            };
          }
          
          if (tx.status === 'Approved') {
            grouped[handler].totalApproved++;
            grouped[handler].approvedCount++;
            
            const duration = tx.duration_minutes ? parseFloat(tx.duration_minutes) : 0;
            
            if (duration <= 3) {
              grouped[handler].totalSOP++;
            } else {
              grouped[handler].totalNonSOP++;
            }
            
            if (tx.duration_minutes) {
              grouped[handler].totalDuration += duration;
            }
          } 
          else if (tx.status === 'Rejected' || tx.status === 'Fail') {
            grouped[handler].totalReject++;
            grouped[handler].rejectCount++;
            
            if (tx.duration_minutes) {
              grouped[handler].rejectDuration += parseFloat(tx.duration_minutes);
            }
          }
        });
        
        Object.keys(grouped).forEach(key => {
          const g = grouped[key];
          g.avgApprovalTime = g.approvedCount > 0 ? (g.totalDuration / g.approvedCount) : 0;
          g.avgRejectTime = g.rejectCount > 0 ? (g.rejectDuration / g.rejectCount) : 0;
          g.sopPercentage = g.totalApproved > 0 ? Math.round((g.totalSOP / g.totalApproved) * 100) : 0;
        });
        
        setDepositData(grouped);
        
      } catch (error) {
        console.error('Error fetching deposit transactions:', error);
      }
    };

    if (tahun && bulanAwal && bulanAkhir) {
      fetchDepositTransactions();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // FETCH WITHDRAWAL TRANSACTIONS
  // ===========================================
  useEffect(() => {
    const fetchWithdrawalTransactions = async () => {
      try {
        const { startDate, endDate } = getMonthDateRange(tahun, parseInt(bulanAkhir));
        
        const { data, error } = await supabase
          .from('withdrawal_transactions')
          .select('*')
          .gte('approved_date', `${tahun}-${bulanAwal.padStart(2, '0')}-01`)
          .lte('approved_date', endDate);

        if (error) throw error;

        const grouped = {};
        
        data.forEach(tx => {
          const handler = tx.handler || 'system';
          
          if (!grouped[handler]) {
            grouped[handler] = {
              totalApproved: 0,
              totalReject: 0,
              totalSOP: 0,
              totalNonSOP: 0,
              totalDuration: 0,
              approvedCount: 0,
              rejectCount: 0,
              rejectDuration: 0
            };
          }
          
          if (tx.status === 'Approved') {
            grouped[handler].totalApproved++;
            grouped[handler].approvedCount++;
            
            const duration = tx.duration_minutes ? parseFloat(tx.duration_minutes) : 0;
            
            if (duration <= 5) {
              grouped[handler].totalSOP++;
            } else {
              grouped[handler].totalNonSOP++;
            }
            
            if (tx.duration_minutes) {
              grouped[handler].totalDuration += duration;
            }
          } 
          else if (tx.status === 'Rejected') {
            grouped[handler].totalReject++;
            grouped[handler].rejectCount++;
            
            if (tx.duration_minutes) {
              grouped[handler].rejectDuration += parseFloat(tx.duration_minutes);
            }
          }
        });
        
        Object.keys(grouped).forEach(key => {
          const g = grouped[key];
          g.avgApprovalTime = g.approvedCount > 0 ? (g.totalDuration / g.approvedCount) : 0;
          g.avgRejectTime = g.rejectCount > 0 ? (g.rejectDuration / g.rejectCount) : 0;
          g.sopPercentage = g.totalApproved > 0 ? Math.round((g.totalSOP / g.totalApproved) * 100) : 0;
        });
        
        setWithdrawalData(grouped);
        
      } catch (error) {
        console.error('Error fetching withdrawal transactions:', error);
      }
    };

    if (tahun && bulanAwal && bulanAkhir) {
      fetchWithdrawalTransactions();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // FETCH ATTENDANCE FROM API SCHEDULE
  // ===========================================
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const startMonth = parseInt(bulanAwal);
        const endMonth = parseInt(bulanAkhir);
        
        const grouped = {};
        
        for (let month = startMonth; month <= endMonth; month++) {
          const bulanNama = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ][month - 1];
          
          const response = await fetch(
            `/api/schedule?year=${tahun}&month=${bulanNama}`
          );
          const result = await response.json();
          
          if (!result.success) continue;
          
          result.data.forEach(day => {
            const dateStr = day['DATE RUNDOWN'];
            if (!dateStr) return;
            
            const date = new Date(dateStr);
            const monthNum = date.getMonth() + 1;
            
            if (monthNum < startMonth || monthNum > endMonth) return;
            
            const officersList = [
              'Sulaeman',
              'Goldie Mountana',
              'Achmad Naufal Zakiy',
              'Mushollina Nul Hakim',
              'Lie Fung Kien (Vini)',
              'Ronaldo Ichwan'
            ];
            
            officersList.forEach(officerName => {
              const status = day[officerName];
              if (!status) return;
              
              if (!grouped[officerName]) {
                grouped[officerName] = { s: 0, i: 0, a: 0, u: 0 };
              }
              
              const statusUpper = status.toUpperCase().trim();
              
              if (statusUpper === 'SAKIT') {
                grouped[officerName].s += 1;
              }
              else if (statusUpper === 'IZIN') {
                grouped[officerName].i += 1;
              }
              else if (statusUpper === 'ABSEN') {
                grouped[officerName].a += 1;
              }
              else if (statusUpper === 'UNPAID LEAVE') {
                grouped[officerName].u += 1;
              }
            });
          });
        }
        
        setAttendanceData(grouped);
        
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    };

    if (tahun && bulanAwal && bulanAkhir) {
      fetchAttendance();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // FETCH CHAT CS DATA
  // ===========================================
  useEffect(() => {
    const fetchChatCSData = async () => {
      try {
        setLoadingChat(true);
        
        const startMonth = parseInt(bulanAwal);
        const endMonth = parseInt(bulanAkhir);
        
        const startDate = `${tahun}-${startMonth.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(tahun), endMonth, 0).getDate();
        const endDate = `${tahun}-${endMonth.toString().padStart(2, '0')}-${lastDay}`;
        
        const { data, error } = await supabase
          .from('chat_cs_data')
          .select('*')
          .gte('started', startDate)
          .lte('started', endDate);
        
        if (error) throw error;
        
        const grouped = {};
        let botTotal = 0;
        
        data.forEach(chat => {
          const agentAlias = chat.agent_alias || 'Unknown';
          let officerName = AGENT_MAP[agentAlias] || agentAlias;
          
          if (agentAlias === 'BOT' || officerName === 'BOT') {
            botTotal++;
            return;
          }
          
          if (officerName === 'System' || officerName === 'SYSTEM') {
            return;
          }
          
          if (!grouped[officerName]) {
            grouped[officerName] = { totalChat: 0 };
          }
          
          grouped[officerName].totalChat++;
        });
        
        setChatData(grouped);
        setBotChatCount(botTotal);
        
      } catch (error) {
        console.error('❌ Error fetching chat data:', error);
      } finally {
        setLoadingChat(false);
      }
    };
    
    if (tahun && bulanAwal && bulanAkhir) {
      fetchChatCSData();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // FETCH HUMAN ERROR & PROBLEM SOLVING DATA DARI GOOGLE SHEETS
  // ===========================================
  const fetchHumanErrorData = async () => {
    try {
      setLoadingHumanError(true);
      
      const response = await fetch(
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9VI82RFmJJECM1dwHgAk9YlFSGGVcuAgf5sexjLal3U5OZ6BJL35oAxLd2h17vgsBBC6o0JXEcV-Z/pub?gid=70613788&single=true&output=csv'
      );
      
      const csvText = await response.text();
      
      // Parse CSV manual
      const rows = csvText.trim().split('\n');
      const headers = rows[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      
      const data = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const values = [];
        let inQuote = false;
        let current = '';
        
        for (let j = 0; j < row.length; j++) {
          const char = row[j];
          if (char === '"') {
            inQuote = !inQuote;
          } else if (char === ',' && !inQuote) {
            values.push(current.replace(/^"|"$/g, '').trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.replace(/^"|"$/g, '').trim());
        
        if (values.length >= 15 && values[1] && values[1] !== '') {
          const obj = {};
          headers.forEach((h, idx) => { obj[h] = values[idx] || ''; });
          data.push(obj);
        }
      }
      
      // Kelompokkan berdasarkan officer_id dan divisi (dari ticket)
      const grouped = {};
      const startMonth = parseInt(bulanAwal);
      const endMonth = parseInt(bulanAkhir);
      const targetYear = parseInt(tahun);
      const monthMap = { 'Jan':1, 'Feb':2, 'Mar':3, 'Apr':4, 'May':5, 'Jun':6, 'Jul':7, 'Aug':8, 'Sep':9, 'Oct':10, 'Nov':11, 'Dec':12 };
      
      data.forEach(item => {
        const officerId = item['OFFICER ID']?.trim();
        const ticket = item['NO TICKET'] || '';
        const category = item['CATEGORIES']?.toUpperCase() || '';
        const amount = parseFloat(String(item['AMOUNT'] || '0').replace(/[^0-9.-]/g, '')) || 0;
        const date = item['DATE'] ? parseInt(item['DATE']) : null;
        const month = item['MONTH']?.trim() || '';
        const year = item['YEARS'] ? parseInt(item['YEARS']) : null;
        
        if (!officerId || !date || !month || !year) return;
        
        // Filter periode
        const itemMonth = monthMap[month.substring(0,3)] || 0;
        if (year !== targetYear) return;
        if (itemMonth < startMonth || itemMonth > endMonth) return;
        
        // Tentukan divisi dari nomor ticket
        const divisi = ticket.toUpperCase().startsWith('W') ? 'withdrawal' : 'deposit';
        
        if (!grouped[officerId]) {
          grouped[officerId] = {
            deposit: {
              mistakeQty: 0,
              mistakeAmount: 0,
              blockBank: 0,
              crossBankQty: 0,
              crossBankAmount: 0,
              crossAssetQty: 0,
              crossAssetAmount: 0
            },
            withdrawal: {
              mistakeQty: 0,
              mistakeAmount: 0,
              blockBank: 0,
              crossBankQty: 0,
              crossBankAmount: 0,
              crossAssetQty: 0,
              crossAssetAmount: 0
            }
          };
        }
        
        if (category === 'REPORT MISTAKE') {
          grouped[officerId][divisi].mistakeQty++;
          grouped[officerId][divisi].mistakeAmount += amount;
        }
        else if (category === 'REPORT BLOCK BANK') {
          grouped[officerId][divisi].blockBank++;
        }
        else if (category === 'REPORT CROSSBANK') {
          grouped[officerId][divisi].crossBankQty++;
          grouped[officerId][divisi].crossBankAmount += amount;
        }
        else if (category === 'REPORT CROSSASSET') {
          grouped[officerId][divisi].crossAssetQty++;
          grouped[officerId][divisi].crossAssetAmount += amount;
        }
      });
      
      setHumanErrorData(grouped);
      
    } catch (error) {
      console.error('❌ Error fetching human error data:', error);
    } finally {
      setLoadingHumanError(false);
    }
  };

  // Panggil fetchHumanErrorData ketika periode berubah
  useEffect(() => {
    if (tahun && bulanAwal && bulanAkhir) {
      fetchHumanErrorData();
    }
  }, [tahun, bulanAwal, bulanAkhir]);

  // ===========================================
  // HITUNG TOTAL HARI DALAM RENTANG BULAN
  // ===========================================
  const getTotalDaysInRange = () => {
    const start = parseInt(bulanAwal);
    const end = parseInt(bulanAkhir);
    let total = 0;
    
    for (let month = start; month <= end; month++) {
      total += new Date(tahun, month, 0).getDate();
    }
    
    return total;
  };

  const totalDays = getTotalDaysInRange();
  const monthsInRange = parseInt(bulanAkhir) - parseInt(bulanAwal) + 1;
  const totalOffDays = monthsInRange * 4;
  const targetPerOfficer = totalDays - totalOffDays;

  // ===========================================
  // MAP DATA REAL KE FORMAT YANG DIBUTUHKAN
  // ===========================================
  const getDepositDataForOfficer = (officer) => {
    // System officer
    if (officer.panel_id === 'System' || officer.full_name === 'System') {
      const data = depositData['SYSTEM'] || depositData['system'] || {};
      return {
        totalApproved: data.totalApproved || 0,
        totalReject: data.totalReject || 0,
        sop: data.totalSOP || 0,
        sopPercent: data.sopPercentage || 0,
        nonSop: data.totalNonSOP || 0,
        intervalApp: data.avgApprovalTime || 0,
        intervalRej: data.avgRejectTime || 0,
        heQty: 0,
        heAmount: '-',
        mistakeQty: 0,
        mistakeAmount: '-',
        blockBank: 0,
        crossBankQty: 0,
        crossBankAmount: '-',
        crossAssetQty: 0,
        crossAssetAmount: '-',
        bukuDosa: 0,
        sp1: 0,
        sp2: 0,
        sus: 0,
        totalPoin4: 100,
        p1: data.sopPercentage || 0,
        p2: 100,
        p3: 100,
        p4: 100,
        avg: data.sopPercentage ? Math.round((data.sopPercentage + 100 + 100 + 100) / 4) : 0
      };
    }

    // Cari data deposit dari transaksi
    const handlerVariants = [
      officer.panel_id?.toLowerCase(),
      officer.panel_id,
      officer.username?.toLowerCase(),
      officer.full_name?.toLowerCase()
    ].filter(Boolean);
    
    let data = {};
    for (const variant of handlerVariants) {
      if (depositData[variant]) {
        data = depositData[variant];
        break;
      }
    }
    
    // Ambil data human error untuk deposit
    const humanError = humanErrorData[officer.panel_id]?.deposit || {
      mistakeQty: 0,
      mistakeAmount: 0,
      blockBank: 0,
      crossBankQty: 0,
      crossBankAmount: 0,
      crossAssetQty: 0,
      crossAssetAmount: 0
    };
    
    const totalHeQty = humanError.mistakeQty + humanError.blockBank;
    
    return {
      totalApproved: data.totalApproved || 0,
      totalReject: data.totalReject || 0,
      sop: data.totalSOP || 0,
      sopPercent: data.sopPercentage || 0,
      nonSop: data.totalNonSOP || 0,
      intervalApp: data.avgApprovalTime || 0,
      intervalRej: data.avgRejectTime || 0,
      // HUMAN ERROR
      heQty: totalHeQty,
      heAmount: humanError.mistakeAmount > 0 ? humanError.mistakeAmount : '-',
      mistakeQty: humanError.mistakeQty,
      mistakeAmount: humanError.mistakeAmount > 0 ? humanError.mistakeAmount : '-',
      blockBank: humanError.blockBank,
      // PROBLEM SOLVING
      crossBankQty: humanError.crossBankQty,
      crossBankAmount: humanError.crossBankAmount > 0 ? humanError.crossBankAmount : '-',
      crossAssetQty: humanError.crossAssetQty,
      crossAssetAmount: humanError.crossAssetAmount > 0 ? humanError.crossAssetAmount : '-',
      // FOLLOW SOP (masih dummy)
      bukuDosa: 0,
      sp1: 0,
      sp2: 0,
      sus: 0,
      totalPoin4: 100,
      p1: data.sopPercentage || 0,
      p2: totalHeQty === 0 ? 100 : Math.max(0, 100 - (totalHeQty * 10)),
      p3: (humanError.crossBankQty + humanError.crossAssetQty) === 0 ? 100 : Math.max(0, 100 - ((humanError.crossBankQty + humanError.crossAssetQty) * 10)),
      p4: 100,
      avg: data.sopPercentage ? Math.round((data.sopPercentage + (totalHeQty === 0 ? 100 : Math.max(0, 100 - (totalHeQty * 10))) + ((humanError.crossBankQty + humanError.crossAssetQty) === 0 ? 100 : Math.max(0, 100 - ((humanError.crossBankQty + humanError.crossAssetQty) * 10))) + 100) / 4) : 0
    };
  };

  const getWithdrawalDataForOfficer = (officer) => {
    // System officer
    if (officer.panel_id === 'System' || officer.full_name === 'System') {
      const data = withdrawalData['SYSTEM'] || withdrawalData['system'] || {};
      return {
        totalApproved: data.totalApproved || 0,
        totalReject: data.totalReject || 0,
        sop: data.totalSOP || 0,
        sopPercent: data.sopPercentage || 0,
        nonSop: data.totalNonSOP || 0,
        intervalApp: data.avgApprovalTime || 0,
        intervalRej: data.avgRejectTime || 0,
        heQty: 0,
        heAmount: '-',
        mistakeQty: 0,
        mistakeAmount: '-',
        blockBank: 0,
        crossBankQty: 0,
        crossBankAmount: '-',
        crossAssetQty: 0,
        crossAssetAmount: '-',
        bukuDosa: 0,
        sp1: 0,
        sp2: 0,
        sus: 0,
        totalPoin4: 100,
        p1: data.sopPercentage || 0,
        p2: 100,
        p3: 100,
        p4: 100,
        avg: data.sopPercentage ? Math.round((data.sopPercentage + 100 + 100 + 100) / 4) : 0
      };
    }

    // Cari data withdrawal dari transaksi
    const handlerVariants = [
      officer.panel_id?.toLowerCase(),
      officer.panel_id,
      officer.username?.toLowerCase(),
      officer.full_name?.toLowerCase()
    ].filter(Boolean);
    
    let data = {};
    for (const variant of handlerVariants) {
      if (withdrawalData[variant]) {
        data = withdrawalData[variant];
        break;
      }
    }
    
    // Ambil data human error untuk withdrawal
    const humanError = humanErrorData[officer.panel_id]?.withdrawal || {
      mistakeQty: 0,
      mistakeAmount: 0,
      blockBank: 0,
      crossBankQty: 0,
      crossBankAmount: 0,
      crossAssetQty: 0,
      crossAssetAmount: 0
    };
    
    const totalHeQty = humanError.mistakeQty + humanError.blockBank;
    
    return {
      totalApproved: data.totalApproved || 0,
      totalReject: data.totalReject || 0,
      sop: data.totalSOP || 0,
      sopPercent: data.sopPercentage || 0,
      nonSop: data.totalNonSOP || 0,
      intervalApp: data.avgApprovalTime || 0,
      intervalRej: data.avgRejectTime || 0,
      // HUMAN ERROR
      heQty: totalHeQty,
      heAmount: humanError.mistakeAmount > 0 ? humanError.mistakeAmount : '-',
      mistakeQty: humanError.mistakeQty,
      mistakeAmount: humanError.mistakeAmount > 0 ? humanError.mistakeAmount : '-',
      blockBank: humanError.blockBank,
      // PROBLEM SOLVING
      crossBankQty: humanError.crossBankQty,
      crossBankAmount: humanError.crossBankAmount > 0 ? humanError.crossBankAmount : '-',
      crossAssetQty: humanError.crossAssetQty,
      crossAssetAmount: humanError.crossAssetAmount > 0 ? humanError.crossAssetAmount : '-',
      // FOLLOW SOP (masih dummy)
      bukuDosa: 0,
      sp1: 0,
      sp2: 0,
      sus: 0,
      totalPoin4: 100,
      p1: data.sopPercentage || 0,
      p2: totalHeQty === 0 ? 100 : Math.max(0, 100 - (totalHeQty * 10)),
      p3: (humanError.crossBankQty + humanError.crossAssetQty) === 0 ? 100 : Math.max(0, 100 - ((humanError.crossBankQty + humanError.crossAssetQty) * 10)),
      p4: 100,
      avg: data.sopPercentage ? Math.round((data.sopPercentage + (totalHeQty === 0 ? 100 : Math.max(0, 100 - (totalHeQty * 10))) + ((humanError.crossBankQty + humanError.crossAssetQty) === 0 ? 100 : Math.max(0, 100 - ((humanError.crossBankQty + humanError.crossAssetQty) * 10))) + 100) / 4) : 0
    };
  };

  // ===== FUNGSI GET CHAT DATA UNTUK OFFICER =====
  const getChatDataForOfficer = (officer) => {
    const officerName = officer.full_name;
    
    if (officerName === 'System' || officerName === 'SYSTEM') {
      return { totalChat: 0 };
    }
    
    const data = chatData[officerName];
    return { totalChat: data?.totalChat || 0 };
  };

  // Generate data dengan real attendance
  const officerDataList = officers.map((officer, index) => {
    const depositReal = getDepositDataForOfficer(officer);
    const withdrawalReal = getWithdrawalDataForOfficer(officer);
    const chatReal = getChatDataForOfficer(officer);
    
    const officerName = officer.full_name;
    const attendance = attendanceData[officerName] || { s: 0, i: 0, a: 0, u: 0 };
    
    const target = targetPerOfficer;
    const totalKejadian = attendance.s + attendance.i + attendance.a + attendance.u;
    const achieve = target - totalKejadian;
    const presentase = target > 0 ? Math.round((achieve / target) * 100) : 100;
    
    return {
      no: index + 1,
      name: officer.full_name || 'Unknown',
      panelId: officer.panel_id || '-',
      dept: officer.department || 'CS DP WD',
      status: officer.status || 'REGULAR',
      joinDate: officer.join_date || '-',
      
      deposit: {
        divisi: 'Deposit Aspect',
        ...depositReal
      },
      
      withdrawal: {
        divisi: 'Withdrawal Aspect',
        ...withdrawalReal
      },
      
      cs: {
        totalChat: chatReal.totalChat,
        missedChat: 0,
        timeMgmt: 0,
        commSkill: 0,
        problemSolving: 0,
        s: attendance.s,
        i: attendance.i,
        a: attendance.a,
        u: attendance.u,
        total: totalKejadian,
        target: target,
        achieve: achieve,
        presentase: presentase,
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0,
        p5: 0,
        p6: 0
      }
    };
  });

  if (loading || checkingRole) {
    return (
      <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
          <p className="mt-4 text-[#FFD700]">Loading KPI data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full min-h-screen bg-[#0B1A33] text-white">
      {/* BACK LINK & WEIGHTING BUTTON */}
      <div className="mb-6 flex justify-between items-center">
        <Link 
          href="/dashboard/officers-kpi"
          className="inline-flex items-center gap-2 text-[#A7D8FF] hover:text-[#FFD700] transition-colors text-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO OFFICERS KPI
        </Link>
        
        <button
          onClick={() => router.push('/dashboard/officers-kpi/summary-kpi-data/kpi-weighting')}
          className="inline-flex items-center gap-2 bg-[#FFD700] text-[#0B1A33] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#FFD700]/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          WEIGHTING SETTINGS
        </button>
      </div>

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-[#FFD700] mb-2">SUMMARY KPI DATA</h1>
      <p className="text-[#A7D8FF] mb-6">
        KPI Summary CS DP WD • Periode {bulanList.find(b => b.value === bulanAwal)?.label} - {bulanList.find(b => b.value === bulanAkhir)?.label} {tahun}
      </p>

      {/* FILTER - RENTANG BULAN */}
      <div className="bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4 mb-8 flex flex-wrap gap-4 items-center">
        <span className="text-[#FFD700] font-bold text-sm">FILTER RENTANG BULAN:</span>
        
        <select 
          value={tahun}
          onChange={(e) => setTahun(e.target.value)}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm w-24"
        >
          <option>2024</option>
          <option>2025</option>
          <option>2026</option>
          <option>2027</option>
        </select>
        
        <select 
          value={bulanAwal}
          onChange={(e) => {
            setBulanAwal(e.target.value);
            if (parseInt(e.target.value) > parseInt(bulanAkhir)) {
              setBulanAkhir(e.target.value);
            }
          }}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm"
        >
          {bulanList.map(bulan => (
            <option key={bulan.value} value={bulan.value}>{bulan.label}</option>
          ))}
        </select>
        
        <span className="text-[#FFD700]">s/d</span>
        
        <select 
          value={bulanAkhir}
          onChange={(e) => setBulanAkhir(e.target.value)}
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded px-3 py-2 text-white text-sm"
        >
          {bulanList.filter(b => parseInt(b.value) >= parseInt(bulanAwal)).map(bulan => (
            <option key={bulan.value} value={bulan.value}>{bulan.label}</option>
          ))}
        </select>
        
        <span className="text-[#A7D8FF] text-sm ml-auto">
          Total Officers: {officers.length}
        </span>
      </div>

      {/* ========== DEPOSIT & WITHDRAWAL KPI ========== */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">DEPOSIT & WITHDRAWAL KPI</h2>
        
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1800px]">
            <thead>
              {/* MAIN HEADER */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="6" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
                <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">TIME MANAGEMENT</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">HUMAN ERROR</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">PROBLEM SOLVING</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">FOLLOW SOP</th>
                <th colSpan="5" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">SUB SCORE</th>
               </tr>
              
              {/* SUB HEADER */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
                <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[150px]">NAME</th>
                <th className="sticky left-[190px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">PANEL ID</th>
                <th className="sticky left-[290px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[390px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
                <th className="sticky left-[470px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[90px]">JOIN DATE</th>
                <th className="sticky left-[560px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DIVISI</th>
                
                {/* TIME MANAGEMENT */}
                <th className="text-center py-2 px-2 min-w-[50px]">App Qty</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Rej Qty</th>
                <th className="text-center py-2 px-2 min-w-[40px]">SOP</th>
                <th className="text-center py-2 px-2 min-w-[45px]">SOP%</th>
                <th className="text-center py-2 px-2 min-w-[45px]">Non SOP</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Int App</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Int Rej</th>
                
                {/* HUMAN ERROR */}
                <th className="text-center py-2 px-2 min-w-[30px]">HE Qty</th>
                <th className="text-center py-2 px-2 min-w-[50px]">HE Amount</th>
                <th className="text-center py-2 px-2 min-w-[40px]">Mist Qty</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Mist Amount</th>
                <th className="text-center py-2 px-2 min-w-[40px]">Block B</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P2</th>
                
                {/* PROBLEM SOLVING */}
                <th className="text-center py-2 px-2 min-w-[35px]">CB Qty</th>
                <th className="text-center py-2 px-2 min-w-[55px]">CB Amount</th>
                <th className="text-center py-2 px-2 min-w-[35px]">CA Qty</th>
                <th className="text-center py-2 px-2 min-w-[55px]">CA Amount</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P3</th>
                
                {/* FOLLOW SOP */}
                <th className="text-center py-2 px-2 min-w-[40px]">Buku Dosa</th>
                <th className="text-center py-2 px-2 min-w-[30px]">SP1</th>
                <th className="text-center py-2 px-2 min-w-[30px]">SP2</th>
                <th className="text-center py-2 px-2 min-w-[30px]">SUS</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P4</th>
                
                {/* SUB SCORE */}
                <th className="text-center py-2 px-2 min-w-[35px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[35px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[35px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[35px]">P4</th>
                <th className="text-center py-2 px-2 min-w-[40px]">AVG</th>
               </tr>
            </thead>
            <tbody>
              {officerDataList.map((officer, idx) => (
                <React.Fragment key={`officer-${idx}`}>
                  {/* DEPOSIT ASPECT */}
                  <tr className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.no}</td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{officer.name}</td>
                    <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officer.panelId}</td>
                    <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.dept}</td>
                    <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">{officer.status}</span>
                    </td>
                    <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.joinDate}</td>
                    <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Deposit</td>
                    
                    {/* TIME MANAGEMENT */}
                    <td className="text-center py-2 px-2">{officer.deposit.totalApproved || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.totalReject || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sop || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sopPercent ? `${officer.deposit.sopPercent}%` : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.nonSop || '-'}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.deposit.intervalApp)}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.deposit.intervalRej)}</td>
                    
                    {/* HUMAN ERROR */}
                    <td className="text-center py-2 px-2">{officer.deposit.heQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.heAmount !== '-' ? formatIDR(officer.deposit.heAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.mistakeAmount !== '-' ? formatIDR(officer.deposit.mistakeAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.blockBank}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p2}%</td>
                    
                    {/* PROBLEM SOLVING */}
                    <td className="text-center py-2 px-2">{officer.deposit.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossBankAmount !== '-' ? formatIDR(officer.deposit.crossBankAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.crossAssetAmount !== '-' ? formatIDR(officer.deposit.crossAssetAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p3}%</td>
                    
                    {/* FOLLOW SOP */}
                    <td className="text-center py-2 px-2">{officer.deposit.bukuDosa}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sp1}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sp2}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.sus}</td>
                    <td className="text-center py-2 px-2">{officer.deposit.p4}%</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.deposit.p1 ? `${officer.deposit.p1}%` : '-'}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.deposit.p2}%</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.deposit.p3}%</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.deposit.p4}%</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.deposit.avg || '-'}</td>
                  </tr>

                  {/* WITHDRAWAL ASPECT */}
                  <tr className="border-b border-[#FFD700]/10 bg-[#0B1A33]/50 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[470px] z-10 bg-[#1A2F4A] py-2 px-2"></td>
                    <td className="sticky left-[560px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700] font-bold">Withdrawal</td>
                    
                    {/* TIME MANAGEMENT */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalApproved || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.totalReject || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sop || '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sopPercent ? `${officer.withdrawal.sopPercent}%` : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.nonSop || '-'}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.withdrawal.intervalApp)}</td>
                    <td className="text-center py-2 px-2 text-blue-300 font-mono">{formatTime(officer.withdrawal.intervalRej)}</td>
                    
                    {/* HUMAN ERROR */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.heQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.heAmount !== '-' ? formatIDR(officer.withdrawal.heAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.mistakeQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.mistakeAmount !== '-' ? formatIDR(officer.withdrawal.mistakeAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.blockBank}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p2}%</td>
                    
                    {/* PROBLEM SOLVING */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossBankQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossBankAmount !== '-' ? formatIDR(officer.withdrawal.crossBankAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossAssetQty}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.crossAssetAmount !== '-' ? formatIDR(officer.withdrawal.crossAssetAmount) : '-'}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p3}%</td>
                    
                    {/* FOLLOW SOP */}
                    <td className="text-center py-2 px-2">{officer.withdrawal.bukuDosa}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sp1}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sp2}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.sus}</td>
                    <td className="text-center py-2 px-2">{officer.withdrawal.p4}%</td>
                    
                    {/* SUB SCORE */}
                    <td className="text-center py-2 px-2 font-bold text-blue-400">{officer.withdrawal.p1 ? `${officer.withdrawal.p1}%` : '-'}</td>
                    <td className="text-center py-2 px-2 font-bold text-red-400">{officer.withdrawal.p2}%</td>
                    <td className="text-center py-2 px-2 font-bold text-yellow-400">{officer.withdrawal.p3}%</td>
                    <td className="text-center py-2 px-2 font-bold text-green-400">{officer.withdrawal.p4}%</td>
                    <td className="text-center py-2 px-2 font-bold text-[#FFD700]">{officer.withdrawal.avg || '-'}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== CUSTOMER SERVICE KPI ========== */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-[#FFD700] mb-4">CUSTOMER SERVICE KPI</h2>
        
        <div className="overflow-x-auto bg-[#1A2F4A] rounded-xl border border-[#FFD700]/30 p-4">
          <table className="w-full text-xs min-w-[1600px]">
            <thead>
              {/* MAIN HEADER CS */}
              <tr className="border-b border-[#FFD700]/20">
                <th colSpan="5" className="sticky left-0 z-20 bg-[#1A2F4A] text-left py-2 px-2 text-[#FFD700]"> </th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-blue-500/10">Poin 1</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-green-500/10">Poin 2</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-yellow-500/10">Poin 3</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-purple-500/10">Poin 4</th>
                <th colSpan="1" className="text-center py-2 px-2 text-[#FFD700] bg-red-500/10">Poin 5</th>
                <th colSpan="8" className="text-center py-2 px-2 text-[#FFD700] bg-orange-500/10">Attendance & Attitude (Poin 6)</th>
                <th colSpan="6" className="text-center py-2 px-2 text-[#FFD700] bg-pink-500/10">SUB SCORE CS</th>
               </tr>
              
              {/* SUB HEADER CS */}
              <tr className="border-b border-[#FFD700]/20 text-[#A7D8FF] text-[10px]">
                <th className="sticky left-0 z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[40px]">No</th>
                <th className="sticky left-[40px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[150px]">NAME</th>
                <th className="sticky left-[190px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">PANEL ID</th>
                <th className="sticky left-[290px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[100px]">DEPARTMENT</th>
                <th className="sticky left-[390px] z-10 bg-[#1A2F4A] text-left py-2 px-2 min-w-[80px]">STATUS</th>
                
                {/* Poin 1-5 */}
                <th className="text-center py-2 px-2 min-w-[70px]">Total Chat</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Missed Chat</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Time Mgmt</th>
                <th className="text-center py-2 px-2 min-w-[70px]">Comm Skill</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Problem Solving</th>
                
                {/* Poin 6 - Attendance */}
                <th className="text-center py-2 px-2 min-w-[40px]">S</th>
                <th className="text-center py-2 px-2 min-w-[40px]">I</th>
                <th className="text-center py-2 px-2 min-w-[40px]">A</th>
                <th className="text-center py-2 px-2 min-w-[40px]">U</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Total</th>
                <th className="text-center py-2 px-2 min-w-[50px]">Target</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Achieve</th>
                <th className="text-center py-2 px-2 min-w-[60px]">Presentase</th>
                
                {/* Sub Score CS */}
                <th className="text-center py-2 px-2 min-w-[40px]">P1</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P2</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P3</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P4</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P5</th>
                <th className="text-center py-2 px-2 min-w-[40px]">P6</th>
               </tr>
            </thead>
            <tbody>
              {officerDataList.map((officer, idx) => {
                if (officer.name === 'System' || officer.name === 'SYSTEM') return null;
                
                return (
                  <tr key={`cs-${idx}`} className="border-b border-[#FFD700]/10 hover:bg-[#FFD700]/5">
                    <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.no}</td>
                    <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium">{officer.name}</td>
                    <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#FFD700]">{officer.panelId}</td>
                    <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officer.dept}</td>
                    <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                      <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-[10px]">{officer.status}</span>
                    </td>
                    
                    {/* Poin 1 - Total Chat (REAL) */}
                    <td className="text-center py-2 px-2">{officer.cs.totalChat}</td>
                    
                    {/* Poin 2-5 (DUMMY 0) */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    
                    {/* Poin 6 - Attendance (REAL) */}
                    <td className="text-center py-2 px-2">{officer.cs.s}</td>
                    <td className="text-center py-2 px-2">{officer.cs.i}</td>
                    <td className="text-center py-2 px-2">{officer.cs.a}</td>
                    <td className="text-center py-2 px-2">{officer.cs.u}</td>
                    <td className="text-center py-2 px-2">{officer.cs.total}</td>
                    <td className="text-center py-2 px-2">{officer.cs.target}</td>
                    <td className="text-center py-2 px-2">{officer.cs.achieve}</td>
                    <td className="text-center py-2 px-2">{officer.cs.presentase}%</td>
                    
                    {/* Sub Score CS - 0 semua */}
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                    <td className="text-center py-2 px-2">0</td>
                  </tr>
                );
              })}
              
              {/* BOT ROW */}
              <tr className="border-b border-[#FFD700]/10 bg-blue-900/20">
                <td className="sticky left-0 z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">{officers.length}</td>
                <td className="sticky left-[40px] z-10 bg-[#1A2F4A] py-2 px-2 font-medium text-blue-400">BOT</td>
                <td className="sticky left-[190px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">-</td>
                <td className="sticky left-[290px] z-10 bg-[#1A2F4A] py-2 px-2 text-[#A7D8FF]">System</td>
                <td className="sticky left-[390px] z-10 bg-[#1A2F4A] py-2 px-2">
                  <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px]">BOT</span>
                </td>
                
                {/* Poin 1 - Total Chat BOT */}
                <td className="text-center py-2 px-2">{botChatCount}</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">-</td>
                <td className="text-center py-2 px-2">-</td>
                <td className="text-center py-2 px-2">-</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
                <td className="text-center py-2 px-2">0</td>
              </tr>
            </tbody>
          </table>
          {loadingChat && (
            <div className="text-center py-4 text-[#A7D8FF]">
              Loading chat data...
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-xs text-[#A7D8FF]/30 text-center mt-8">
        <p>KPI Summary • Data officers diambil dari database ({officers.length} officers CS DP WD) • Periode {bulanList.find(b => b.value === bulanAwal)?.label} - {bulanList.find(b => b.value === bulanAkhir)?.label} {tahun}</p>
        <p className="mt-1">P1: Time Management | P2: Human Error | P3: Problem Solving | P4: Follow SOP | P5: Chat Achievement | P6: Attendance & Attitude</p>
        <p className="mt-1 text-green-400">✓ Time Management menggunakan data real berdasarkan approved_date</p>
        <p className="mt-1 text-yellow-400">✓ Interval App & Rej dalam format HH:MM:SS</p>
        <p className="mt-1 text-blue-400">✓ Attendance (S/I/A/U) dari API Schedule real</p>
        <p className="mt-1 text-purple-400">✓ Total Chat dari tabel chat_cs_data berdasarkan agent_alias</p>
        <p className="mt-1 text-red-400">✓ Human Error & Problem Solving dari Google Sheets (REPORT MISTAKE, REPORT BLOCK BANK, REPORT CROSSBANK, REPORT CROSSASSET)</p>
        <p className="mt-1 text-red-400">✓ Target: {totalDays} hari - {totalOffDays} OFF = {targetPerOfficer} hari</p>
      </div>
    </div>
  );
}

// Helper formatIDR untuk tabel (tambahkan di luar komponen)
const formatIDR = (amount) => {
  if (!amount || amount === '-') return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};