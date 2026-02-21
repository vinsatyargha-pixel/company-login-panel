'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EditOfficerModal from '@/components/EditOfficerModal';
import { useAuth } from '@/hooks/useAuth';

export default function ActiveOfficersPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState(null);
  const [notification, setNotification] = useState(null);
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Ambil admin ID berdasarkan user email
  useEffect(() => {
    if (user?.email) {
      const getAdminId = async () => {
        const { data } = await supabase
          .from('officers')
          .select('id')
          .ilike('email', user.email)
          .maybeSingle();
        
        if (data) {
          setAdminId(data.id);
        }
      };
      getAdminId();
    }
  }, [user]);

  useEffect(() => {
    if (mounted && !authLoading) {
      fetchOfficers();
    }
  }, [mounted, authLoading]);

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

  const filteredOfficers = officers.filter(officer => {
    if (filter !== 'ALL' && officer.status !== filter) return false;
    
    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      return (
        (officer.full_name?.toLowerCase() || '').includes(searchLower) ||
        (officer.email?.toLowerCase() || '').includes(searchLower) ||
        (officer.employee_id?.toLowerCase() || '').includes(searchLower) ||
        (officer.department?.toLowerCase() || '').includes(searchLower) ||
        (officer.panel_id?.toLowerCase() || '').includes(searchLower)
      );
    }
    return true;
  });

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
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAdmin) {
      showNotification('error', 'You do not have permission to edit officers');
      return;
    }
    
    setSelectedOfficer(officer);
    setShowEditModal(true);
  };

  const handleOfficerUpdated = async (updatedOfficer) => {
  try {
    // 1. Cari data lama sebelum diupdate
    const oldOfficer = officers.find(o => o.id === updatedOfficer.id);
    
    // 2. Update state
    setOfficers(officers.map(o => o.id === updatedOfficer.id ? updatedOfficer : o));
    
    // 3. Simpan ke audit logs dengan old_data
    if (adminId) {
      await supabase
        .from('audit_logs')
        .insert({
          table_name: 'officers',
          record_id: updatedOfficer.id,
          action: 'UPDATE',
          old_data: oldOfficer,     // <-- INI PENTING!
          new_data: updatedOfficer,
          changed_by: adminId,
          changed_at: new Date().toISOString()
        });
    }
    
    setShowEditModal(false);
    showNotification('success', 'Data officer berhasil diupdate');
    
  } catch (error) {
    console.error('Error in handleOfficerUpdated:', error);
    showNotification('error', 'Gagal mengupdate data officer');
  }
};

  if (!mounted || authLoading || loading) {
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen bg-white">
      {/* NOTIFICATION */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between border ${
          notification.type === 'success' ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${notification.type === 'success' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {notification.type === 'success' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className={`font-medium text-sm ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {notification.message}
            </span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gray-600 hover:text-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-3 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          BACK TO DASHBOARD
        </Link>
        
        <h1 className="text-2xl font-bold text-black">LIST OFFICERS GROUP-X</h1>
        <p className="text-gray-600 text-sm mt-1">Daftar officer di GROUP-X</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          <div className="text-xs font-bold text-blue-800">TOTAL</div>
          <div className="text-lg font-bold text-blue-700">{stats.total}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded p-2">
          <div className="text-xs font-bold text-green-800">REGULAR</div>
          <div className="text-lg font-bold text-green-700">{stats.regular}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
          <div className="text-xs font-bold text-yellow-800">TRAINING</div>
          <div className="text-lg font-bold text-yellow-700">{stats.training}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded p-2">
          <div className="text-xs font-bold text-red-800">RESIGN</div>
          <div className="text-lg font-bold text-red-700">{stats.resign}</div>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded p-2">
          <div className="text-xs font-bold text-rose-800">TERMINATED</div>
          <div className="text-lg font-bold text-rose-700">{stats.terminate}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded p-2">
          <div className="text-xs font-bold text-purple-800">CHANGE GROUP</div>
          <div className="text-lg font-bold text-purple-700">{stats.changeGroup}</div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="mb-4 p-3 border border-gray-300 rounded-lg bg-white">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <span className="font-bold text-black mr-1">Status:</span>
            <button onClick={() => setFilter('ALL')} className={`px-2 py-1 rounded ${filter === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}`}>ALL ({stats.total})</button>
            <button onClick={() => setFilter('REGULAR')} className={`px-2 py-1 rounded ${filter === 'REGULAR' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}>REGULAR ({stats.regular})</button>
            <button onClick={() => setFilter('TRAINING')} className={`px-2 py-1 rounded ${filter === 'TRAINING' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'}`}>TRAINING ({stats.training})</button>
            <button onClick={() => setFilter('RESIGN')} className={`px-2 py-1 rounded ${filter === 'RESIGN' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-800 hover:bg-red-100'}`}>RESIGN ({stats.resign})</button>
            <button onClick={() => setFilter('TERMINATE')} className={`px-2 py-1 rounded ${filter === 'TERMINATE' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'}`}>TERMINATE ({stats.terminate})</button>
            <button onClick={() => setFilter('CHANGE GROUP')} className={`px-2 py-1 rounded ${filter === 'CHANGE GROUP' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'}`}>CHANGE GROUP ({stats.changeGroup})</button>
          </div>

          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-1.5 text-sm text-black"
              />
              <svg className="w-4 h-4 absolute left-2 top-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* ADD BUTTON */}
            {isAdmin ? (
              <Link
                href="/dashboard/officers/add"
                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap"
              >
                <span>+</span> ADD
              </Link>
            ) : (
              <button
                disabled
                className="inline-flex items-center gap-1 bg-gray-400 text-white text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap cursor-not-allowed"
                title="Only admin can add"
              >
                <span>+</span> ADD
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LISTING NAME */}
      <div className="mb-3">
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-2">
          <div className="flex items-center gap-2 text-sm text-black">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Total Listing: {filteredOfficers.length} officers</span>
          </div>
        </div>
      </div>

      {/* OFFICERS TABLE */}
      <div className="border border-gray-300 rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-300">
            <tr className="text-black font-bold">
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">NAME & EMAIL</th>
              <th className="px-2 py-2 text-left">DEPT</th>
              <th className="px-2 py-2 text-left">STATUS</th>
              <th className="px-2 py-2 text-left">ID PANEL</th>
              <th className="px-2 py-2 text-left">JOIN</th>
              <th className="px-2 py-2 text-left">NATION</th>
              <th className="px-2 py-2 text-left">GENDER</th>
              <th className="px-2 py-2 text-left">BANK ACCOUNT</th>
              <th className="px-2 py-2 text-left">PHONE/TELE</th>
              <th className="px-2 py-2 text-left">ROOM</th>
              <th className="px-2 py-2 text-center">ACT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOfficers.length > 0 ? (
              filteredOfficers.map((officer, index) => (
                <tr key={officer.id} className="hover:bg-gray-50">
                  <td className="px-2 py-2 align-top text-black">{index + 1}</td>
                  
                  <td className="px-2 py-2">
                    <div className="font-bold text-black">{officer.full_name || '-'}</div>
                    <div className="text-gray-600 text-xs truncate max-w-[150px]">{officer.email || '-'}</div>
                  </td>
                  
                  <td className="px-2 py-2 align-top text-black">{officer.department || '-'}</td>
                  
                  <td className="px-2 py-2 align-top">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                      officer.status === 'REGULAR' ? 'bg-green-100 text-green-800' :
                      officer.status === 'TRAINING' ? 'bg-yellow-100 text-yellow-800' :
                      officer.status === 'RESIGN' ? 'bg-red-100 text-red-800' :
                      officer.status === 'TERMINATE' ? 'bg-rose-100 text-rose-800' :
                      officer.status === 'CHANGE GROUP' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
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
                  </td>
                  
                  <td className="px-2 py-2 align-top font-mono text-black">{officer.panel_id || '-'}</td>
                  <td className="px-2 py-2 align-top text-black">{formatDate(officer.join_date)}</td>
                  <td className="px-2 py-2 align-top text-black">{officer.nationality || '-'}</td>
                  <td className="px-2 py-2 align-top text-black">{officer.gender || '-'}</td>
                  
                  {/* BANK ACCOUNT */}
                  <td className="px-2 py-2">
                    {officer.bank_account ? (
                      <div className="flex flex-col gap-0.5">
                        {officer.bank_account.split('|').map((item, i) => {
                          const trimmed = item.trim();
                          if (trimmed.startsWith('http')) {
                            return (
                              <a key={i} href={trimmed} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center gap-0.5 text-xs">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                QR
                              </a>
                            );
                          }
                          return <span key={i} className="text-xs text-black">{trimmed}</span>;
                        })}
                      </div>
                    ) : '-'}
                  </td>
                  
                  {/* PHONE/TELE */}
                  <td className="px-2 py-2">
                    <div className="flex flex-col gap-0.5">
                      {officer.phone && <span className="text-xs text-black">{officer.phone}</span>}
                      {officer.telegram_id && (
                        <span className="text-xs text-blue-600">@{officer.telegram_id.replace('@', '')}</span>
                      )}
                      {!officer.phone && !officer.telegram_id && <span className="text-xs text-gray-400">-</span>}
                    </div>
                  </td>
                  
                  {/* ROOM */}
                  <td className="px-2 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                      officer.room === 'UNMESS' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {officer.room || '-'}
                    </span>
                  </td>
                  
                  {/* ACTION BUTTONS */}
                  <td className="px-2 py-2">
                    {isAdmin ? (
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleEditClick(officer, e)}
                          className="text-white bg-blue-600 hover:bg-blue-700 p-1.5 rounded-md transition-colors"
                          title="Edit"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(officer, e)}
                          className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded-md transition-colors"
                          title="Delete"
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="px-6 py-8 text-center text-black">
                  No officers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="mt-4 p-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-black">
        <div className="flex justify-between">
          <span>Showing {filteredOfficers.length} of {stats.total} officers</span>
          <span>{new Date().toLocaleDateString('id-ID')}</span>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && officerToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h3 className="text-lg font-bold text-black mb-2">Hapus Officer?</h3>
            <p className="text-sm text-black mb-4">Yakin ingin menghapus {officerToDelete.full_name}?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1 border rounded text-sm text-black hover:bg-gray-100">Batal</button>
              <button onClick={handleDeleteConfirm} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Hapus</button>
            </div>
          </div>
        </div>
      )}

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