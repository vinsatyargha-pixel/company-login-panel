'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function EditOfficerModal({ officer, onClose, onUpdate }) {
  const { isAdmin } = useAuth();
  
  // SEMUA HOOKS DI ATAS, SEBELUM CONDITIONAL RETURN
  const [formData, setFormData] = useState({
    full_name: officer?.full_name || '',
    email: officer?.email || '',
    department: officer?.department || '',
    status: officer?.status || 'REGULAR',
    panel_id: officer?.panel_id || '',
    join_date: officer?.join_date || '',
    nationality: officer?.nationality || '',
    gender: officer?.gender || '',
    phone: officer?.phone || '',
    telegram_id: officer?.telegram_id || '',
    room: officer?.room || '',
    bank_account: officer?.bank_account || '',
    notes: officer?.notes || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // CEK ADMIN DI SINI (SETELAH SEMUA HOOKS)
  if (!isAdmin || !officer) {
    return null;
  }

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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('officers')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', officer.id);

      if (error) throw error;
      
      onUpdate({ ...officer, ...formData });
      onClose();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Gagal mengupdate officer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Edit Officer</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`w-full border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
              />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">Select Department</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                {statusOptions.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telegram ID</label>
              <input
                type="text"
                name="telegram_id"
                value={formData.telegram_id}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Room</label>
              <input
                type="text"
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="4 digit or UNMESS"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bank Account</label>
              <input
                type="text"
                name="bank_account"
                value={formData.bank_account}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Nomor | Bank | Link QR"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}