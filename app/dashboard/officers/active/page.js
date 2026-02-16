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
      <div className="p-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black">Loading officers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white">
      {/* NOTIFICATION */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
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
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
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

      {/* STATS OVERVIEW - UPDATED */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">TOTAL</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <p className="text-sm text-gray-600">Active Officers (Regular + Training)</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">REGULAR</h3>
          <div className="text-3xl font-bold text-green-600">{stats.regular}</div>
          <p className="text-sm text-gray-600">Total Officer Regular</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">TRAINING</h3>
          <div className="text-3xl font-bold text-yellow-600">{stats.training}</div>
          <p className="text-sm text-gray-600">Total Officer Training</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">RESIGN</h3>
          <div className="text-3xl font-bold text-red-600">{stats.resign}</div>
          <p className="text-sm text-gray-600">Total Officer Resign</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">TERMINATED</h3>
          <div className="text-3xl font-bold text-red-800">{stats.terminate}</div>
          <p className="text-sm text-gray-600">Total Officer Terminated</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">CHANGE GROUP</h3>
          <div className="text-3xl font-bold text-purple-600">{stats.changeGroup}</div>
          <p className="text-sm text-gray-600">Total Officer Change Group</p>
        </div>
      </div>

      {/* FILTER & SEARCH SECTION */}
      <div className="mb-8 p-4 border border-gray-300 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter - UPDATED */}
              <div>
                <span className="font-medium text-black mr-2">Status:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  <button
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 rounded ${filter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    ALL ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilter('REGULAR')}
                    className={`px-4 py-2 rounded ${filter === 'REGULAR' ? 'bg-green-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    REGULAR ({stats.regular})
                  </button>
                  <button
                    onClick={() => setFilter('TRAINING')}
                    className={`px-4 py-2 rounded ${filter === 'TRAINING' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    TRAINING ({stats.training})
                  </button>
                  <button
                    onClick={() => setFilter('RESIGN')}
                    className={`px-4 py-2 rounded ${filter === 'RESIGN' ? 'bg-red-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    RESIGN ({stats.resign})
                  </button>
                  <button
                    onClick={() => setFilter('TERMINATE')}
                    className={`px-4 py-2 rounded ${filter === 'TERMINATE' ? 'bg-red-800 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
                  >
                    TERMINATE ({stats.terminate})
                  </button>
                  <button
                    onClick={() => setFilter('CHANGE GROUP')}
                    className={`px-4 py-2 rounded ${filter === 'CHANGE GROUP' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
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
                    className="w-full border border-gray-400 rounded pl-10 pr-4 py-2 text-black bg-white"
                  />
                  <svg 
                    className="w-5 h-5 absolute left-3 top-2.5 text-gray-400"
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
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded"
            >
              <span className="text-xl">+</span>
              ADD OFFICER
            </Link>
          </div>
        </div>
      </div>

      {/* LISTING NAME (replaces BY DEPARTMENT) */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-black mb-4">LISTING NAME</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Total Listing: {filteredOfficers.length} officers</span>
          </div>
        </div>
      </div>

      {/* OFFICERS LIST - COMPLETE TABLE */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
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
          <div className="col-span-1">PHONE</div>
          <div className="col-span-1">ROOM</div>
          <div className="col-span-1">ACTION</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredOfficers.length > 0 ? (
            filteredOfficers.map((officer, index) => (
              <div 
                key={officer.id} 
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 text-sm"
              >
                <div className="col-span-1 text-gray-700">{index + 1}</div>
                
                <div className="col-span-2">
                  <div className="font-medium text-black">{officer.full_name || '-'}</div>
                  <div className="text-xs text-gray-600 truncate">{officer.email || '-'}</div>
                </div>
                
                <div className="col-span-1 truncate">{officer.department || '-'}</div>
                
                <div className="col-span-1 truncate">{officer.role || '-'}</div>
                
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold inline-block ${
                    officer.status === 'REGULAR' ? 'bg-green-100 text-green-800' :
                    officer.status === 'TRAINING' ? 'bg-yellow-100 text-yellow-800' :
                    officer.status === 'RESIGN' ? 'bg-red-100 text-red-800' :
                    officer.status === 'TERMINATE' ? 'bg-red-200 text-red-900' :
                    officer.status === 'CHANGE GROUP' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {officer.status || '-'}
                  </span>
                </div>
                
                <div className="col-span-1 font-mono">{officer.panel_id || '-'}</div>
                
                <div className="col-span-1">{formatDate(officer.join_date)}</div>
                
                <div className="col-span-1">{officer.nationality || '-'}</div>
                
                <div className="col-span-1">{officer.gender || '-'}</div>
                
                <div className="col-span-1 truncate">{officer.phone || '-'}</div>
                
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded text-xs font-mono ${
                    officer.room === 'UNMESS' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {officer.room || '-'}
                  </span>
                </div>
                
                <div className="col-span-1">
                  <button
                    onClick={(e) => handleEditClick(officer, e)}
                    className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center gap-1"
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
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.623a9.953 9.953 0 01-6.67 2.574 9.953 9.953 0 01-6.67-2.574" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-black mb-2">NO OFFICERS FOUND</h3>
              <p className="text-gray-700 mb-6">
                {search ? 'Try different search terms' : 'Add your first officer'}
              </p>
              <Link
                href="/dashboard/officers/add"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded"
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
          <div>
            <span className="font-bold text-black">Showing:</span>
            <span className="ml-2 text-blue-600">{filteredOfficers.length}</span>
            <span className="text-gray-700"> of {stats.total} officers</span>
          </div>
          <div className="text-sm text-gray-600">
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