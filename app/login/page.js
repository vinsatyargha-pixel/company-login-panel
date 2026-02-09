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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/6654177/pexels-photo-6654177.jpeg')",
        }}
      ></div>

      {/* Form Container */}
      <div className="bg-gradient-to-br from-gray-900 to-black p-10 rounded-2xl shadow-2xl w-96 border border-gray-700 relative z-10">
        
        {/* Logo X PERSIS seperti XevasTech */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Outer glow */}
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full animate-pulse"></div>
            
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
                    <stop offset="100%" stopColor="#cccccc" />
                  </linearGradient>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#0066ff" floodOpacity="0.7" />
                  </filter>
                </defs>
                
                {/* X Shape - SIMPLE & CLEAN seperti gambar */}
                <path 
                  d="M40,40 L160,160" 
                  stroke="url(#xGradient)" 
                  strokeWidth="28" 
                  strokeLinecap="round"
                  filter="url(#shadow)"
                />
                <path 
                  d="M160,40 L40,160" 
                  stroke="url(#xGradient)" 
                  strokeWidth="28" 
                  strokeLinecap="round"
                  filter="url(#shadow)"
                />
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
              Username / Email
            </label>
            <input
              type="text"
              className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="admin@magnigroupx.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
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
            {loading ? "🔄 PROCESSING..." : "🔐 LOGIN TO PANEL"}
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