"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const findUserEmail = async (input) => {
    if (input.includes('@')) {
      return input;
    }
    
    const { data: officer } = await supabase
      .from('officers')
      .select('email')
      .or(`username.ilike.%${input}%,full_name.ilike.%${input}%,email.ilike.%${input}%`)
      .maybeSingle();

    return officer?.email || null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // OPTION 1: Skip officers check langsung login dengan input
      // const userEmail = identifier;
      
      // OPTION 2: Cari email di officers dulu
      const userEmail = await findUserEmail(identifier);
      
      if (!userEmail) {
        setError(`"${identifier}" tidak ditemukan. Coba: alvin@magingroupx.com`);
        setLoading(false);
        return;
      }
      
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: password
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError(`Password salah untuk ${userEmail}`);
        } else {
          setError(`Error: ${authError.message}`);
        }
        setLoading(false);
        return;
      }
      
      // SUKSES - Simpan ke localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      router.push("/dashboard");
      
    } catch (err) {
      console.error('System error:', err);
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  // Setup test function hanya di client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.testLogin = async (testEmail = 'alvin@magingroupx.com', testPass = 'Magni123!') => {
        console.log('Testing login dengan:', testEmail);
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPass
        });
        
        if (error) {
          console.error('TEST FAILED:', error.message);
          alert(`TEST GAGAL:\n\n${error.message}`);
          return false;
        }
        
        console.log('TEST SUCCESS! User:', data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert(`TEST SUKSES!\n\nLogin sebagai: ${data.user.email}`);
        return true;
      };
    }
  }, []);

  const setTestAccount = () => {
    setIdentifier('alvin@magingroupx.com');
    setPassword('Magni123!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="bg-gray-800/80 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
        
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">MAGNI GROUP-X</h1>
          <p className="text-gray-400 mt-2">Secure Access Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nama atau Email
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="alvin atau alvin@magingroupx.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 border border-red-700 text-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : (
              '🔐 LOGIN'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="bg-blue-900/20 p-4 rounded-lg mb-4">
            <p className="text-blue-300 font-semibold mb-2">🧪 TEST ACCOUNT:</p>
            <p className="text-white text-sm">Email: <code className="bg-gray-900 px-2 py-1 rounded">alvin@magingroupx.com</code></p>
            <p className="text-white text-sm mt-1">Password: <code className="bg-gray-900 px-2 py-1 rounded">Magni123!</code></p>
            <button
              onClick={setTestAccount}
              className="mt-3 text-sm text-cyan-400 hover:text-cyan-300 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto-fill test credentials
            </button>
          </div>

          <p className="text-gray-500 text-sm text-center">
            Pastikan user sudah dibuat di{' '}
            <a 
              href="https://app.supabase.com" 
              target="_blank" 
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Supabase Dashboard → Authentication → Users
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}