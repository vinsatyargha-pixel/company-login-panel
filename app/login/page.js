// app/login/page.js
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Install dulu: npm install react-icons

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State untuk toggle password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // ⭐⭐⭐ UPDATE HANDLE LOGIN ⭐⭐⭐
  const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");

  try {
    let loginEmail = email; // Default pake input

    // ✅ TAMBAHIN INI - CEK APAKAH INPUT PANEL ID
    if (!email.includes('@')) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', email.trim())  // Cari berdasarkan username
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('Panel ID tidak ditemukan');
      }

      loginEmail = userData.email; // Dapet email buat login
    }

    // Login pake email (tetap pake Supabase Auth)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: password.trim(),
    });

    if (error || !data.user) throw new Error(error?.message || "Login gagal");

    const { data: userProfile } = await supabase
      .from("users")
      .select("*")
      .eq("email", loginEmail)
      .single();

    localStorage.setItem(
      "magni_user",
      JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        panel_id: userProfile?.username || email,
        role: userProfile?.role || "officer",
        full_name: userProfile?.full_name || "",
      })
    );

    document.cookie = `auth-token=${data.user.id}; path=/; max-age=${60 * 60 * 24}`;
    window.location.href = "/dashboard";

  } catch (err) {
    alert(err.message);
  } finally {
    setIsLoading(false);
  }
};

  // CSS (sama seperti sebelumnya, tambah style untuk icon mata)
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
      
      /* Style untuk wrapper password */
      .password-wrapper {
        position: relative;
        width: 100%;
      }
      
      .password-input {
        width: 100%;
        padding: 15px;
        padding-right: 45px; /* Kasih ruang buat icon mata */
        background: rgba(0, 20, 40, 0.7);
        border: 1px solid #0066ff;
        border-radius: 8px;
        color: white;
        margin-top: 10px;
      }
      
      .eye-icon {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        color: #88aaff;
        font-size: 18px;
        user-select: none;
        z-index: 10;
      }
      
      .eye-icon:hover {
        color: #00ccff;
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
        <div className="glowing-x">X</div>
        
        <div className="magni-text">MAGNI</div>
        <div className="group-text">GROUP</div>
        <div className="panel-text">SECURE TECHNOLOGY PANEL</div>
        
        <form onSubmit={handleLogin} style={{ marginTop: "40px" }}>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ color: "#88ccff" }}>Panel ID</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder=""
              required
              disabled={isLoading}
            />
          </div>
          
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ color: "#88ccff" }}>Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="password-input"
                placeholder=""
                required
                disabled={isLoading}
              />
              <span 
                className="eye-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
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
          © 2026 Alaya-Vijnana System v3.0
        </div>
        <div className="flex justify-center items-center gap-4 mt-4">
          <img src="/images/nexus.png" alt="NEXUS" className="h-5 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity" />
          <img src="/images/logo-xen.png" alt="XEN" className="h-5 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}