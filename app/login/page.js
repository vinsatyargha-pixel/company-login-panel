// app/login/page.js - HANYA TAMBAHIN DI handleLogin
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // TAMBAH INI ↓
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    
    // TAMBAH INI ↓ - Loading state
    setIsLoading(true);
    
    // YANG SUDAH ADA ↓
    localStorage.setItem("magni_auth", "true");
    
    // TAMBAH INI ↓ - Set cookie untuk middleware
    const token = "magni-auth-" + Date.now();
    document.cookie = `auth-token=${token}; path=/; max-age=86400; SameSite=Lax`;
    
    // TAMBAH INI ↓ - Delay biar cookie kebaca
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 200);
    
    // JANGAN DIHAPUS YANG LAIN - CSS dan tampilan tetap sama
  };

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
              disabled={isLoading} // TAMBAH INI
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
              disabled={isLoading} // TAMBAH INI
            />
          </div>
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading} // TAMBAH INI
          >
            {/* TAMBAH INI ↓ */}
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