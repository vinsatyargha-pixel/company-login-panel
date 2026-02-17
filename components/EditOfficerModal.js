'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EditOfficerModal({ officer, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    email: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (officer) {
      setFormData({
        name: officer.name || '',
        position: officer.position || '',
        email: officer.email || ''
      });
    }
  }, [officer]);

  if (!officer) return null; // ini aman


  const [formData, setFormData] = useState({
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const departments = ['CAPTAIN', 'AM', 'CS DP WD', 'HRD', 'PIC', 'LAUNDRY', 'IT', 'HEAD OPS', 'OWNER'];
  const statusOptions = ['REGULAR', 'TRAINING', 'RESIGN', 'TERMINATE', 'CHANGE GROUP'];
  const genderOptions = ['Male', 'Female'];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

    const handleSubmit = async (e) => {
    e.preventDefault();
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


    return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Edit Officer</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full border p-2 rounded"
            placeholder="Name"
          />

          <input
            type="text"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
            className="w-full border p-2 rounded"
            placeholder="Position"
          />

          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full border p-2 rounded"
            placeholder="Email"
          />

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
