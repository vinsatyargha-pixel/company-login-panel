// app/dashboard/users/page.js
"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "officer",
    officer_id: ""
  });

  // ✅ SAFE localStorage (client only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("magni_user") || "{}");

      if (!user || user.role !== "admin") {
        alert("Hanya admin yang bisa mengakses halaman ini");
        window.location.href = "/dashboard";
        return;
      }

      setCurrentUser(user);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: usersData } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: officersData } = await supabase
        .from("officers")
        .select("id, full_name, email")
        .order("full_name");

      setUsers(usersData || []);
      setOfficers(officersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from("users").insert([
        {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          officer_id: formData.officer_id || null
        }
      ]);

      if (error) throw error;

      alert("User berhasil ditambahkan!");
      setShowForm(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "officer",
        officer_id: ""
      });

      fetchData();
    } catch (error) {
      alert("Gagal menambahkan user: " + error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt("Masukkan password baru:");
    if (!newPassword || newPassword.length < 6) {
      alert("Password minimal 6 karakter");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ password: newPassword })
        .eq("id", userId);

      if (error) throw error;
      alert("Password berhasil direset!");
    } catch (error) {
      alert("Gagal reset password: " + error.message);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Hapus user ${userEmail}?`)) return;

    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      alert("User berhasil dihapus!");
      fetchData();
    } catch (error) {
      alert("Gagal menghapus user: " + error.message);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                👨‍💼 User Management
              </h1>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              + Add New User
            </button>
          </div>

          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <p className="text-sm text-gray-600">
              Logged in as:{" "}
              <span className="font-bold text-blue-600">
                {currentUser.email}
              </span>

              <span
                className={`ml-4 px-2 py-1 rounded text-xs ${
                  currentUser.role === "admin"
                    ? "bg-purple-100 text-purple-800"
                    : currentUser.role === "supervisor"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentUser.role.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Role</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Last Login</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium">{user.email}</td>
                  <td className="p-4">{user.full_name || "-"}</td>
                  <td className="p-4">{user.role}</td>
                  <td className="p-4">
                    {user.is_active ? "Active" : "Inactive"}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {user.last_login
                      ? new Date(user.last_login).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                      >
                        Reset
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteUser(user.id, user.email)
                        }
                        disabled={user.email === currentUser.email}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
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
