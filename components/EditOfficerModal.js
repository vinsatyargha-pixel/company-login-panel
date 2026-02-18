'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function EditOfficerModal({ officer, onClose, onUpdate }) {
  const { isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: officer?.full_name || '',
    email: officer?.email || '',
    department: officer?.department || '',
    role: officer?.role || '',
    status: officer?.status || 'REGULAR',
    panel_id: officer?.panel_id || '',
    join_date: officer?.join_date || '',
    nationality: officer?.nationality || '',
    gender: officer?.gender || '',
    phone: officer?.phone || '',
    passport_number: officer?.passport_number || '',
    telegram_id: officer?.telegram_id || '',
    room: officer?.room || '',
    group_id: officer?.group_id || '',
    bank_account: officer?.bank_account || '',
    notes: officer?.notes || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  if (!isAdmin || !officer) return null;

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
      const { data, error } = await supabase
        .from('officers')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', officer.id)
        .select()
        .single();

      if (error) throw error;
      
      onUpdate(data);
      onClose();
      
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Gagal mengupdate officer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">Edit Officer</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2 text-black`}
                  />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded px-4 py-2 text-black`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Department</label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                    placeholder="e.g., Officer, Manager"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Panel ID</label>
                  <input
                    type="text"
                    name="panel_id"
                    value={formData.panel_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                    placeholder="e.g., PN-001"
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-black mb-1">Join Date</label>
                  <input
                    type="date"
                    name="join_date"
                    value={formData.join_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Nationality</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                    placeholder="e.g., Indonesian"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  >
                    <option value="">Select Gender</option>
                    {genderOptions.map(gender => (
                      <option key={gender} value={gender}>{gender}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                    placeholder="e.g., +62xxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Passport Number</label>
                  <input
                    type="text"
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Telegram ID</label>
                  <input
                    type="text"
                    name="telegram_id"
                    value={formData.telegram_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Room</label>
                  <input
                    type="text"
                    name="room"
                    value={formData.room}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                    placeholder="4 digit number or UNMESS"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Bank Account</label>
                  <input
                    type="text"
                    name="bank_account"
                    value={formData.bank_account}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                    placeholder="123456789 | ABA | https://link.qr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-1">Group ID</label>
                  <input
                    type="text"
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-black mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full border border-gray-300 rounded px-4 py-2 text-black"
                placeholder="Additional notes..."
              />
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded text-black hover:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Officer</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}