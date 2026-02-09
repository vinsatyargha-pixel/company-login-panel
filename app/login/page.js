"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Username atau password salah");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/6654177/pexels-photo-6654177.jpeg')",
        }}
      ></div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* X besar di belakang */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-[400px] font-bold text-yellow-500 opacity-15">X</div>
      </div>

      {/* Logo X 3D Metallic - Mirip Gambar */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20">
        <svg 
          width="140" 
          height="140" 
          viewBox="0 0 200 200"
          className="filter drop-shadow-2xl"
          style={{ filter: 'drop-shadow(5px 5px 15px rgba(0, 0, 0, 0.7))' }}
        >
          <defs>
            {/* Metal gradient - silver metallic */}
            <linearGradient id="metalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0e0e0" />
              <stop offset="25%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#c0c0c0" />
              <stop offset="75%" stopColor="#a0a0a0" />
              <stop offset="100%" stopColor="#d0d0d0" />
            </linearGradient>
            
            {/* Shadow untuk 3D */}
            <filter id="shadow3D">
              <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.6" />
            </filter>
            
            {/* Highlight shine */}
            <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            
            {/* Inner shadow */}
            <filter id="innerShadow">
              <feDropShadow dx="-2" dy="-2" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background plate */}
          <rect x="30" y="30" width="140" height="140" rx="20" fill="url(#metalGrad)" filter="url(#shadow3D)" />
          
          {/* Main X - Tebal 3D */}
          <path 
            d="M60,60 L140,140" 
            stroke="url(#metalGrad)" 
            strokeWidth="20" 
            strokeLinecap="round"
            filter="url(#innerShadow)"
          />
          <path 
            d="M140,60 L60,140" 
            stroke="url(#metalGrad)" 
            strokeWidth="20" 
            strokeLinecap="round"
            filter="url(#innerShadow)"
          />
          
          {/* X outline */}
          <path d="M60,60 L140,140" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          <path d="M140,60 L60,140" stroke="#333333" strokeWidth="2" strokeLinecap="round" />
          
          {/* Shine effect */}
          <rect x="30" y="30" width="140" height="140" rx="20" fill="url(#shine)" fillOpacity="0.3" />
          
          {/* Corner accents */}
          <circle cx="50" cy="50" r="8" fill="#ffffff" opacity="0.8" />
          <circle cx="150" cy="50" r="8" fill="#ffffff" opacity="0.8" />
          <circle cx="50" cy="150" r="8" fill="#ffffff" opacity="0.8" />
          <circle cx="150" cy="150" r="8" fill="#ffffff" opacity="0.8" />
          
          {/* Center dot */}
          <circle cx="100" cy="100" r="12" fill="#333333" />
          <circle cx="100" cy="100" r="6" fill="#ffffff" />
        </svg>
      </div>

      {/* Form Container */}
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96 border-2 border-yellow-500 relative z-10 backdrop-blur-sm bg-opacity-80 mt-24">
        <h1 className="text-4xl font-bold mb-2 text-center text-yellow-500 tracking-wider">
          <div>MAGNI</div>
          <div className="text-3xl mt-2">GROUP-X</div>
        </h1>
        <p className="text-center text-gray-300 mb-8 text-sm tracking-widest">SECURE ACCESS PANEL</p>

        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-yellow-300">
              Username / Email
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border-2 border-yellow-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="admin@magnigroupx.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-sm font-medium mb-3 text-yellow-300">
              Password
            </label>
            <input
              type="password"
              className="w-full p-3 bg-gray-800 border-2 border-yellow-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="mb-6 p-3 bg-red-900 border-2 border-red-600 text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? "🔄 MEMPROSES..." : "🔐 ACCESS PANEL"}
          </button>
        </form>
        <p className="mt-6 text-sm text-gray-300 text-center">
          Lupa password? Hubungi admin MagniGroup-X.
        </p>
      </div>
    </div>
  );
}