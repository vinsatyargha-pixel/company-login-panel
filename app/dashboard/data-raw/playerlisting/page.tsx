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
  registration_month: string;
  file_name: string;
  total_rows: number;
  status: string;
  website?: string;
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

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const years = ['2025', '2026', '2027'];

  // ========== MAP BULAN INGGRIS KE ANGKA ==========
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

      console.log(`📅 Filter: ${startDate} → ${endDate}`);

      // ========== STEP 1: AMBIL UPLOAD_ID DARI PLAYER_LISTING ==========
      let query = supabase
        .from('player_listing')
        .select('upload_id')
        .gte('registration_date', startDate)
        .lte('registration_date', endDate);

      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset);
        if (asset) {
          query = query.eq('website', asset.asset_code);
        }
      }

      const { data: listings, error: listingsError } = await query;
      
      if (listingsError) {
        console.error('❌ Error fetching listings:', listingsError);
        throw listingsError;
      }

      console.log(`📊 Found ${listings?.length || 0} player records`);

      if (!listings || listings.length === 0) {
        setUploads([]);
        setLoading(false);
        return;
      }

      // ========== STEP 2: AMBIL UPLOAD_ID UNIK ==========
      const uniqueUploadIds = [...new Set(listings.map(l => l.upload_id))];
      console.log(`📁 Unique upload_ids: ${uniqueUploadIds.length}`);

      // ========== STEP 3: AMBIL DATA DARI PLAYER_UPLOADS ==========
      let uploadsQuery = supabase
        .from('player_uploads')
        .select('*')
        .in('upload_id', uniqueUploadIds);

      if (selectedAsset !== 'all') {
        const asset = assets.find(a => a.id === selectedAsset);
        if (asset) {
          uploadsQuery = uploadsQuery.eq('website', asset.asset_code);
        }
      }

      const { data: uploadsData, error: uploadsError } = await uploadsQuery;
      if (uploadsError) throw uploadsError;

      console.log(`📊 Uploads data: ${uploadsData?.length || 0}`);

      // ========== STEP 4: HITUNG TOTAL ROWS PER UPLOAD ==========
      const countMap = new Map<string, number>();
      listings.forEach(l => {
        countMap.set(l.upload_id, (countMap.get(l.upload_id) || 0) + 1);
      });

      // ========== STEP 5: GABUNGKAN ==========
      const result = uploadsData?.map(upload => ({
        ...upload,
        total_rows: countMap.get(upload.upload_id) || 0
      })) || [];

      console.log(`✅ Final result: ${result.length} uploads`);
      setUploads(result);
      
    } catch (error) {
      console.error('❌ Error fetching uploads:', error);
    } finally {
      setLoading(false);
    }
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

  // ========== FUNGSI PARSING TANGGAL LENGKAP ==========
  const parseExcelDate = (value: any): string | null => {
    if (!value) return null;

    try {
      // 1. Excel Serial Number (angka)
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
      
      // 2. Format "31-Jan-2026 21:45:55" atau "31 Jan 2026 21:45:55"
      const regMon = /^(\d{1,2})[- ]([A-Za-z]+)[- ](\d{4})(?:\s+(\d{2}:\d{2}:\d{2}))?$/;
      const matchMon = str.match(regMon);
      if (matchMon) {
        const day = matchMon[1].padStart(2, '0');
        let monthName = matchMon[2].toLowerCase();
        if (monthName.length > 3) {
          monthName = monthName.substring(0, 3);
        }
        const year = matchMon[3];
        const time = matchMon[4] || '00:00:00';
        const month = monthMap[monthName] || '01';
        return `${year}-${month}-${day} ${time}`;
      }
      
      // 3. Format "31/01/2026" atau "31/01/2026 21:45:55"
      if (str.includes('/')) {
        const [datePart, timePart = '00:00:00'] = str.split(' ');
        const parts = datePart.split('/');
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (parseInt(month) > 12 && parseInt(day) <= 12) {
          [day, month] = [month, day];
        }
        return `${year}-${month}-${day} ${timePart}`;
      }
      
      // 4. Format "2026-01-31" atau "2026-01-31 21:45:55"
      if (str.includes('-')) {
        const [datePart, timePart = '00:00:00'] = str.split(' ');
        const parts = datePart.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[0]}-${parts[1]}-${parts[2]} ${timePart}`;
        }
      }
      
      return str;
    } catch (err) {
      console.error('Date parse error:', value, err);
      return null;
    }
  };

  const parseCurrency = (value: any): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    const str = value.toString().replace(/[^0-9.-]/g, '');
    return parseFloat(str) || 0;
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
      
      // SKIP BARIS PERTAMA (JUDUL)
      const headerRow = rows[1];
      const dataRows = rows.slice(2);
      
      const findIndex = (keyword: string) => {
        return headerRow.findIndex((h: string) => 
          h && h.toString().toLowerCase().includes(keyword.toLowerCase())
        );
      };
      
      const idx = {
        no: findIndex('no'),
        registration: findIndex('registration'),
        username: findIndex('username'),
        account_type: findIndex('account type'),
        loyalty_level: findIndex('loyalty level'),
        full_name: findIndex('full name'),
        player_group: findIndex('player group'),
        contact_info: findIndex('contact info'),
        status: findIndex('status'),
        last_login: findIndex('last login'),
        referrer_type: findIndex('referrer type'),
        referral_code: findIndex('referral code'),
        own_referral_code: findIndex('own referral code'),
        source_information: findIndex('source information'),
        maximum_transaction_pending: findIndex('maximum transaction pending'),
        last_deposit: findIndex('last deposit'),
        current_loyalty_points: findIndex('current loyalty points'),
        current_balance: findIndex('current balance'),
        last_transfer_in: findIndex('last transfer in'),
        current_outstanding_bet: findIndex('current outstanding bet')
      };
      
      if (idx.username === -1) {
        throw new Error('Kolom Username tidak ditemukan');
      }
      
      setUploadProgress('Memvalidasi data...');
      
      const uploadId = crypto.randomUUID();
      const uploadDate = new Date().toISOString().split('T')[0];
      const website = selectedAsset !== 'all' ? assets.find(a => a.id === selectedAsset)?.asset_code : 'XLY';
      
      const playerDetails: any[] = [];
      let errorCount = 0;
      let firstRegistrationDate: string | null = null;
      
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;
        
        const username = row[idx.username];
        if (!username) {
          errorCount++;
          continue;
        }
        
        const registration = row[idx.registration] || '';
        let registrationDate = null;
        
        const regMatch = registration.match(/Registration Date\s*:\s*([0-9]{1,2}[- ][A-Za-z]+[- ][0-9]{4}\s[0-9]{2}:[0-9]{2}:[0-9]{2})/i);
        if (regMatch) {
          registrationDate = parseExcelDate(regMatch[1]);
        }
        
        if (registrationDate && !firstRegistrationDate) {
          firstRegistrationDate = registrationDate;
        }
        
        playerDetails.push({
          upload_id: uploadId,
          registration_date: registrationDate,
          no: parseInt(row[idx.no]) || i + 1,
          registration: registration,
          username: username,
          account_type: row[idx.account_type] || null,
          loyalty_level: row[idx.loyalty_level] || null,
          full_name: row[idx.full_name] || null,
          player_group: row[idx.player_group] || null,
          contact_info: row[idx.contact_info] || null,
          status: row[idx.status] || null,
          last_login: row[idx.last_login] || null,
          referrer_type: row[idx.referrer_type] || null,
          referral_code: row[idx.referral_code] || null,
          own_referral_code: row[idx.own_referral_code] || null,
          source_information: row[idx.source_information] || null,
          maximum_transaction_pending: parseInt(row[idx.maximum_transaction_pending]) || 0,
          last_deposit: row[idx.last_deposit] || null,
          current_loyalty_points: row[idx.current_loyalty_points] || null,
          current_balance: parseCurrency(row[idx.current_balance]),
          last_transfer_in: row[idx.last_transfer_in] || null,
          current_outstanding_bet: parseCurrency(row[idx.current_outstanding_bet]),
          file_name: selectedFile.name,
          website: website
        });
      }

      if (playerDetails.length === 0) throw new Error('Tidak ada data valid');

      setUploadProgress(`Menyimpan ${playerDetails.length} data...`);
      
      const registrationMonth = firstRegistrationDate ? firstRegistrationDate.substring(0, 7) : uploadDate.substring(0, 7);
      
      // 1. INSERT KE PLAYER_UPLOADS
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

      // 2. INSERT KE PLAYER_LISTING
      const { error: listingError } = await supabase
        .from('player_listing')
        .insert(playerDetails);

      if (listingError) throw listingError;

      alert(`✅ Berhasil! ${playerDetails.length} data player diupload (${errorCount} baris error/skip)\n📅 Bulan Registrasi: ${registrationMonth}`);
      setShowModal(false);
      setSelectedFile(null);
      fetchUploads();
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert('❌ Gagal: ' + error.message);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

      <h1 className="text-3xl font-bold text-[#FFD700] mb-6">👥 PLAYER LISTING DATA RAW</h1>

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

        <div className="ml-auto text-[#A7D8FF]">
          Total: <span className="text-[#FFD700] font-bold">{uploads.length}</span> file
        </div>
      </div>

      <div className="bg-[#1A2F4A] rounded-lg border border-[#FFD700]/30 overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#0B1A33] border-b border-[#FFD700]/30">
            <tr>
              <th className="px-4 py-3 text-left text-[#FFD700]">Tanggal Upload</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Bulan Registrasi</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Website</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">File Name</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Jumlah Player</th>
              <th className="px-4 py-3 text-left text-[#FFD700]">Status</th>
            </tr>
          </thead>
          <tbody>
            {uploads.length > 0 ? uploads.map((item) => (
              <tr key={item.id} className="border-b border-[#FFD700]/10 hover:bg-[#0B1A33]/50">
                <td className="px-4 py-3">{formatDate(item.upload_date)}</td>
                <td className="px-4 py-3 text-[#FFD700]">{item.registration_month}</td>
                <td className="px-4 py-3 text-[#FFD700]">{item.website || 'XLY'}</td>
                <td className="px-4 py-3 text-[#A7D8FF]">{item.file_name}</td>
                <td className="px-4 py-3">{item.total_rows} player</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Tidak ada data untuk periode ini
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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