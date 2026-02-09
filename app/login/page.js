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

      {/* Logo X Tech Keren - Shutterstock Style */}
      <div className="absolute top-10 left-1/2 transform -translate-x-1/2 z-20">
        <svg 
          width="140" 
          height="140" 
          viewBox="0 0 200 200"
          className="filter drop-shadow-lg"
          style={{ filter: 'drop-shadow(0 0 25px rgba(0, 100, 255, 0.9))' }}
        >
          <defs>
            <linearGradient id="xGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0011FF" />
              <stop offset="50%" stopColor="#0088FF" />
              <stop offset="100%" stopColor="#00CCFF" />
            </linearGradient>
            <linearGradient id="xGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00CCFF" />
              <stop offset="50%" stopColor="#0088FF" />
              <stop offset="100%" stopColor="#0011FF" />
            </linearGradient>
            <filter id="neonGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="innerShadow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#00AAFF" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Outer Glow Ring */}
          <circle cx="100" cy="100" r="85" fill="none" stroke="url(#xGrad1)" strokeWidth="4" strokeDasharray="10 5" opacity="0.8" filter="url(#neonGlow)" />
          
          {/* Main X - Tebal dan solid */}
          <path d="M60,60 L140,140" stroke="url(#xGrad1)" strokeWidth="16" strokeLinecap="round" filter="url(#neonGlow)" />
          <path d="M140,60 L60,140" stroke="url(#xGrad2)" strokeWidth="16" strokeLinecap="round" filter="url(#neonGlow)" />
          
          {/* Inner X - Tipis untuk depth */}
          <path d="M70,70 L130,130" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <path d="M130,70 L70,130" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          
          {/* Tech dots pattern */}
          <circle cx="100" cy="100" r="50" fill="none" stroke="#00FFFF" strokeWidth="2" strokeDasharray="3 6" opacity="0.5" filter="url(#innerShadow)" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#0088FF" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
          
          {/* Center glowing dot */}
          <circle cx="100" cy="100" r="8" fill="url(#xGrad1)" filter="url(#neonGlow)" />
          <circle cx="100" cy="100" r="4" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Form Container */}
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96 border-2 border-yellow-500 relative z-10 backdrop-blur-sm bg-opacity-80 mt-24">
        <h1 className="text-4xl font-bold mb-4 text-center text-yellow-500 tracking-wider">
          <div>MAGNI</div>
          <div className="text-3xl mt-2">GROUP-X</div>
        </h1>
        <p className="text-center text-blue-300 mb-8 text-sm tracking-widest">ARTIFICIAL TECHNOLOGY PANEL</p>

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