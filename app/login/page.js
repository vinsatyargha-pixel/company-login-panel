// app/login/page.js - FINAL VERSION WITH BACKGROUND AND NEON EFFECT
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    
    localStorage.setItem("magni_auth", "true");
    localStorage.setItem("magni_user", email || "Admin");
    
    window.location.href = "/dashboard";
  };

  return (
    <div style={styles.container}>
      {/* BACKGROUND IMAGE */}
      <div style={styles.background}></div>
      
      {/* GLOW OVERLAY */}
      <div style={styles.glowEffect}></div>
      
      <div style={styles.loginContainer}>
        {/* LOGIN CARD */}
        <div style={styles.loginCard}>
          {/* HEADER WITH NEON TEXT */}
          <div style={styles.header}>
            <h1 style={styles.neonTitle}>MAGNI</h1>
            <h2 style={styles.neonSubtitle}>GROUP-X</h2>
            <p style={styles.neonTagline}>SECURE TECHNOLOGY PANEL</p>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} style={styles.form}>
            {/* USERNAME/EMAIL FIELD */}
            <div style={styles.inputContainer}>
              <label style={styles.inputLabel}>Username/Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.inputField}
                placeholder="admin@magnigroupx.com"
                required
              />
            </div>

            {/* PASSWORD FIELD */}
            <div style={styles.inputContainer}>
              <label style={styles.inputLabel}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputField}
                placeholder="••••••••"
                required
              />
            </div>

            {/* LOGIN BUTTON */}
            <button type="submit" style={styles.loginBtn}>
              <span style={styles.btnText}>LOGIN</span>
              <span style={styles.btnGlow}></span>
            </button>
          </form>

          {/* FOOTER */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              <span style={styles.highlight}>© 2025</span> Database Operational v3.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== STYLES =====
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Segoe UI', 'Arial', sans-serif"
  },
  
  // Background Image
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: "url('https://images.pexels.com/photos/6654177/pexels-photo-6654177.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    filter: "brightness(0.3) contrast(1.2)",
    zIndex: 1
  },
  
  // Glow Effect Overlay
  glowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at center, rgba(0, 100, 255, 0.15) 0%, transparent 70%)",
    zIndex: 2
  },
  
  loginContainer: {
    position: "relative",
    zIndex: 3,
    width: "100%",
    maxWidth: "450px"
  },
  
  loginCard: {
    background: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(0, 150, 255, 0.3)",
    borderRadius: "20px",
    padding: "50px 40px",
    boxShadow: "0 0 50px rgba(0, 100, 255, 0.3), inset 0 0 20px rgba(0, 100, 255, 0.1)"
  },
  
  header: {
    textAlign: "center",
    marginBottom: "50px"
  },
  
  // NEON TITLE EFFECT
  neonTitle: {
    fontSize: "4.5rem",
    fontWeight: "900",
    color: "#fff",
    textShadow: `
      0 0 5px #00a2ff,
      0 0 10px #00a2ff,
      0 0 20px #00a2ff,
      0 0 40px #0066ff,
      0 0 80px #0066ff
    `,
    letterSpacing: "2px",
    margin: "0 0 10px 0",
    animation: "neonPulse 2s infinite alternate"
  },
  
  neonSubtitle: {
    fontSize: "2.2rem",
    fontWeight: "700",
    color: "#00ccff",
    textShadow: `
      0 0 5px #00ccff,
      0 0 10px #00ccff,
      0 0 20px #0099ff
    `,
    margin: "0 0 20px 0",
    letterSpacing: "3px"
  },
  
  neonTagline: {
    fontSize: "0.9rem",
    color: "#66ccff",
    letterSpacing: "4px",
    textTransform: "uppercase",
    margin: "0",
    fontWeight: "300"
  },
  
  form: {
    marginBottom: "30px"
  },
  
  inputContainer: {
    marginBottom: "30px"
  },
  
  inputLabel: {
    display: "block",
    color: "#88ddff",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginBottom: "10px",
    letterSpacing: "1px"
  },
  
  inputField: {
    width: "100%",
    padding: "18px 20px",
    background: "rgba(0, 20, 40, 0.7)",
    border: "2px solid rgba(0, 150, 255, 0.4)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "1rem",
    transition: "all 0.3s ease",
    outline: "none"
  },
  
  loginBtn: {
    width: "100%",
    padding: "20px",
    background: "linear-gradient(135deg, #0066ff 0%, #00ccff 100%)",
    border: "none",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "1.2rem",
    fontWeight: "bold",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.3s ease",
    marginTop: "20px"
  },
  
  btnText: {
    position: "relative",
    zIndex: 2,
    letterSpacing: "2px"
  },
  
  btnGlow: {
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
    opacity: 0,
    transition: "opacity 0.3s ease"
  },
  
  footer: {
    textAlign: "center",
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(0, 150, 255, 0.2)"
  },
  
  footerText: {
    color: "#66aaff",
    fontSize: "0.85rem",
    letterSpacing: "1px"
  },
  
  highlight: {
    color: "#00ccff",
    fontWeight: "bold"
  }
};

// Add CSS animation
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes neonPulse {
      0% {
        text-shadow: 
          0 0 5px #00a2ff,
          0 0 10px #00a2ff,
          0 0 20px #00a2ff,
          0 0 40px #0066ff;
      }
      100% {
        text-shadow: 
          0 0 10px #00a2ff,
          0 0 20px #00a2ff,
          0 0 30px #00a2ff,
          0 0 60px #0066ff,
          0 0 80px #0066ff;
      }
    }
    
    input:focus {
      border-color: #00ccff !important;
      box-shadow: 0 0 15px rgba(0, 200, 255, 0.5) !important;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 100, 255, 0.4) !important;
    }
    
    button:hover .btnGlow {
      opacity: 1;
    }
  `;
  document.head.appendChild(styleSheet);
}