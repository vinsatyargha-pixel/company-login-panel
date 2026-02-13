// app/officers/active/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ActiveOfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, REGULAR, TRAINING
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchOfficers();
  }, [filter]);

  const fetchOfficers = async () => {
  try {
    setLoading(true);
    
    let query = supabase
      .from('officers')
      .select('*')
      .order('name', { ascending: true });

    const { data, error } = await query;
    
    if (error) throw error;
    
    // 🔥 FILTER: REGULER + TRAINING = ACTIVE
    const activeOfficers = data.filter(o => 
      o.status?.toUpperCase() === 'REGULAR' || 
      o.status?.toUpperCase() === 'REGULER' ||
      o.status?.toUpperCase() === 'TRAINING'
    );
    
    setOfficers(activeOfficers || []);
    
    // 🔥 STATISTIK BERDASARKAN ACTIVE OFFICERS
    const stats = {
      total: activeOfficers.length,
      regular: activeOfficers.filter(o => o.status?.toUpperCase() === 'REGULAR' || o.status?.toUpperCase() === 'REGULER').length,
      training: activeOfficers.filter(o => o.status?.toUpperCase() === 'TRAINING').length,
    };
    
  } catch (error) {
    console.error('Error fetching officers:', error);
    setOfficers([]);
  } finally {
    setLoading(false);
  }
};

  // Filter officers by search
  const filteredOfficers = search.trim() === ''
    ? officers
    : officers.filter(officer =>
        officer.name.toLowerCase().includes(search.toLowerCase()) ||
        officer.employee_id.toLowerCase().includes(search.toLowerCase()) ||
        officer.department?.toLowerCase().includes(search.toLowerCase())
      );

  // Calculate statistics
  const stats = {
    total: officers.length,
    regular: officers.filter(o => o.status === 'REGULAR').length,
    training: officers.filter(o => o.status === 'TRAINING').length,
    byDepartment: officers.reduce((acc, officer) => {
      const dept = officer.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {})
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
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
      {/* HEADER WITH BACK BUTTON */}
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">TOTAL</h3>
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <p className="text-sm text-gray-600">Active Officers</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">REGULAR</h3>
          <div className="text-3xl font-bold text-green-600">{stats.regular}</div>
          <p className="text-sm text-gray-600">Full Status</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">TRAINING</h3>
          <div className="text-3xl font-bold text-yellow-600">{stats.training}</div>
          <p className="text-sm text-gray-600">In Training</p>
        </div>

        <div className="border border-gray-300 rounded-lg p-4">
          <h3 className="text-lg font-bold text-black mb-2">DEPARTMENTS</h3>
          <div className="text-3xl font-bold text-purple-600">{Object.keys(stats.byDepartment).length}</div>
          <p className="text-sm text-gray-600">Total Departments</p>
        </div>
      </div>

      {/* FILTER & SEARCH SECTION */}
      <div className="mb-8 p-4 border border-gray-300 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-4">
              {/* Status Filter */}
              <div>
                <span className="font-medium text-black mr-2">Status:</span>
                <div className="flex gap-2 mt-1">
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
                </div>
              </div>

              {/* Search Box */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or department..."
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
              href="/officers/add"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded"
            >
              <span className="text-xl">+</span>
              ADD OFFICER
            </Link>
          </div>
        </div>
      </div>

      {/* DEPARTMENT BREAKDOWN */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-black mb-4">BY DEPARTMENT</h2>
        <div className="flex flex-wrap gap-4">
          {Object.entries(stats.byDepartment).map(([dept, count]) => (
            <div key={dept} className="border border-gray-300 rounded-lg p-3 min-w-[150px]">
              <div className="text-sm text-gray-600">{dept}</div>
              <div className="text-2xl font-bold text-black">{count}</div>
              <div className="text-xs text-gray-500">
                {((count / stats.total) * 100).toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* OFFICERS LIST */}
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-100 grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-300 font-bold text-black">
          <div className="col-span-1">#</div>
          <div className="col-span-3">NAME</div>
          <div className="col-span-2">EMPLOYEE ID</div>
          <div className="col-span-2">DEPARTMENT</div>
          <div className="col-span-2">STATUS</div>
          <div className="col-span-2">JOIN DATE</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredOfficers.length > 0 ? (
            filteredOfficers.map((officer, index) => (
              <div 
                key={officer.id} 
                className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => window.location.href = `/officers/${officer.id}`}
              >
                <div className="col-span-1 text-gray-700">{index + 1}</div>
                
                <div className="col-span-3">
                  <div className="font-medium text-black">{officer.name}</div>
                  <div className="text-sm text-gray-600">{officer.email}</div>
                </div>
                
                <div className="col-span-2">
                  <span className="px-3 py-1 bg-gray-100 text-black rounded text-sm font-mono">
                    {officer.employee_id}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <span className="text-black">{officer.department || 'Unassigned'}</span>
                </div>
                
                <div className="col-span-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    officer.status === 'REGULAR' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {officer.status}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <span className="text-gray-700">{formatDate(officer.join_date)}</span>
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
                href="/officers/add"
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
            Updated just now
          </div>
        </div>
      </div>
    </div>
  );
}