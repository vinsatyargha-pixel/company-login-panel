// app/login/page.js - SIMPLE & WORKING
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem("magni_auth", "true");
    window.location.href = "/dashboard";
  };

  // Add CSS for glowing X
  const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .glowing-x {
        font-size: 120px;
        font-weight: 900;
        color: transparent;
        text-shadow: 
          0 0 10px #00f7ff,
          0 0 20px #00f7ff,
          0 0 30px #00f7ff,
          0 0 40px #0066ff,
          0 0 70px #0066ff,
          0 0 80px #0066ff;
        animation: x-glow 1.5s infinite alternate;
      }
      
      @keyframes x-glow {
        0% {
          text-shadow: 
            0 0 10px #00f7ff,
            0 0 20px #00f7ff,
            0 0 30px #00f7ff;
        }
        100% {
          text-shadow: 
            0 0 20px #00f7ff,
            0 0 30px #00f7ff,
            0 0 40px #0066ff,
            0 0 70px #0066ff,
            0 0 100px #0066ff;
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
        {/* GLOWING X SYMBOL */}
        <div className="glowing-x">X</div>
        
        {/* MAGNI TEXT */}
        <div className="magni-text">MAGNI</div>
        <div className="group-text">GROUP</div>
        <div className="panel-text">SECURE TECHNOLOGY PANEL</div>
        
        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} style={{ marginTop: "40px" }}>
          <div style={{ textAlign: "left", marginBottom: "20px" }}>
            <label style={{ color: "#88ccff" }}>Username/Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              placeholder="admin@magnigroupx.com"
              required
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
            />
          </div>
          
          <button type="submit" className="login-btn">
            LOGIN
          </button>
        </form>
        
        {/* FOOTER */}
        <div style={{ marginTop: "30px", color: "#6699ff", fontSize: "12px" }}>
          © 2025 Database Operational v3.0
        </div>
      </div>
    </div>
  );
}