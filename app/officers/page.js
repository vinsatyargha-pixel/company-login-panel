// app/officers/page.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    join_date: "",
    gender: "MALE",
    nationality: "INDONESIA",
    status: "TRAINING" // Default: TRAINING
  });

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error('Error fetching officers:', error);
      alert('Error loading officers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validasi data
      if (!formData.name.trim()) {
        alert("Name is required");
        return;
      }

      const { error } = await supabase
        .from('officers')
        .insert([{
          name: formData.name.trim(),
          join_date: formData.join_date || new Date().toISOString().split('T')[0],
          gender: formData.gender,
          nationality: formData.nationality,
          status: formData.status,
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      
      // Reset form
      setShowForm(false);
      setFormData({
        name: "",
        join_date: "",
        gender: "MALE",
        nationality: "INDONESIA",
        status: "TRAINING"
      });
      
      // Refresh data
      fetchOfficers();
      alert("Officer added successfully!");
      
    } catch (error) {
      console.error('Error adding officer:', error);
      alert('Failed to add officer: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this officer?")) return;
    
    try {
      const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchOfficers();
      alert("Officer deleted successfully!");
    } catch (error) {
      console.error('Error deleting officer:', error);
      alert('Failed to delete officer: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading officers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* HEADER WITH BACK BUTTON */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="flex items-center text-gray-400 hover:text-white transition"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">👥 Officer Management</h1>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-semibold hover:opacity-90 transition"
          >
            + Add New Officer
          </button>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Total Officers</p>
            <p className="text-2xl font-bold">{officers.length}</p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Regular</p>
            <p className="text-2xl font-bold text-green-400">
              {officers.filter(o => o.status === 'REGULAR').length}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Training</p>
            <p className="text-2xl font-bold text-blue-400">
              {officers.filter(o => o.status === 'TRAINING').length}
            </p>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-400 text-sm">Inactive</p>
            <p className="text-2xl font-bold text-red-400">
              {officers.filter(o => ['RESIGN', 'TERMINATED', 'DIRUMAHKAN'].includes(o.status)).length}
            </p>
          </div>
        </div>
      </div>

      {/* ADD OFFICER MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 p-6 md:p-8 rounded-2xl w-full max-w-md border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Add New Officer</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Join Date</label>
                <input
                  type="date"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  value={formData.join_date}
                  onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gender</label>
                  <select
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nationality</label>
                  <select
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                    value={formData.nationality}
                    onChange={(e) => setFormData({...formData, nationality: e.target.value})}
                  >
                    <option value="INDONESIA">Indonesia</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <select
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="TRAINING">Training</option>
                  <option value="REGULAR">Regular</option>
                  <option value="RESIGN">Resign</option>
                  <option value="TERMINATED">Terminated</option>
                  <option value="DIRUMAHKAN">Dirumahkan</option>
                </select>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg font-semibold hover:opacity-90"
                >
                  Save Officer
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICERS TABLE */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-4 text-left text-gray-300 font-medium">Name</th>
                <th className="p-4 text-left text-gray-300 font-medium">Join Date</th>
                <th className="p-4 text-left text-gray-300 font-medium">Gender</th>
                <th className="p-4 text-left text-gray-300 font-medium">Nationality</th>
                <th className="p-4 text-left text-gray-300 font-medium">Status</th>
                <th className="p-4 text-left text-gray-300 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No officers found. Click "Add New Officer" to add one.
                  </td>
                </tr>
              ) : (
                officers.map((officer) => (
                  <tr key={officer.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                    <td className="p-4 font-medium">{officer.name || "-"}</td>
                    <td className="p-4">{officer.join_date || "-"}</td>
                    <td className="p-4">{officer.gender || "-"}</td>
                    <td className="p-4">{officer.nationality || "-"}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        officer.status === 'REGULAR' ? 'bg-green-900/50 text-green-400' :
                        officer.status === 'TRAINING' ? 'bg-blue-900/50 text-blue-400' :
                        officer.status === 'RESIGN' ? 'bg-orange-900/50 text-orange-400' :
                        officer.status === 'TERMINATED' ? 'bg-red-900/50 text-red-400' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {officer.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {/* TODO: Edit function */}}
                          className="px-3 py-1 bg-gray-800 rounded text-sm hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(officer.id)}
                          className="px-3 py-1 bg-red-900/30 rounded text-sm hover:bg-red-900/50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}