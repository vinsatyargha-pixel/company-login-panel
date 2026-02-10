// app/dashboard/page.js - bagian awal
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Simple auth check
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("magni_auth");
      const userEmail = localStorage.getItem("magni_user");
      
      if (auth !== "true") {
        router.push("/login");
      } else {
        setUser(userEmail || "Admin");
        setLoading(false);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("magni_auth");
    localStorage.removeItem("magni_user");
    router.push("/login");
  };

  if (loading) {
    return <div style={{ padding: 50, textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#000",
      color: "white",
      padding: "20px"
    }}>
      <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "20px" }}>
        Welcome to Magni Dashboard, {user}!
      </h1>
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Logout
      </button>
      <p style={{ marginTop: "20px", color: "#999" }}>
        Dashboard functionality will be added soon.
      </p>
    </div>
  );
}