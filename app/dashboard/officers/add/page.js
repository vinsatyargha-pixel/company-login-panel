// app/dashboard/officers/add/page.js
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddOfficerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    status: 'REGULAR',
    employment_status: 'ACTIVE',
    join_date: new Date().toISOString().split('T')[0],
    gender: '',
    nationality: '',
    panel_id: '',
    telegram_id: ''
  });

  // Auth check
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employee_id || !formData.name) {
      alert('Employee ID dan Name wajib diisi!');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('officers')
        .insert([{
          employee_id: formData.employee_id.toUpperCase(),
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          department: formData.department || null,
          position: formData.position || null,
          status: formData.status,
          employment_status: formData.employment_status,
          join_date: formData.join_date,
          gender: formData.gender || null,
          nationality: formData.nationality || null,
          panel_id: formData.panel_id || null,
          telegram_id: formData.telegram_id || null
        }]);

      if (error) throw error;

      alert('Officer berhasil ditambahkan!');
      router.push('/dashboard/officers/active');
      router.refresh();
      
    } catch (error) {
      console.error('Error adding officer:', error);
      alert(`Gagal menambahkan officer: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50">
      {/* HEADER WITH BACK BUTTON */}
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
        
        <h1 className="text-3xl font-bold text-gray-900">ADD NEW OFFICER</h1>
        <p className="text-gray-600 mt-2">Tambahkan officer baru ke GROUP-X</p>
      </div>

      {/* FORM */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Employee ID <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                placeholder="OFF-001"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Full Name <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@groupx.id"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+62 812-3456-7890"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Department & Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Department</option>
                <option value="Operations">Operations</option>
                <option value="Customer Service">Customer Service</option>
                <option value="Security">Security</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="Staff, Supervisor, etc"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Status & Join Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="REGULAR">REGULAR</option>
                <option value="TRAINING">TRAINING</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Join Date <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                name="join_date"
                value={formData.join_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="Indonesian"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Panel ID
              </label>
              <input
                type="text"
                name="panel_id"
                value={formData.panel_id}
                onChange={handleChange}
                placeholder="Panel ID"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Telegram ID
              </label>
              <input
                type="text"
                name="telegram_id"
                value={formData.telegram_id}
                onChange={handleChange}
                placeholder="@username"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'ADDING...' : 'ADD OFFICER'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard/officers/active')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-lg transition"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}