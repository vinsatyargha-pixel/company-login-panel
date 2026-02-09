"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
    } else {
      setUser(data.user);
      fetchOfficers();
    }
  };

  const fetchOfficers = async () => {
    const { data, error } = await supabase.from("officers").select("*");
    if (data) setOfficers(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Dashboard Officer</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">Halo, {user?.email}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-1 rounded text-sm"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Data Officer</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left text-sm">Nama</th>
                  <th className="p-3 text-left text-sm">Email</th>
                  <th className="p-3 text-left text-sm">Departemen</th>
                  <th className="p-3 text-left text-sm">Role</th>
                  <th className="p-3 text-left text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {officers.map((officer) => (
                  <tr key={officer.id} className="border-t">
                    <td className="p-3 text-sm">{officer.full_name}</td>
                    <td className="p-3 text-sm">{officer.email}</td>
                    <td className="p-3 text-sm">{officer.department}</td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {officer.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          officer.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {officer.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}