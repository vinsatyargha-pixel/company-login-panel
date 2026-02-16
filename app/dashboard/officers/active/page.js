'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditOfficerModal from '@/components/EditOfficerModal';

export default function ActiveOfficersPage() {
  const router = useRouter();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error('Error fetching officers:', error);
      showNotification('error', 'Gagal memuat data officer');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filter officers by status and search
  const filteredOfficers = officers.filter(officer => {
    if (filter !== 'ALL' && officer.status !== filter) return false;
    
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      return (
        (officer.full_name?.toLowerCase() || '').includes(searchLower) ||
        (officer.email?.toLowerCase() || '').includes(searchLower) ||
        (officer.employee_id?.toLowerCase() || '').includes(searchLower) ||
        (officer.department?.toLowerCase() || '').includes(searchLower) ||
        (officer.role?.toLowerCase() || '').includes(searchLower) ||
        (officer.panel_id?.toLowerCase() || '').includes(searchLower)
      );
    }
    return true;
  });

  // Calculate statistics
  const stats = {
    total: officers.length,
    regular: officers.filter(o => o.status === 'REGULAR').length,
    training: officers.filter(o => o.status === 'TRAINING').length,
    resign: officers.filter(o => o.status === 'RESIGN').length,
    terminate: officers.filter(o => o.status === 'TERMINATE').length,
    changeGroup: officers.filter(o => o.status === 'CHANGE GROUP').length
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleEditClick = (officer, e) => {
    e.stopPropagation();
    setSelectedOfficer(officer);
    setShowEditModal(true);
  };

  const handleOfficerUpdated = (updatedOfficer) => {
    setOfficers(officers.map(o => o.id === updatedOfficer.id ? updatedOfficer : o));
    setShowEditModal(false);
    showNotification('success', 'Data officer berhasil diupdate');
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black font-medium">Loading officers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white">
      {/* NOTIFICATION */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between border ${
          notification.type === 'success' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {notification.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className={`font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {notification.message}
            </span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-600 hover:text-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="flex items-center text-blue-600 hover:text-blue-800 mb-4 font-medium">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK
        </button>
        <h1 className="text-3xl font-bold text-black">ACTIVE OFFICERS</h1>
        <p className="text-gray-700 mt-2">Daftar officer aktif di GROUP-X</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        {/* TOTAL */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">TOTAL</h3>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-blue-700 mt-2">{stats.total}</div>
          <p className="text-xs text-blue-600 font-medium mt-1">Active Officers</p>
        </div>

        {/* REGULAR */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider">REGULAR</h3>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-green-700 mt-2">{stats.regular}</div>
          <p className="text-xs text-green-600 font-medium mt-1">Full Status</p>
        </div>

        {/* TRAINING */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-yellow-800 uppercase tracking-wider">TRAINING</h3>
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-yellow-700 mt-2">{stats.training}</div>
          <p className="text-xs text-yellow-600 font-medium mt-1">In Training</p>
        </div>

        {/* RESIGN */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-red-800 uppercase tracking-wider">RESIGN</h3>
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-red-700 mt-2">{stats.resign}</div>
          <p className="text-xs text-red-600 font-medium mt-1">Total Resign</p>
        </div>

        {/* TERMINATED */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-rose-800 uppercase tracking-wider">TERMINATED</h3>
          <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-rose-700 mt-2">{stats.terminate}</div>
          <p className="text-xs text-rose-600 font-medium mt-1">Total Terminated</p>
        </div>

        {/* CHANGE GROUP */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">CHANGE GROUP</h3>
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-purple-700 mt-2">{stats.changeGroup}</div>
          <p className="text-xs text-purple-600 font-medium mt-1">Total Change Group</p>
        </div>
      </div>

      {/* FILTER & SEARCH SECTION */}
      <div className="mb-8 p-4 border border-gray-300 rounded-lg bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left side - Status filters and search */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div>
                <span className="font-bold text-gray-700 mr-3">Status:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'ALL' ? 'bg-gray-800 text-white shadow-md ring-2 ring-gray-300 ring-offset-1' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'}`}>ALL ({stats.total})</button>
                  <button onClick={() => setFilter('REGULAR')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'REGULAR' ? 'bg-green-600 text-white shadow-md ring-2 ring-green-300 ring-offset-1' : 'bg-green-50 text-green-700 hover:bg-green-100 hover:shadow'}`}>REGULAR ({stats.regular})</button>
                  <button onClick={() => setFilter('TRAINING')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'TRAINING' ? 'bg-yellow-500 text-white shadow-md ring-2 ring-yellow-300 ring-offset-1' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:shadow'}`}>TRAINING ({stats.training})</button>
                  <button onClick={() => setFilter('RESIGN')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'RESIGN' ? 'bg-red-600 text-white shadow-md ring-2 ring-red-300 ring-offset-1' : 'bg-red-50 text-red-700 hover:bg-red-100 hover:shadow'}`}>RESIGN ({stats.resign})</button>
                  <button onClick={() => setFilter('TERMINATE')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'TERMINATE' ? 'bg-rose-700 text-white shadow-md ring-2 ring-rose-300 ring-offset-1' : 'bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow'}`}>TERMINATE ({stats.terminate})</button>
                  <button onClick={() => setFilter('CHANGE GROUP')} className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'CHANGE GROUP' ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300 ring-offset-1' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 hover:shadow'}`}>CHANGE GROUP ({stats.changeGroup})</button>
                </div>
              </div>

              {/* Search Box */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 Search by name, email, ID, department, role, panel ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                  <svg className="w-5 h-5 absolute left-4 top-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Add Officer Button */}
          <div>
            <Link
              href="/dashboard/officers/add"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span>ADD OFFICER</span>
              <span className="text-xl">+</span>
            </Link>
          </div>
        </div>
      </div>

      {/* LISTING NAME */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black mb-4">LISTING NAME</h2>
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
          <div className="flex items-center gap-2 text-black font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Total Listing: {filteredOfficers.length} officers</span>
          </div>
        </div>
      </div>

      {/* OFFICERS TABLE */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Table Header */}
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-300 font-bold text-gray-700 text-sm">
          <div className="col-span-1 flex items-center gap-1">#</div>
          <div className="col-span-2 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            NAME & EMAIL
          </div>
          <div className="col-span-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            DEPT
          </div>
          <div className="col-span-1">ROLE</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1">ID PANEL</div>
          <div className="col-span-1">JOIN DATE</div>
          <div className="col-span-1">NATION</div>
          <div className="col-span-1">GENDER</div>
          <div className="col-span-1">PHONE/TELE</div>
          <div className="col-span-1">ROOM</div>
          <div className="col-span-1">ACTION</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredOfficers.length > 0 ? (
            filteredOfficers.map((officer, index) => (
              <div key={officer.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-black">
                <div className="col-span-1 text-black font-medium">{index + 1}</div>
                
                <div className="col-span-2">
                  <div className="font-bold text-black">{officer.full_name || '-'}</div>
                  <div className="text-xs text-gray-700 truncate">{officer.email || '-'}</div>
                </div>
                
                <div className="col-span-1 text-black truncate font-medium">{officer.department || '-'}</div>
                <div className="col-span-1 text-black truncate font-medium">{officer.role || '-'}</div>
                
                {/* Status Badge */}
                <div className="col-span-1">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1 shadow-sm ${
                    officer.status === 'REGULAR' ? 'bg-green-100 text-green-800 border border-green-300' :
                    officer.status === 'TRAINING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                    officer.status === 'RESIGN' ? 'bg-red-100 text-red-800 border border-red-300' :
                    officer.status === 'TERMINATE' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                    officer.status === 'CHANGE GROUP' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                    'bg-gray-100 text-gray-800 border border-gray-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      officer.status === 'REGULAR' ? 'bg-green-500' :
                      officer.status === 'TRAINING' ? 'bg-yellow-500' :
                      officer.status === 'RESIGN' ? 'bg-red-500' :
                      officer.status === 'TERMINATE' ? 'bg-rose-500' :
                      officer.status === 'CHANGE GROUP' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}></span>
                    {officer.status || '-'}
                  </span>
                </div>
                
                <div className="col-span-1 text-black font-mono font-medium">{officer.panel_id || '-'}</div>
                <div className="col-span-1 text-black font-medium">{formatDate(officer.join_date)}</div>
                <div className="col-span-1 text-black font-medium">{officer.nationality || '-'}</div>
                <div className="col-span-1 text-black font-medium">{officer.gender || '-'}</div>
                
                {/* Phone & Telegram */}
                <div className="col-span-1">
                  <div className="flex flex-col">
                    {officer.phone && (
                      <div className="flex items-center gap-1 text-black font-medium">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs">{officer.phone}</span>
                      </div>
                    )}
                    {officer.telegram_id && (
                      <div className="flex items-center gap-1 text-black font-medium mt-1">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span className="text-xs">@{officer.telegram_id.replace('@', '')}</span>
                      </div>
                    )}
                    {!officer.phone && !officer.telegram_id && (
                      <span className="text-xs text-gray-500 italic">-</span>
                    )}
                  </div>
                </div>
                
                {/* Room */}
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                    officer.room === 'UNMESS' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {officer.room === 'UNMESS' ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        UNMESS
                      </>
                    ) : officer.room ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {officer.room}
                      </>
                    ) : '-'}
                  </span>
                </div>
                
                {/* Action Button */}
                <div className="col-span-1">
                  <button
                    onClick={(e) => handleEditClick(officer, e)}
                    className="text-white bg-blue-600 hover:bg-blue-700 font-medium text-xs py-2 px-3 rounded-lg flex items-center gap-1.5 shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    EDIT
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 border-2 border-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.623a9.953 9.953 0 01-6.67 2.574 9.953 9.953 0 01-6.67-2.574" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">NO OFFICERS FOUND</h3>
              <p className="text-gray-700 mb-6 font-medium">
                {search ? 'Try different search terms' : 'Add your first officer'}
              </p>
              <Link href="/dashboard/officers/add" className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded">
                <span className="text-xl">+</span>
                ADD FIRST OFFICER
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="text-black font-medium">
            <span className="font-bold">Showing:</span>
            <span className="ml-2 text-black">{filteredOfficers.length}</span>
            <span className="text-gray-700"> of {stats.total} officers</span>
          </div>
          <div className="text-sm text-gray-700 font-medium">
            Last updated: {new Date().toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showEditModal && selectedOfficer && (
        <EditOfficerModal
          officer={selectedOfficer}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleOfficerUpdated}
        />
      )}
    </div>
  );
}