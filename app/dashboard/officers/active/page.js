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
    // Filter by status
    if (filter !== 'ALL' && officer.status !== filter) return false;
    
    // Filter by search
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

  // Format date
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
    setOfficers(officers.map(o => 
      o.id === updatedOfficer.id ? updatedOfficer : o
    ));
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
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK
        </button>
        
        <h1 className="text-3xl font-bold text-black">ACTIVE OFFICERS</h1>
        <p className="text-gray-700 mt-2">Daftar officer aktif di GROUP-X</p>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-bold text-black mb-1">TOTAL</h3>
          <div className="text-3xl font-bold text-black">{stats.total}</div>
          <p className="text-xs text-gray-600">Active Officers</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-bold text-black mb-1">REGULAR</h3>
          <div className="text-3xl font-bold text-black">{stats.regular}</div>
          <p className="text-xs text-gray-600">Full Status</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-bold text-black mb-1">TRAINING</h3>
          <div className="text-3xl font-bold text-black">{stats.training}</div>
          <p className="text-xs text-gray-600">In Training</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-bold text-black mb-1">RESIGN</h3>
          <div className="text-3xl font-bold text-black">{stats.resign}</div>
          <p className="text-xs text-gray-600">Total Resign</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-bold text-black mb-1">TERMINATED</h3>
          <div className="text-3xl font-bold text-black">{stats.terminate}</div>
          <p className="text-xs text-gray-600">Total Terminated</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-sm font-bold text-black mb-1">CHANGE GROUP</h3>
          <div className="text-3xl font-bold text-black">{stats.changeGroup}</div>
          <p className="text-xs text-gray-600">Total Change Group</p>
        </div>
      </div>

      {/* FILTER & SEARCH SECTION */}
      <div className="mb-8 p-4 border border-gray-300 rounded-lg bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div>
                <span className="font-bold text-black mr-2">Status:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 rounded font-medium ${
                      filter === 'ALL' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    ALL ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('REGULAR')}
                    className={`px-4 py-2 rounded font-medium ${
                      filter === 'REGULAR' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    REGULAR ({stats.regular})
                  </button>
                  <button
                    onClick={() => setFilter('TRAINING')}
                    className={`px-4 py-2 rounded font-medium ${
                      filter === 'TRAINING' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    TRAINING ({stats.training})
                  </button>
                  <button
                    onClick={() => setFilter('RESIGN')}
                    className={`px-4 py-2 rounded font-medium ${
                      filter === 'RESIGN' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    RESIGN ({stats.resign})
                  </button>
                  <button
                    onClick={() => setFilter('TERMINATE')}
                    className={`px-4 py-2 rounded font-medium ${
                      filter === 'TERMINATE' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    TERMINATE ({stats.terminate})
                  </button>
                  <button
                    onClick={() => setFilter('CHANGE GROUP')}
                    className={`px-4 py-2 rounded font-medium ${
                      filter === 'CHANGE GROUP' 
                        ? 'bg-black text-white' 
                        : 'bg-gray-200 text-black hover:bg-gray-300'
                    }`}
                  >
                    CHANGE GROUP ({stats.changeGroup})
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, ID, department, role, panel ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-gray-400 rounded pl-10 pr-4 py-2 text-black bg-white font-medium"
                  />
                  <svg 
                    className="w-5 h-5 absolute left-3 top-2.5 text-gray-600"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
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
              className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-6 py-2.5 rounded"
            >
              <span className="text-xl">+</span>
              ADD OFFICER
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

      {/* OFFICERS LIST */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        {/* Table Header */}
        <div className="bg-gray-100 grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-300 font-bold text-black text-sm">
          <div className="col-span-1">#</div>
          <div className="col-span-2">FULL NAME & EMAIL</div>
          <div className="col-span-1">DEPARTMENT</div>
          <div className="col-span-1">ROLE</div>
          <div className="col-span-1">STATUS</div>
          <div className="col-span-1">ID PANEL</div>
          <div className="col-span-1">JOIN DATE</div>
          <div className="col-span-1">NATIONALITY</div>
          <div className="col-span-1">GENDER</div>
          <div className="col-span-1">PHONE/TELE</div>
          <div className="col-span-1">ROOM</div>
          <div className="col-span-1">ACTION</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredOfficers.length > 0 ? (
            filteredOfficers.map((officer, index) => (
              <div 
                key={officer.id} 
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 text-sm text-black"
              >
                <div className="col-span-1 text-black font-medium">{index + 1}</div>
                
                <div className="col-span-2">
                  <div className="font-bold text-black">{officer.full_name || '-'}</div>
                  <div className="text-xs text-gray-700 truncate">{officer.email || '-'}</div>
                </div>
                
                <div className="col-span-1 text-black truncate font-medium">{officer.department || '-'}</div>
                
                <div className="col-span-1 text-black truncate font-medium">{officer.role || '-'}</div>
                
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${
                    officer.status === 'REGULAR' ? 'bg-green-200 text-black' :
                    officer.status === 'TRAINING' ? 'bg-yellow-200 text-black' :
                    officer.status === 'RESIGN' ? 'bg-red-200 text-black' :
                    officer.status === 'TERMINATE' ? 'bg-red-300 text-black' :
                    officer.status === 'CHANGE GROUP' ? 'bg-purple-200 text-black' :
                    'bg-gray-200 text-black'
                  }`}>
                    {officer.status || '-'}
                  </span>
                </div>
                
                <div className="col-span-1 text-black font-mono font-medium">{officer.panel_id || '-'}</div>
                
                <div className="col-span-1 text-black font-medium">{formatDate(officer.join_date)}</div>
                
                <div className="col-span-1 text-black font-medium">{officer.nationality || '-'}</div>
                
                <div className="col-span-1 text-black font-medium">{officer.gender || '-'}</div>
                
                {/* PHONE & TELEGRAM - DIGABUNG */}
                <div className="col-span-1">
                  <div className="flex flex-col">
                    {officer.phone ? (
                      <div className="flex items-center gap-1 text-black font-medium">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span className="text-xs">{officer.phone}</span>
                      </div>
                    ) : null}
                    
                    {officer.telegram_id ? (
                      <div className="flex items-center gap-1 text-black font-medium mt-1">
                        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        <span className="text-xs">@{officer.telegram_id.replace('@', '')}</span>
                      </div>
                    ) : null}
                    
                    {!officer.phone && !officer.telegram_id && (
                      <span className="text-xs text-gray-500 italic">-</span>
                    )}
                  </div>
                </div>
                
                {/* ROOM */}
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    officer.room === 'UNMESS' 
                      ? 'bg-gray-200 text-black' 
                      : 'bg-blue-100 text-black'
                  }`}>
                    {officer.room || '-'}
                  </span>
                </div>
                
                {/* ACTION */}
                <div className="col-span-1">
                  <button
                    onClick={(e) => handleEditClick(officer, e)}
                    className="text-black hover:text-gray-700 font-bold text-xs flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
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
              <Link
                href="/dashboard/officers/add"
                className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded"
              >
                <span className="text-xl">+</span>
                ADD FIRST OFFICER
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SUMMARY FOOTER */}
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