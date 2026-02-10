"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState(""); // Bisa NAMA atau EMAIL
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fungsi cari user berdasarkan NAMA atau EMAIL
  async function findUserByIdentifier(identifier) {
    const cleanIdentifier = identifier.trim();
    console.log('🔍 [DEBUG] Mencari user dengan:', cleanIdentifier);
    
    try {
      // 1. Coba cari berdasarkan EMAIL (exact match)
      const { data: byEmail, error: emailError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('email', cleanIdentifier)
        .single();
      
      if (byEmail && !emailError) {
        console.log('✅ [DEBUG] Ditemukan via email:', byEmail.full_name);
        return byEmail;
      }
      
      // 2. Jika email tidak ditemukan, cari berdasarkan NAMA (case-insensitive, partial match)
      const { data: byName, error: nameError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .ilike('full_name', `%${cleanIdentifier}%`)
        .single();
      
      if (byName && !nameError) {
        console.log('✅ [DEBUG] Ditemukan via nama:', byName.full_name);
        return byName;
      }
      
      // 3. Tidak ditemukan sama sekali
      console.log('❌ [DEBUG] User tidak ditemukan via email atau nama');
      return null;
      
    } catch (error) {
      console.error('❌ [DEBUG] Error query:', error);
      return null;
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Cari user berdasarkan input (bisa email atau nama)
      const userData = await findUserByIdentifier(identifier);
      
      if (!userData) {
        setError("User tidak ditemukan. Cek nama atau email Anda.");
        setLoading(false);
        return;
      }
      
      // Login dengan Supabase Auth menggunakan EMAIL yang ditemukan
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password,
      });

      if (authError) {
        setError("Password salah");
      } else {
        console.log('✅ Login sukses:', userData.full_name);
        
        // Simpan data user ke localStorage
        localStorage.setItem('user_data', JSON.stringify({
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          last_login: new Date().toISOString()
        }));
        
        // Redirect ke dashboard setelah 1 detik
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      setError("Terjadi kesalahan sistem. Coba lagi.");
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
        
        {/* Logo X dengan BUNTAK/JET EFFECT */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Glow pulse effect */}
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            
            {/* Jet trail 1 - kiri atas ke kanan bawah */}
            <div className="absolute -top-2 -left-2 w-32 h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-60 animate-ping"></div>
            <div className="absolute -top-1 -left-1 w-24 h-1 bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80 animate-pulse"></div>
            
            {/* Jet trail 2 - kanan atas ke kiri bawah */}
            <div className="absolute -top-2 -right-2 w-32 h-2 bg-gradient-to-l from-transparent via-blue-400 to-transparent opacity-60 animate-ping" style={{ animationDelay: '0.3s' }}></div>
            <div className="absolute -top-1 -right-1 w-24 h-1 bg-gradient-to-l from-transparent via-cyan-300 to-transparent opacity=80 animate-pulse" style={{ animationDelay: '0.3s' }}></div>

            {/* Main X Symbol */}
            <div className="relative">
              <svg 
                width="120" 
                height="120" 
                viewBox="0 0 200 200"
                className="relative z-10"
              >
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
                
                {/* X Shape dengan efek jet trail */}
                <path 
                  d="M40,40 L160,160" 
                  stroke="url(#xGradient)" 
                  strokeWidth="24" 
                  strokeLinecap="round"
                  filter="url(#shadow)"
                />
                <path 
                  d="M160,40 L40,160" 
                  stroke="url(#xGradient)" 
                  strokeWidth="24" 
                  strokeLinecap="round"
                  filter="url(#shadow)"
                />
                
                {/* Inner highlight */}
                <path 
                  d="M50,50 L150,150" 
                  stroke="#ffffff" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  opacity="0.6"
                  filter="url(#glow)"
                />
                <path 
                  d="M150,50 L50,150" 
                  stroke="#ffffff" 
                  strokeWidth="4" 
                  strokeLinecap="round"
                  opacity="0.6"
                  filter="url(#glow)"
                />
                
                {/* Jet trail dots */}
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
          <div className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            MAGNI
          </div>
          <div className="text-2xl mt-2 text-gray-300">GROUP-X</div>
        </h1>
        <p className="text-center text-gray-400 mb-8 text-sm">SECURE TECHNOLOGY PANEL</p>

        {/* Form */}
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              Nama atau Email
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Masukkan nama (contoh: Alvin) atau email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Bisa pakai Nama Lengkap atau Email
            </p>
          </div>
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3 text-gray-300">
              Password
            </label>
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
        
        {/* Footer */}
        <p className="mt-6 text-sm text-gray-500 text-center">
          Forgot password? Contact admin MagniGroup-X.
        </p>
      </div>
    </div>
  );
}