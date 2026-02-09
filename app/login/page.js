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
      {/* Background wallpaper X-MEN */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')",
        }}
      ></div>

      {/* Overlay hitam biar teks terbaca */}
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* X besar kuning di belakang */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-[400px] font-bold text-yellow-500 opacity-15">X</div>
      </div>

      {/* Form */}
      <div className="bg-gray-900 p-10 rounded-2xl shadow-2xl w-96 border-2 border-yellow-500 relative z-10 backdrop-blur-sm bg-opacity-80">
        <h1 className="text-4xl font-bold mb-8 text-center text-yellow-500 tracking-wider">
          MagniGroup-X
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