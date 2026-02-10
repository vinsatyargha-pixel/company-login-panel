// app/officers/page.js - Draft
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OfficersPage() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "REGULER",
    join_date: "",
    gender: "MALE",
    nationality: "INDONESIA",
    group_id: ""
  });
  const router = useRouter();

  // Fetch officers
  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setOfficers(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('officers')
      .insert([formData]);
    
    if (!error) {
      setShowForm(false);
      setFormData({
        name: "", email: "", status: "REGULER", 
        join_date: "", gender: "MALE", nationality: "INDONESIA", group_id: ""
      });
      fetchOfficers();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">👥 Officer Management</h1>
        
        {/* Add New Button */}
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg font-semibold"
        >
          + Add New Officer
        </button>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 p-8 rounded-2xl w-full max-w-md border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">Add New Officer</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <select
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="REGULER">REGULER</option>
                  <option value="TRAINING">TRAINING</option>
                  <option value="RESIGN">RESIGN</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="CUTI">CUTI</option>
                  <option value="SAKIT">SAKIT</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-500 rounded-lg"
                >
                  Save Officer
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="w-full py-3 bg-gray-800 rounded-lg"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Officers Table */}
        <div className="bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Join Date</th>
                <th className="p-4 text-left">Gender</th>
                <th className="p-4 text-left">Nationality</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((officer) => (
                <tr key={officer.id} className="border-b border-gray-800 hover:bg-gray-900/30">
                  <td className="p-4">{officer.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      officer.status === 'REGULER' ? 'bg-green-900/50 text-green-400' :
                      officer.status === 'TRAINING' ? 'bg-blue-900/50 text-blue-400' :
                      officer.status === 'RESIGN' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-red-900/50 text-red-400'
                    }`}>
                      {officer.status}
                    </span>
                  </td>
                  <td className="p-4">{officer.join_date}</td>
                  <td className="p-4">{officer.gender}</td>
                  <td className="p-4">{officer.nationality}</td>
                  <td className="p-4">
                    <button className="px-3 py-1 bg-gray-800 rounded mr-2">Edit</button>
                    <button className="px-3 py-1 bg-red-900/50 rounded">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}