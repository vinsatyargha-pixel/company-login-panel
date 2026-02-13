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
    <div className="p-6 max-w-2xl mx-auto min-h-screen bg-white">
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
        
        <h1 className="text-3xl font-bold text-black">TAMBAH ASSET BARU</h1>
        <p className="text-gray-700 mt-2">Tambahkan asset baru ke GROUP-X</p>
      </div>

      {/* FORM */}
      <div className="border border-gray-300 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Code */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Asset Code <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="asset_code"
              value={formData.asset_code}
              onChange={handleChange}
              placeholder="Contoh: XLY, TRK01"
              className="w-full border border-gray-400 rounded px-4 py-3 text-black bg-white"
              required
            />
            <p className="text-sm text-gray-600 mt-1">Kode unik untuk identifikasi asset</p>
          </div>

          {/* Asset Name */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Asset Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="asset_name"
              value={formData.asset_name}
              onChange={handleChange}
              placeholder="Contoh: Lucky77, Truck 01"
              className="w-full border border-gray-400 rounded px-4 py-3 text-black bg-white"
              required
            />
          </div>

          {/* WLB Code */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              WLB Code (Singkatan)
            </label>
            <input
              type="text"
              name="wlb_code"
              value={formData.wlb_code}
              onChange={handleChange}
              placeholder="Contoh: XLY (untuk Lucky77)"
              className="w-full border border-gray-400 rounded px-4 py-3 text-black bg-white"
            />
            <p className="text-sm text-gray-600 mt-1">Singkatan/nama pendek asset (opsional)</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Deskripsi
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Deskripsi asset (opsional)"
              rows="3"
              className="w-full border border-gray-400 rounded px-4 py-3 text-black bg-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-300">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded disabled:opacity-50"
            >
              {loading ? 'MENAMBAH...' : 'TAMBAH ASSET'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/assets')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 px-6 rounded"
            >
              BATAL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}