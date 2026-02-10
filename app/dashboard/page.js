"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalOfficers: 0,
    activeOfficers: 0,
    trainingOfficers: 0,
    totalAssets: 0,
    activeAssets: 0
  });
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
      fetchDashboardData();
    }
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch officers
      const { data: officersData, error: officersError } = await supabase.from("officers").select("*");
      
      if (officersData) {
        setOfficers(officersData);
        
        const totalOfficers = officersData.length;
        const activeOfficers = officersData.filter(o => o.status === "REGULER").length;
        const trainingOfficers = officersData.filter(o => o.status === "TRAINING").length;
        
        setStats(prev => ({
          ...prev,
          totalOfficers,
          activeOfficers,
          trainingOfficers
        }));
      }
      
      // Fetch assets (jika ada tabel assets)
      try {
        const { data: assetsData } = await supabase.from("assets").select("*");
        if (assetsData) {
          const totalAssets = assetsData.length;
          const activeAssets = assetsData.filter(a => a.status === "ACTIVE").length;
          
          setStats(prev => ({
            ...prev,
            totalAssets,
            activeAssets
          }));
        }
      } catch (assetsErr) {
        console.log("Assets table not found or error:", assetsErr);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-6 bg-gradient-to-r from-gray-900 to-black rounded-2xl border border-gray-800">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            DATABASE OPERASIONAL v3
          </h1>
          <p className="text-gray-400 mt-2">MAGNI GROUP-X • SECURE PANEL</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <div className="text-right">
            <p className="text-sm text-gray-400">Logged in as</p>
            <p className="font-semibold">{user?.email || 'User'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg font-semibold transition"
          >
            LOGOUT
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard 
          title="TOTAL OFFICERS" 
          value={stats.totalOfficers} 
          color="blue" 
        />
        <StatCard 
          title="ACTIVE OFFICERS" 
          value={stats.activeOfficers} 
          color="green" 
        />
        <StatCard 
          title="TRAINING" 
          value={stats.trainingOfficers} 
          color="yellow" 
        />
        <StatCard 
          title="TOTAL ASSETS" 
          value={stats.totalAssets} 
          color="purple" 
        />
        <StatCard 
          title="ACTIVE ASSETS" 
          value={stats.activeAssets} 
          color="cyan" 
        />
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <NavCard 
          title="📊 Dashboard" 
          description="Overview statistik per group dan keseluruhan"
          onClick={() => router.push('/dashboard')}
          active={true}
        />
        <NavCard 
          title="👥 Staff Management" 
          description="Nama Officer, Status, User ID Panel, Join Date, Gender, Nationality"
          onClick={() => router.push('/officers')}
        />
        <NavCard 
          title="📅 Schedule" 
          description="Officer schedule: Pagi, Siang, Malam, Offday, Cuti, Sakit, dll"
          onClick={() => router.push('/schedule')}
        />
        <NavCard 
          title="💰 Asset & Transactions" 
          description="Volume transaksi asset grup X dan KPI officer"
          onClick={() => alert('Transactions page coming soon!')}
        />
      </div>

      {/* Recent Officers Table */}
      <div className="mb-8 bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Recent Officers</h2>
          <p className="text-gray-400">Latest officer data ({officers.length} total)</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="p-4 text-left">Nama</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Join Date</th>
                <th className="p-4 text-left">Gender</th>
                <th className="p-4 text-left">Nationality</th>
              </tr>
            </thead>
            <tbody>
              {officers.slice(0, 10).map((officer) => (
                <tr key={officer.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                  <td className="p-4 font-semibold">{officer.name || officer.full_name || "N/A"}</td>
                  <td className="p-4 text-gray-300">{officer.email || "N/A"}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      officer.status === 'REGULER' || officer.status === 'active' ? 'bg-green-900/50 text-green-400' :
                      officer.status === 'TRAINING' ? 'bg-blue-900/50 text-blue-400' :
                      officer.status === 'RESIGN' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {officer.status || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">{officer.join_date || officer.created_at?.split('T')[0] || "N/A"}</td>
                  <td className="p-4">{officer.gender || "N/A"}</td>
                  <td className="p-4">{officer.nationality || officer.department || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {officers.length > 10 && (
          <div className="p-4 text-center border-t border-gray-800">
            <button 
              onClick={() => router.push('/officers')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View All Officers ({officers.length}) →
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm p-6 border-t border-gray-800">
        <p>© 2025 Database Operasional Versi 3.0 • MAGNI GROUP-X</p>
        <p className="mt-2 text-xs">Secure Technology Panel • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, color }) {
  const colorClasses = {
    blue: "from-blue-900/30 to-blue-700/20 border-blue-800",
    green: "from-green-900/30 to-green-700/20 border-green-800",
    cyan: "from-cyan-900/30 to-cyan-700/20 border-cyan-800",
    yellow: "from-yellow-900/30 to-yellow-700/20 border-yellow-800",
    orange: "from-orange-900/30 to-orange-700/20 border-orange-800",
    red: "from-red-900/30 to-red-700/20 border-red-800",
    purple: "from-purple-900/30 to-purple-700/20 border-purple-800"
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-xl border`}>
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

// Navigation Card Component
function NavCard({ title, description, onClick, active = false }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:cursor-pointer ${
        active 
          ? 'border-cyan-600 shadow-lg shadow-cyan-900/20' 
          : 'border-gray-700 hover:border-cyan-600'
      }`}
    >
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}