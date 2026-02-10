"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const cariUserDenganNama = async (namaInput) => {
    const namaBersih = namaInput.trim();
    console.log('🔍 [1] Mencari di officers dengan:', namaBersih);

    try {
      // CARI DI TABEL OFFICERS
      const { data, error } = await supabase
        .from('officers')
        .select('email, username, full_name')
        .or(`username.ilike.%${namaBersih}%,full_name.ilike.%${namaBersih}%,email.ilike.%${namaBersih}%`)
        .single();

      console.log('📊 [2] Hasil query:', { data, error });

      if (error) {
        console.log('❌ [3] Error:', error.message);
        return null;
      }

      if (!data) {
        console.log('❌ [4] Data tidak ditemukan');
        return null;
      }

      console.log('✅ [5] Ditemukan:', data.username || data.full_name, '→', data.email);
      return data;

    } catch (err) {
      console.error('❌ [6] Exception:', err);
      return null;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = await cariUserDenganNama(nama);
      
      if (!userData) {
        setError(`User "${nama}" tidak ditemukan`);
        setLoading(false);
        return;
      }
      
      // LOGIN DENGAN EMAIL DARI officers
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (authError) {
        setError("Password salah");
      } else {
        console.log('✅ Login sukses sebagai:', userData.full_name || userData.username);
        
        localStorage.setItem('user', JSON.stringify({
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name
        }));
        
        router.push("/dashboard");
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setError("System error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/6654177/pexels-photo-6654177.jpeg')",
        }}
      ></div>

      {/* Form Container */}
      <div className="bg-gradient-to-br from-gray-900 to-black p-10 rounded-2xl shadow-2xl w-96 border border-gray-700 relative z-10">
        
        {/* Logo X */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <div className="absolute -top-2 -left-2 w-32 h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60 animate-ping"></div>
            <div className="absolute -top-1 -left-1 w-24 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80 animate-pulse"></div>
            <div className="absolute -top-2 -right-2 w-32 h-2 bg-gradient-to-l from-transparent via-blue-400 to-transparent opacity-60 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute -top-1 -right-1 w-24 h-1 bg-gradient-to-l from-transparent via-cyan-300 to-transparent opacity-80 animate-pulse" style={{ animationDelay: '0.3s' }}></div>

            <div className="relative">
              <svg width="120" height="120" viewBox="0 0 200 200" className="relative z-10">
                <defs>
                  <linearGradient id="xGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#88ccff" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#0088ff" floodOpacity="0.8" />
                    <feDropShadow dx="0" dy="0" stdDeviation="15" floodColor="#0088ff" floodOpacity="0.4" />
                  </filter>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                
                <path d="M40,40 L160,160" stroke="url(#xGradient)" strokeWidth="24" strokeLinecap="round" filter="url(#shadow)" />
                <path d="M160,40 L40,160" stroke="url(#xGradient)" strokeWidth="24" strokeLinecap="round" filter="url(#shadow)" />
                <path d="M50,50 L150,150" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.6" filter="url(#glow)" />
                <path d="M150,50 L50,150" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.6" filter="url(#glow)" />
                <circle cx="35" cy="35" r="3" fill="#00ccff" opacity="0.7">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="165" cy="165" r="3" fill="#00ccff" opacity="0.7">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="165" cy="35" r="3" fill="#00ccff" opacity="0.7">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                </circle>
                <circle cx="35" cy="165" r="3" fill="#00ccff" opacity="0.7">
                  <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
                </circle>
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold mb-2 text-center text-white tracking-wider">
          <div className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">MAGNI</div>
          <div className="text-2xl mt-2 text-gray-300">GROUP-X</div>
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm">SECURE TECHNOLOGY PANEL</p>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-300">Nama Lengkap</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Masukkan nama (contoh: Alvin)"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Cukup masukkan nama lengkap Anda</p>
          </div>
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3 text-gray-300">Password</label>
            <input
              type="password"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-700 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? "🔄 LOGIN..." : "🔐 LOGIN TO PANEL"}
          </button>
        </form>
        
        <p className="mt-6 text-sm text-gray-500 text-center">Forgot password? Contact admin MagniGroup-X.</p>
      </div>
    </div>
  );
}