// app/assets/add/page.js
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset_code: '',
    asset_name: '',
    wlb_code: '',
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.asset_code || !formData.asset_name) {
      alert('Asset Code dan Asset Name wajib diisi!');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('assets')
        .insert([{
          asset_code: formData.asset_code.toUpperCase(),
          asset_name: formData.asset_name,
          wlb_code: formData.wlb_code.toUpperCase(),
          description: formData.description
        }]);

      if (error) throw error;

      alert('Asset berhasil ditambahkan!');
      router.push('/assets');
      router.refresh();
      
    } catch (error) {
      console.error('Error adding asset:', error);
      alert(`Gagal menambahkan asset: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/assets"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Assets
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Tambah Asset Baru</h1>
        <p className="text-gray-600 mt-2">Tambahkan asset baru ke GROUP-X</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="asset_code"
              value={formData.asset_code}
              onChange={handleChange}
              placeholder="Contoh: XLY, TRK01"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Kode unik untuk identifikasi asset</p>
          </div>

          {/* Asset Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="Contoh: Lucky77, Truck 01"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* WLB Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WLB Code (Singkatan)
            </label>
            <input
              type="text"
              name="wlb_code"
              value={formData.wlb_code}
              onChange={handleChange}
              placeholder="Contoh: XLY (untuk Lucky77)"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-1">Singkatan/nama pendek asset (opsional)</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi asset (opsional)"
              rows="3"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Menambahkan...' : 'Tambah Asset'}
            </button>
            <Link
              href="/assets"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg text-center transition-colors"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}