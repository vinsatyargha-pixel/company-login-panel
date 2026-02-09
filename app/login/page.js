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

      {/* Logo X Tech - DITAMBAHKAN */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-20">
        <svg 
          width="100" 
          height="100" 
          viewBox="0 0 120 120"
          className="filter drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 0 15px rgba(234, 179, 8, 0.7))' }}
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r="55" fill="none" stroke="url(#grad1)" strokeWidth="3" strokeDasharray="8 4" />
          <path d="M40,40 L80,80" stroke="url(#grad2)" strokeWidth="6" strokeLinecap="round" filter="url(#glow)" />
          <path d="M80,40 L40,80" stroke="url(#grad2)" strokeWidth="6" strokeLinecap="round" filter="url(#glow)" />
          <circle cx="60" cy="60" r="20" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2 4" opacity="0.7" />
          <circle cx="60" cy="60" r="35" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1 3" opacity="0.5" />
        </svg>
      </div>

      {/* Form Container */}
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96 border-2 border-yellow-500 relative z-10 backdrop-blur-sm bg-opacity-80">
        <h1 className="text-4xl font-bold mb-6 text-center text-yellow-500 tracking-wider">
          <div>MAGNI</div>
          <div className="text-3xl mt-2">GROUP-X</div>
        </h1>

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
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-black font-bold py-3 rounded-lg transition duration-200 disabled:opacity-50 shadow-lg"
            disabled={loading}
          >
            {loading ? "🔄 MEMPROSES..." : "🔐 LOGIN"}
          </button>
        </form>
        <p className="mt-6 text-sm text-gray-300 text-center">
          Lupa password? Hubungi admin MagniGroup-X.
        </p>
      </div>
    </div>
  );
}