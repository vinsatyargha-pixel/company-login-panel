'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function AddOfficerPage() {
  const router = useRouter();
  const { isAdmin } = useAuth(); // ← CEK ADMIN
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: '',
    role: '',
    position: '',
    join_date: new Date().toISOString().split('T')[0],
    nationality: '',
    gender: '',
    panel_id: '',
    telegram_id: '',
    room: '',
    status: 'REGULAR',
    passport_number: '',
    group_id: '',
    notes: '',
    bank_account: ''
  });

  const [errors, setErrors] = useState({});

  // Redirect kalau bukan admin
  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/officers/active');
    }
  }, [isAdmin, router]);

  // Department options
  const departments = [
    'CAPTAIN',
    'AM',
    'CS DP WD',
    'HRD',
    'PIC',
    'LAUNDRY',
    'IT',
    'HEAD OPS',
    'OWNER'
  ];

  // Status options
  const statusOptions = [
    'REGULAR',
    'TRAINING',
    'RESIGN',
    'TERMINATE',
    'CHANGE GROUP'
  ];

  // Gender options
  const genderOptions = ['Male', 'Female'];

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.join_date) newErrors.join_date = 'Join date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Cek apakah email sudah ada
      const { data: existingEmail, error: checkError } = await supabase
        .from('officers')
        .select('email')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingEmail) {
        setErrors({ email: 'Email already exists' });
        setLoading(false);
        return;
      }

      // Insert new officer
      const { data, error } = await supabase
        .from('officers')
        .insert([{
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;

      // Redirect ke halaman active officers dengan pesan sukses
      router.push('/dashboard/officers/active?success=Officer added successfully');
      
    } catch (error) {
      console.error('Error adding officer:', error);
      alert('Failed to add officer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Kalau bukan admin, jangan render apa-apa (redirect sudah di useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-white">
      {/* HEADER */}
      <div className="mb-8">
        <Link
          href="/dashboard/officers/active"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 font-medium transition-all"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          BACK TO ACTIVE OFFICERS
        </Link>
        
        <h1 className="text-3xl font-bold text-black">ADD NEW OFFICER</h1>
        <p className="text-gray-700 mt-2 font-medium">Tambahkan officer baru ke GROUP-X</p>
      </div>

      {/* FORM CARD */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <form onSubmit={handleSubmit}>
          {/* 2 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full border ${errors.full_name ? 'border-red-500' : 'border-gray-400'} rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black`}
                  placeholder="John Doe"
                />
                {errors.full_name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-400'} rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black`}
                  placeholder="john@groupx.id"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="+62 812-3456-7890"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Department</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Position */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="Staff, Supervisor, etc"
                />
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  Join Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="join_date"
                  value={formData.join_date}
                  onChange={handleChange}
                  className={`w-full border ${errors.join_date ? 'border-red-500' : 'border-gray-400'} rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black`}
                />
                {errors.join_date && <p className="text-red-500 text-xs mt-1 font-medium">{errors.join_date}</p>}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Nationality */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="Indonesian"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              {/* Panel ID */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Panel ID</label>
                <input
                  type="text"
                  name="panel_id"
                  value={formData.panel_id}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="e.g., PN-001"
                />
              </div>

              {/* Telegram ID */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Telegram ID</label>
                <input
                  type="text"
                  name="telegram_id"
                  value={formData.telegram_id}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="@username"
                />
              </div>

              {/* Room */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Room</label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="4 digit number or UNMESS"
                />
                <p className="text-xs text-gray-600 mt-1 font-medium">Format: 4 digit angka atau UNMESS</p>
              </div>

              {/* Bank Account */}
              <div>
                <label className="block text-sm font-bold text-black mb-1">Bank Account</label>
                <input
                  type="text"
                  name="bank_account"
                  value={formData.bank_account}
                  onChange={handleChange}
                  className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                  placeholder="123456789 | ABA | https://link.qr"
                />
                <p className="text-xs text-gray-600 mt-1 font-medium">Format: Nomor | Bank | Link QR</p>
              </div>
            </div>
          </div>

          {/* Additional Fields */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-black mb-1">Passport Number</label>
              <input
                type="text"
                name="passport_number"
                value={formData.passport_number}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black mb-1">Group ID</label>
              <input
                type="text"
                name="group_id"
                value={formData.group_id}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <label className="block text-sm font-bold text-black mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-400 rounded px-4 py-2 text-black bg-white font-medium focus:outline-none focus:border-black"
              placeholder="Additional notes..."
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <Link
              href="/dashboard/officers/active"
              className="px-6 py-2.5 border border-gray-400 rounded text-black hover:bg-gray-100 font-bold transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Add Officer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* INFO CARD */}
      <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-gray-50">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold text-black">Informasi</h3>
            <p className="text-sm text-gray-700 mt-1 font-medium">
              Field dengan tanda <span className="text-red-500 font-bold">*</span> wajib diisi. 
              Employee ID tidak diperlukan (akan digenerate otomatis).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}