// app/login/page.js - MINIMAL VERSION
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("magni_auth", "true");
      localStorage.setItem("magni_user", email || "test@magni.com");
    }
    // Redirect
    window.location.href = "/dashboard";
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#000",
      color: "white",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#111",
        padding: "40px",
        borderRadius: "20px",
        border: "1px solid #333",
        maxWidth: "400px",
        width: "100%"
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "bold",
          background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: "10px",
          textAlign: "center"
        }}>
          🔐 MAGNI GROUP-X
        </h1>
        
        <p style={{ color: "#999", textAlign: "center", marginBottom: "30px" }}>
          Database Operasional v3.0
        </p>
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#ccc", marginBottom: "8px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#222",
                border: "1px solid #444",
                borderRadius: "10px",
                color: "white"
              }}
              placeholder="admin@magni.com"
            />
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#ccc", marginBottom: "8px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                backgroundColor: "#222",
                border: "1px solid #444",
                borderRadius: "10px",
                color: "white"
              }}
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer"
            }}
          >
            LOGIN TO DASHBOARD
          </button>
          
          <p style={{ 
            color: "#666", 
            fontSize: "12px", 
            textAlign: "center",
            marginTop: "30px",
            paddingTop: "20px",
            borderTop: "1px solid #333"
          }}>
            © 2025 Magni Group-X • Enter any credentials
          </p>
        </form>
      </div>
    </div>
  );
}