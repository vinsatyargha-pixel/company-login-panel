"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem("magni_auth", "true");
    localStorage.setItem("magni_user", email || "Admin");
    
    // Redirect to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl shadow-cyan-900/10">
        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-800/30 rounded-2xl mb-4">
              <span className="text-4xl">🔐</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                MAGNI
              </span>
              <span className="block text-2xl font-light text-gray-300 mt-2">GROUP-X</span>
            </h1>
            <p className="text-gray-400 text-sm mt-4 tracking-wider font-medium">
              SECURE TECHNOLOGY PANEL
            </p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-8">
          {/* EMAIL FIELD */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider">
              E-Mail
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-900/70 border-2 border-gray-800 rounded-xl text-lg placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none transition-all duration-300"
                placeholder="(contoh: Alvin@magnigroup.com)"
                required
              />
            </div>
            <p className="text-gray-500 text-xs italic mt-2">
              Cukup masukkan E-mail/magnigroup Anda
            </p>
          </div>

          {/* PASSWORD FIELD */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-900/70 border-2 border-gray-800 rounded-xl text-lg placeholder-gray-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 focus:outline-none transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-500 hover:from-cyan-500 hover:via-blue-500 hover:to-cyan-400 text-white font-bold text-lg rounded-xl shadow-lg shadow-cyan-900/30 hover:shadow-xl hover:shadow-cyan-900/40 transform hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0"
          >
            LOGIN TO PANEL
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-12 pt-8 border-t border-gray-800/50 text-center space-y-3">
          <p className="text-gray-500 text-sm font-medium">
            Forgot password? <span className="text-cyan-400">Contact admin</span>
          </p>
          <p className="text-gray-600 text-xs tracking-wider">
            MagniGroup-X.
          </p>
          <div className="mt-6 pt-4 border-t border-gray-900/50">
            <p className="text-gray-700 text-xs">
              © 2025 Database Operasional v3.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}