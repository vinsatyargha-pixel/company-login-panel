// app/login/page.js - HANYA UPDATE handleLogin SAJA
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@magnigroupx.com");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ⭐⭐⭐ HANYA INI YANG DIUBAH ⭐⭐⭐
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. HARDCODED VALIDATION - HANYA EMAIL & PASSWORD INI YANG BISA
      const validCredentials = [
        { email: "admin@magnigroupx.com", password: "admin123" },
        { email: "supervisor@magnigroupx.com", password: "super123" },
        { email: "officer@magnigroupx.com", password: "officer123" }
      ];

      // 2. Cek apakah email valid
      if (!email.includes('@magnigroupx.com')) {
        throw new Error('Hanya email @magnigroupx.com yang diizinkan');
      }

      // 3. Cek apakah credentials sesuai
      const isValid = validCredentials.some(
        cred => cred.email === email && cred.password === password
      );

      if (!isValid) {
        throw new Error('Email atau password salah');
      }

      // 4. JIKA VALID, simpan ke database (track login)
      await supabase
        .from('login_attempts')
        .insert([{
          email: email,
          status: 'success',
          ip_address: 'web',
          user_agent: navigator.userAgent
        }]);

      // 5. Set authentication
      localStorage.setItem("magni_auth", "true");
      localStorage.setItem("magni_user", email);
      
      const token = "magni-auth-" + Date.now();
      document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `magni-user=${email}; path=/; max-age=86400`;

      // 6. Redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 200);

    } catch (err) {
      console.error("Login error:", err);
      
      // Simpan failed attempt ke database
      await supabase
        .from('login_attempts')
        .insert([{
          email: email,
          status: 'failed',
          error_message: err.message,
          ip_address: 'web'
        }]);
      
      // Tampilkan error (opsional)
      alert(`Login gagal: ${err.message}`);
      
    } finally {
      setIsLoading(false);
    }
  };
  // ⭐⭐⭐ SAMPAI SINI ⭐⭐⭐

  // CSS glowing X TETAP SAMA PERSIS ↓
  const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .glowing-x {
        font-family: Impact, Arial Black, sans-serif;
        font-size: 120px;
        font-weight: 900;
        letter-spacing: -5px;
        background: linear-gradient(
          135deg,
          #f5f5f5 0%,
          #9a9a9a 40%,
          #ffffff 50%,
          #7a7a7a 60%,
          #eaeaea 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow:
          0 0 6px rgba(0, 247, 255, 0.6),
          0 0 14px rgba(0, 247, 255, 0.4),
          0 0 30px rgba(0, 102, 255, 0.3);
        animation: neon-breathe 2s ease-in-out infinite;
      }
      
      @keyframes neon-breathe {
        from {
          text-shadow:
            0 0 4px rgba(0, 247, 255, 0.4),
            0 0 10px rgba(0, 247, 255, 0.3),
            0 0 20px rgba(0, 102, 255, 0.2);
        }
        to {
          text-shadow:
            0 0 8px rgba(0, 247, 255, 0.8),
            0 0 20px rgba(0, 247, 255, 0.6),
            0 0 40px rgba(0, 102, 255, 0.5);
        }
      }
      
      .magni-text {
        font-size: 48px;
        font-weight: bold;
        color: #00ccff;
        text-shadow: 0 0 10px rgba(0, 204, 255, 0.5);
      }
      
      .group-text {
        font-size: 32px;
        color: #66ccff;
        letter-spacing: 5px;
      }
      
      .panel-text {
        color: #88aaff;
        letter-spacing: 3px;
        font-size: 14px;
        margin-top: 10px;
      }
      
      .login-input {
        width: 100%;
        padding: 15px;
        background: rgba(0, 20, 40, 0.7);
        border: 1px solid #0066ff;
        border-radius: 8px;
        color: white;
        margin-top: 10px;
      }
      
      .login-btn {
        width: 100%;
        padding: 15px;
        background: #0066ff;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 18px;
        font-weight: bold;
        margin-top: 20px;
        cursor: pointer;
        transition: opacity 0.3s;
      }
      
      .login-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      body {
        background: url('https://images.pexels.com/photos/6654177/pexels-photo-6654177.jpeg') center/cover no-repeat;
        background-attachment: fixed;
        min-height: 100vh;
        margin: 0;
        font-family: Arial, sans-serif;
      }
      
      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
      }
      
      .login-box {
        background: rgba(0, 0, 0, 0.8);
        padding: 40px;
        border-radius: 15px;
        border: 1px solid #0066ff;
        max-width: 400px;
        width: 100%;
        text-align: center;
      }
    `;
    document.head.appendChild(style);
  };

  if (typeof window !== "undefined") {
    addStyles();
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* GLOWING X TETAP ADA ↓ */}
        <div className="glowing-x">X</div>
        
        <div className="magni-text">MAGNI</div>
        <div className="group-text">GROUP</div>
        <div className="panel-text">SECURE TECHNOLOGY PANEL</div>
        
        <form onSubmit={handleLogin} style={{ marginTop: "40px" }}>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ color: "#88ccff" }}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="admin@magnigroupx.com"
              required
              disabled={isLoading}
            />
          </div>
          
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ color: "#88ccff" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? "AUTHENTICATING..." : "LOGIN"}
          </button>
        </form>
        
        <div style={{ marginTop: "30px", color: "#6699ff", fontSize: "12px" }}>
          © 2025 Database Operational v3.0
        </div>
      </div>
    </div>
  );
}