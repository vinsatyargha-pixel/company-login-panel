// app/login/page.js - CLEAN NEON X
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

  return (
    <div style={styles.container}>
      {/* Background */}
      <div style={styles.background}></div>
      
      <div style={styles.loginBox}>
        {/* X SYMBOL - CLEAN NEON */}
        <div style={styles.xSymbol}>✕</div>
        
        {/* TEXTS */}
        <h1 style={styles.magniText}>MAGNI</h1>
        <h2 style={styles.groupText}>GROUP</h2>
        <p style={styles.panelText}>SECURE TECHNOLOGY PANEL</p>
        
        {/* FORM */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username/Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="admin@magnigroupx.com"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button type="submit" style={styles.button}>
            LOGIN
          </button>
        </form>
        
        <div style={styles.footer}>
          © 2025 Database Operational v3.0
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    fontFamily: "'Arial', sans-serif"
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('https://images.pexels.com/photos/6654177/pexels-photo-6654177.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "brightness(0.4) contrast(1.2)",
    zIndex: 1
  },
  loginBox: {
    position: "relative",
    zIndex: 2,
    background: "rgba(0, 0, 0, 0.85)",
    border: "1px solid rgba(0, 100, 255, 0.3)",
    borderRadius: "15px",
    padding: "50px 40px",
    maxWidth: "450px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 0 40px rgba(0, 100, 255, 0.2)"
  },
  // X SYMBOL - CLEAN NEON
  xSymbol: {
    fontSize: "100px",
    fontWeight: "900",
    color: "#00ffff",
    textShadow: `
      0 0 10px #00ffff,
      0 0 20px #00ffff,
      0 0 30px #0066ff,
      0 0 40px #0066ff
    `,
    margin: "0 0 20px 0",
    lineHeight: "1",
    animation: "pulse 2s infinite alternate"
  },
  magniText: {
    fontSize: "42px",
    fontWeight: "bold",
    color: "#00ccff",
    margin: "10px 0 5px 0",
    letterSpacing: "2px"
  },
  groupText: {
    fontSize: "28px",
    color: "#66ccff",
    margin: "0 0 15px 0",
    letterSpacing: "3px"
  },
  panelText: {
    fontSize: "12px",
    color: "#88aaff",
    letterSpacing: "3px",
    marginBottom: "40px",
    textTransform: "uppercase"
  },
  form: {
    marginTop: "30px"
  },
  inputGroup: {
    marginBottom: "25px",
    textAlign: "left"
  },
  label: {
    display: "block",
    color: "#aaddff",
    fontSize: "14px",
    marginBottom: "8px",
    fontWeight: "500"
  },
  input: {
    width: "100%",
    padding: "15px",
    background: "rgba(10, 25, 47, 0.7)",
    border: "1px solid rgba(0, 150, 255, 0.5)",
    borderRadius: "8px",
    color: "white",
    fontSize: "16px"
  },
  button: {
    width: "100%",
    padding: "18px",
    background: "linear-gradient(45deg, #0066ff, #00aaff)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px"
  },
  footer: {
    marginTop: "40px",
    color: "#6699ff",
    fontSize: "12px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(0, 100, 255, 0.2)"
  }
};

// Add pulse animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% {
        text-shadow: 
          0 0 10px #00ffff,
          0 0 20px #00ffff,
          0 0 30px #0066ff;
      }
      100% {
        text-shadow: 
          0 0 15px #00ffff,
          0 0 30px #00ffff,
          0 0 45px #0066ff,
          0 0 60px #0066ff;
      }
    }
    
    input:focus {
      outline: none;
      border-color: #00ffff !important;
      box-shadow: 0 0 15px rgba(0, 255, 255, 0.3) !important;
    }
    
    button:hover {
      background: linear-gradient(45deg, #0088ff, #00ccff) !important;
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 100, 255, 0.3) !important;
    }
  `;
  document.head.appendChild(style);
}