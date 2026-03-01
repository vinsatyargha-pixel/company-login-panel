// Ini adalah halaman DP Data Raw lo yang udah ada
// Kita tambahin komponen import di bagian atas atau sebagai modal/tab

import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

export default function DPDataRawPage() {
  const [showImport, setShowImport] = useState(false)
  const [data, setData] = useState([]) // data deposit lo yang existing
  
  return (
    <div className="p-6">
      {/* Header dengan Breadcrumb sesuai struktur lo */}
      <div className="mb-6">
        <div className="text-sm breadcrumbs">
          <ul className="flex space-x-2 text-gray-500">
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/dashboard/data-raw">Data Raw</a></li>
            <li className="text-blue-600 font-semibold">DP Data Raw</li>
          </ul>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <h1 className="text-2xl font-bold">Deposit Data Raw</h1>
          
          {/* Tombol Import yang muncul di halaman DP */}
          <button
            onClick={() => setShowImport(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Data Deposit
          </button>
        </div>
      </div>

      {/* Modal/Tab Import (kode dari sebelumnya bisa dimasukin sini) */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Import Data Deposit</h2>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* MASUKIN KODE IMPORT DARI SEBELUMNYA DI SINI */}
            {/* ... (kode upload file, dll yang udah gue kasih) ... */}
            
          </div>
        </div>
      )}

      {/* Tabel Data Deposit yang udah ada */}
      <div className="bg-white rounded-lg shadow">
        {/* ... tabel existing lo ... */}
      </div>
    </div>
  )
}