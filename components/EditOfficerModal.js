'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth'; // ✅ gunakan hook auth

export default function EditOfficerModal({ officer, onClose, onUpdated }) {
  const { user, isAdmin, loading: authLoading } = useAuth(); // ambil role dan status auth
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    role: '',
    status: 'REGULAR',
    panel_id: '',
    join_date: '',
    nationality: '',
    gender: '',
    phone: '',
    passport_number: '',
    telegram_id: '',
    room: '',
    group_id: '',
    bank_account: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const departments = ['CAPTAIN', 'AM', 'CS DP WD', 'HRD', 'PIC', 'LAUNDRY', 'IT', 'HEAD OPS', 'OWNER'];
  const statusOptions = ['REGULAR', 'TRAINING', 'RESIGN', 'TERMINATE', 'CHANGE GROUP'];
  const genderOptions = ['Male', 'Female'];

  // load data officer ke form
  useEffect(() => {
    if (officer) {
      setFormData({
        full_name: officer.full_name || '',
        email: officer.email || '',
        department: officer.department || '',
        role: officer.role || '',
        status: officer.status || 'REGULAR',
        panel_id: officer.panel_id || '',
        join_date: officer.join_date || '',
        nationality: officer.nationality || '',
        gender: officer.gender || '',
        phone: officer.phone || '',
        passport_number: officer.passport_number || '',
        telegram_id: officer.telegram_id || '',
        room: officer.room || '',
        group_id: officer.group_id || '',
        bank_account: officer.bank_account || '',
        notes: officer.notes || ''
      });
    }
  }, [officer]);

  // validasi form sederhana
  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);

    const { error } = await supabase
      .from('officers')
      .update(formData)
      .eq('id', officer.id);

    if (!error) {
      onUpdated();
      onClose();
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  // kalau belum ada officer atau user belum admin, jangan tampilkan modal
  if (!officer || authLoading || !isAdmin) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Edit Officer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Full Name"
          />
          {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Email"
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

          <select name="department" value={formData.department} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Select Department</option>
            {departments.map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </select>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
