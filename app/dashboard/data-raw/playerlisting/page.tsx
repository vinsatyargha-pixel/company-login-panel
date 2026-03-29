'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import * as XLSX from 'xlsx';

type Asset = {
  id: string;
  asset_name: string;
  asset_code: string;
};

type PlayerUpload = {
  id: string;
  upload_id: string;
  upload_date: string;
  file_name: string;
  total_rows: number;
  status: string;
  website?: string;
  min_date: string;
  max_date: string;
  active_players: number;
};

export default function PlayerListingPage() {
  const [uploads, setUploads] = useState<PlayerUpload[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const years = ['2025', '2026', '2027'];

  const monthMap: { [key: string]: string } = {
    'jan': '01', 'january': '01',
    'feb': '02', 'february': '02',
    'mar': '03', 'march': '03',
    'apr': '04', 'april': '04',
    'may': '05',
    'jun': '06', 'june': '06',
    'jul': '07', 'july': '07',
    'aug': '08', 'august': '08',
    'sep': '09', 'september': '09',
    'oct': '10', 'october': '10',
    'nov': '11', 'november': '11',
    'dec': '12', 'december': '12'
  };

  useEffect(() => {
    const today = new Date();
    setSelectedMonth(months[today.getMonth()]);
    setSelectedYear(today.getFullYear().toString());
    fetchAssets();
  }, []);

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchUploads();
    }
  }, [selectedMonth, selectedYear, selectedAsset]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, selectedAsset]);

  const fetchAssets = async () => {
    try {
      const { data } = await supabase
        .from('assets')
        .select('id, asset_name, asset_code')
        .order('asset_name');
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  const fetchUploads = async () => {
    try {
      setLoading(true);
      
      if (!selectedMonth || !selectedYear) {
        setLoading(false);
        return;
      }
      
      const monthIndex = months.indexOf(selectedMonth) + 1;
      const monthPadded = String(monthIndex).padStart(2, '0');
      const startDate = `${selectedYear}-${monthPadded}-01`;
      const lastDay = new Date(parseInt(selectedYear), monthIndex, 0).getDate();
      const endDate = `${selectedYear}-${monthPadded}-${lastDay}`;

      let allListings: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('player_listing')
          .select('upload_id, registration_date, username, file_name, website')
          .gte('registration_date', startDate)
          .lte('registration_date', endDate)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          allListings = [...allListings, ...data];
          page++;
        }
        
        if (!data || data.length < pageSize) {
          hasMore = false;
        }
      }

      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset);
        if (asset) {
          allListings = allListings.filter(item => item.website === asset.asset_code);
        }
      }

      if (!allListings || allListings.length === 0) {
        setUploads([]);
        setLoading(false);
        return;
      }

      const fileMap = new Map<string, {
        file_name: string;
        website: string;
        total_rows: number;
        min_date: string;
        max_date: string;
        active_players: Set<string>;
      }>();

      for (const item of allListings) {
        const fileName = item.file_name;
        const regDate = item.registration_date?.split(' ')[0];
        
        if (!fileMap.has(fileName)) {
          fileMap.set(fileName, {
            file_name: fileName,
            website: item.website || 'XLY',
            total_rows: 0,
            min_date: regDate || '',
            max_date: regDate || '',
            active_players: new Set()
          });
        }
        
        const file = fileMap.get(fileName)!;
        file.total_rows++;
        file.active_players.add(item.username);
        
        if (regDate && regDate < file.min_date) file.min_date = regDate;
        if (regDate && regDate > file.max_date) file.max_date = regDate;
      }

      const uniqueFileNames = Array.from(fileMap.keys());
      const { data: uploadsData } = await supabase
        .from('player_uploads')
        .select('file_name, upload_date')
        .in('file_name', uniqueFileNames);

      const uploadDateMap = new Map();
      uploadsData?.forEach(u => {
        uploadDateMap.set(u.file_name, u.upload_date);
      });

      const result = Array.from(fileMap.values()).map(file => ({
        id: file.file_name,
        upload_id: file.file_name,
        upload_date: uploadDateMap.get(file.file_name) || '',
        file_name: file.file_name,
        website: file.website,
        total_rows: file.total_rows,
        status: 'completed',
        min_date: file.min_date,
        max_date: file.max_date,
        active_players: file.active_players.size
      }));

      setUploads(result);
      
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = uploads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(uploads.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const validTypes = ['.xlsx', '.xls', '.csv'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExt || !validTypes.includes(`.${fileExt}`)) {
        alert('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv');
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;

    try {
      // Handle Excel serial number
      if (typeof value === 'number') {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const date = new Date(excelEpoch.getTime() + value * 86400000);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minute = String(date.getUTCMinutes()).padStart(2, '0');
        const second = String(date.getUTCSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      }

      const str = value.toString().trim();
      
      // Format: 28-Mar-2026 23:57:04
      const dateRegex = /(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{2}:\d{2}:\d{2})/;
      const match = str.match(dateRegex);
      if (match) {
        const day = match[1].padStart(2, '0');
        const monthName = match[2].toLowerCase();
        const year = match[3];
        const time = match[4];
        const month = monthMap[monthName] || '01';
        return `${year}-${month}-${day} ${time}`;
      }
      
      // Format: DD/MM/YYYY HH:MM:SS
      if (str.includes('/')) {
        const [datePart, timePart = '00:00:00'] = str.split(' ');
        const parts = datePart.split('/');
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        return `${year}-${month}-${day} ${timePart}`;
      }
      
      // Format: YYYY-MM-DD HH:MM:SS
      if (str.includes('-') && str[0] === '2') {
        const [datePart, timePart = '00:00:00'] = str.split(' ');
        return `${datePart} ${timePart}`;
      }
      
      return str;
    } catch (err) {
      console.error('Date parse error:', value, err);
      return null;
    }
  };

  // Fungsi untuk mendapatkan kolom dari header yang sudah diperbaiki
  const getColumnIndex = (headerRow: any[], searchTerms: string[]): number => {
    for (let i = 0; i < headerRow.length; i++) {
      const cell = headerRow[i];
      if (cell) {
        const cellStr = cell.toString().toLowerCase();
        for (const term of searchTerms) {
          if (cellStr.includes(term.toLowerCase())) {
            return i;
          }
        }
      }
    }
    return -1;
  };

  const processFile = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    setUploadProgress('Membaca file...');
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rows = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      }) as any[][];
      
      console.log('Total rows:', rows.length);
      console.log('First 5 rows:', rows.slice(0, 5));
      
      // Cari header row - biasanya di baris index 1 (setelah judul)
      let headerRow: any[] = [];
      let dataStartRow = 0;
      
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        const row = rows[i];
        if (row && row.length > 0) {
          const firstCell = row[0]?.toString().toLowerCase() || '';
          // Cek apakah ini baris header (berisi "no." atau "registration" atau "username")
          if (firstCell === 'no.' || firstCell === 'no' || 
              row.some(cell => cell && cell.toString().toLowerCase().includes('username')) ||
              row.some(cell => cell && cell.toString().toLowerCase().includes('registration'))) {
            headerRow = row;
            dataStartRow = i + 1;
            console.log('Header found at row:', i, headerRow);
            break;
          }
        }
      }
      
      // Jika tidak ketemu, coba gunakan baris 1 sebagai header
      if (headerRow.length === 0 && rows[1]) {
        headerRow = rows[1];
        dataStartRow = 2;
        console.log('Using row 1 as header');
      }
      
      if (headerRow.length === 0) {
        throw new Error('Header tidak ditemukan. Pastikan file memiliki kolom Username dan Registration.');
      }
      
      // Cari index kolom yang dibutuhkan
      const usernameIdx = getColumnIndex(headerRow, ['username']);
      const registrationIdx = getColumnIndex(headerRow, ['registration']);
      const fullNameIdx = getColumnIndex(headerRow, ['full name']);
      const accountTypeIdx = getColumnIndex(headerRow, ['account type']);
      const loyaltyLevelIdx = getColumnIndex(headerRow, ['loyalty level']);
      const statusIdx = getColumnIndex(headerRow, ['status']);
      
      console.log('Column indexes:', {
        usernameIdx, registrationIdx, fullNameIdx, accountTypeIdx, loyaltyLevelIdx, statusIdx
      });
      
      if (usernameIdx === -1) {
        throw new Error('Kolom Username tidak ditemukan di file');
      }
      
      if (registrationIdx === -1) {
        throw new Error('Kolom Registration tidak ditemukan di file');
      }
      
      setUploadProgress('Memvalidasi data...');
      
      const uploadId = crypto.randomUUID();
      const uploadDate = new Date().toISOString().split('T')[0];
      const website = selectedAsset !== 'all' ? assets.find(a => a.id === selectedAsset)?.asset_code : 'XLY';
      
      const playerDetails: any[] = [];
      let errorCount = 0;
      let firstRegistrationDate: string | null = null;
      
      const dataRows = rows.slice(dataStartRow);
      console.log(`Processing ${dataRows.length} data rows`);
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;
        
        const username = row[usernameIdx]?.toString().trim();
        if (!username) {
          errorCount++;
          continue;
        }
        
        // Ambil registration text dan ekstrak tanggal
        const registrationText = row[registrationIdx]?.toString() || '';
        let registrationDate: string | null = null;
        
        // Extract Registration Date from text: "Registration Date :28-Mar-2026 23:57:04"
        const dateMatch = registrationText.match(/Registration Date\s*:\s*(\d{1,2}-[A-Za-z]{3}-\d{4}\s+\d{2}:\d{2}:\d{2})/i);
        if (dateMatch && dateMatch[1]) {
          registrationDate = parseExcelDate(dateMatch[1]);
        }
        
        if (registrationDate && !firstRegistrationDate) {
          firstRegistrationDate = registrationDate;
        }
        
        // Ambil data lainnya
        const fullName = row[fullNameIdx]?.toString() || null;
        const accountType = row[accountTypeIdx]?.toString() || 'Live';
        const loyaltyLevel = row[loyaltyLevelIdx]?.toString() || 'Bronze';
        const status = row[statusIdx]?.toString() || 'Aktif';
        
        playerDetails.push({
          upload_id: uploadId,
          registration_date: registrationDate,
          no: i + 1,
          registration: registrationText,
          username: username,
          account_type: accountType,
          loyalty_level: loyaltyLevel,
          full_name: fullName,
          player_group: null,
          contact_info: null,
          status: status,
          last_login: null,
          referrer_type: null,
          referral_code: null,
          own_referral_code: null,
          source_information: null,
          maximum_transaction_pending: 1,
          last_deposit: null,
          current_loyalty_points: null,
          current_balance: 0,
          last_transfer_in: null,
          current_outstanding_bet: 0,
          file_name: selectedFile.name,
          website: website
        });
      }

      if (playerDetails.length === 0) {
        throw new Error('Tidak ada data valid yang bisa diupload');
      }

      const registrationMonth = firstRegistrationDate ? firstRegistrationDate.substring(0, 7) : uploadDate.substring(0, 7);
      
      setUploadProgress(`Menyimpan metadata upload...`);
      
      const { error: uploadError } = await supabase
        .from('player_uploads')
        .insert([{
          upload_id: uploadId,
          upload_date: uploadDate,
          registration_month: registrationMonth,
          file_name: selectedFile.name,
          total_rows: playerDetails.length,
          status: 'completed',
          website: website
        }]);

      if (uploadError) throw uploadError;

      // BATCH INSERT KE PLAYER_LISTING (PER 500)
      const BATCH_SIZE = 500;
      let successCount = 0;
      
      for (let i = 0; i < playerDetails.length; i += BATCH_SIZE) {
        const batch = playerDetails.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(playerDetails.length / BATCH_SIZE);
        
        setUploadProgress(`Menyimpan data: batch ${batchNum}/${totalBatches} (${batch.length} data)...`);
        
        const { error: listingError } = await supabase
          .from('player_listing')
          .insert(batch);
        
        if (listingError) throw listingError;
        
        successCount += batch.length;
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      alert(`✅ Berhasil! ${successCount} data player diupload (${errorCount} baris error/skip)\n📅 Bulan Registrasi: ${registrationMonth}`);
      setShowModal(false);
      setSelectedFile(null);
      fetchUploads();
      
    } catch (error: any) {
      console.error('Error detail:', error);
      alert('Gagal upload: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatPeriod = (minDate: string, maxDate: string) => {
    if (!minDate || !maxDate) return '-';
    const min = new Date(minDate);
    const max = new Date(maxDate);
    const format = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (minDate === maxDate) {
      return format(min);
    }
    return `${format(min)} s/d ${format(max)}`;
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-[#0B1A33] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-[#0B1A33] text-white">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/dashboard/data-raw" className="text-[#FFD700] hover:underline">
          ← BACK TO DATA RAW
        </Link>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-[#FFD700] text-[#0B1A33] px-6 py-2 rounded-lg font-bold hover:bg-[#FFD700]/80 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          UPLOAD EXCEL
        </button>
      </div>

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">PLAYER LISTING DATA RAW</h1>

      <div className="bg-[#1A2F4A] p-4 rounded-lg border border-[#FFD700]/30 mb-6 flex flex-wrap gap-4 items-center">
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[120px]"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {months.map(month => <option key={month} value={month}>{month}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[100px]"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {years.map(year => <option key={year} value={year}>{year}</option>)}
        </select>
        
        <select 
          className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-4 py-2 text-white min-w-[150px]"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
        >
          <option value="all">SEMUA WEBSITE</option>
          {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.asset_name}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#A7D8FF]">Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
              className="bg-[#0B1A33] border border-[#FFD700]/30 rounded-lg px-2 py-1 text-white text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="text-[#A7D8FF]">
            Total: <span className="text-[#FFD700] font-bold">{uploads.length}</span> file
          </div>
        </div>
      </div>

      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">No</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Asset</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Periode</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">New Regist</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Data</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map((item, index) => (
              <tr key={item.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                <td className="px-4 py-3">{indexOfFirstItem + index + 1}</td>
                <td className="px-4 py-3 text-[#A7D8FF]">{item.file_name}</td>
                <td className="px-4 py-3 text-[#FFD700]">{item.website || 'XLY'}</td>
                <td className="px-4 py-3">{formatPeriod(item.min_date, item.max_date)}</td>
                <td className="px-4 py-3">{item.active_players}</td>
                <td className="px-4 py-3">{item.total_rows} data</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data untuk periode ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-[#A7D8FF]">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, uploads.length)} of {uploads.length} files
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-[#0B1A33] border border-[#FFD700]/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFD700]/10"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === pageNum
                      ? 'bg-[#FFD700] text-[#0B1A33] border-[#FFD700]'
                      : 'bg-[#0B1A33] border-[#FFD700]/30 text-white hover:bg-[#FFD700]/10'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-[#0B1A33] border border-[#FFD700]/30 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#FFD700]/10"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#1A2F4A] rounded-lg p-6 max-w-md w-full border border-[#FFD700]/30">
            <h2 className="text-xl font-bold text-[#FFD700] mb-4">Upload File Player Listing</h2>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-all ${
                dragActive ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#FFD700]/30 hover:border-[#FFD700] hover:bg-[#FFD700]/5'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input 
                id="fileInput" 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                className="hidden" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile ? (
                <div className="text-green-400">
                  <p className="text-lg mb-2">✓ {selectedFile.name}</p>
                  <p className="text-sm text-[#A7D8FF]">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-2">📂</div>
                  <p className="text-[#FFD700] font-medium">Geser file ke sini</p>
                  <p className="text-sm text-[#A7D8FF] mt-2">atau klik untuk memilih</p>
                  <p className="text-xs text-gray-400 mt-4">Format: .xlsx, .xls, .csv</p>
                </>
              )}
            </div>

            {uploadProgress && (
              <div className="mb-4 text-sm text-[#A7D8FF] text-center">
                {uploadProgress}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => {
                  setShowModal(false);
                  setSelectedFile(null);
                  setUploadProgress('');
                }} 
                className="px-4 py-2 text-gray-400 hover:bg-[#0B1A33] rounded"
              >
                Batal
              </button>
              <button 
                onClick={processFile} 
                disabled={!selectedFile || uploading} 
                className="px-4 py-2 bg-[#FFD700] text-[#0B1A33] rounded font-bold hover:bg-[#FFD700]/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0B1A33] border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </span>
                ) : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}