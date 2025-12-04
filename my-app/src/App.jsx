import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // User-Status überwachen (WICHTIG!)
  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (current) => {
      setUser(current);

      if (!current) {
        navigate("/", { replace: true });
      }
    });

    return () => unSub();
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Logout Fehler:", err);
    }
  };

  // Ladebildschirm
  if (!user) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#0f163f",
        color: "white",
        fontFamily: "Arial, sans-serif"
      }}>
        Laden...
      </div>
    );
  }

  // ⬇️ Styles
  const containerStyle = {
    backgroundColor: "#0f163f",
    color: "white",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "clamp(16px, 3vw, 32px)"
  };

  const titleStyle = {
    marginBottom: "clamp(12px, 2.5vw, 24px)",
    fontSize: "clamp(28px, 6vw, 64px)",
    fontWeight: "bold",
    background: "linear-gradient(45deg, #4b61ff, #6376ff, #a3b2ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 20px rgba(75, 97, 255, 0.5)",
    animation: "glow 2s ease-in-out infinite alternate"
  };

  const dashboardStyle = {
    width: "100%",
    maxWidth: "520px",
    background: "linear-gradient(145deg, #1b2360, #2a3378)",
    borderRadius: "16px",
    padding: "clamp(18px, 3.2vw, 32px)",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    border: "1px solid rgba(75,97,255,0.3)"
  };

  const buttonStyle = {
    width: "100%",
    padding: "clamp(12px, 2.6vw, 16px)",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(45deg, #ef4444, #dc2626)",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "clamp(14px, 3vw, 16px)",
    boxShadow: "0 6px 20px rgba(239, 68, 68, 0.5)",
    transition: "all 0.3s ease"
  };

  const welcomeStyle = {
    fontSize: "1.8rem",
    marginBottom: "10px",
    color: "#a3b2ff"
  };

  const userInfoStyle = {
    fontSize: "1rem",
    marginBottom: "20px",
    color: "rgba(255,255,255,0.8)"
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Arcadia</div>

      <div style={dashboardStyle}>
        <h1 style={welcomeStyle}>🎉 Willkommen zurück!</h1>

        <div style={userInfoStyle}>
          Eingeloggt als:<br />
          <span style={{ color: "#4ade80", fontSize: "1.3rem" }}>
            {user.email}
          </span>
          <br />
          <small style={{ opacity: 0.6 }}>
            UID: {user.uid.slice(0, 8)}...
          </small>
        </div>

        {/* 🔥 HIER: Logout Button */}
        <button
          style={buttonStyle}
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 12px 25px rgba(239, 68, 68, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.4)";
          }}
        >
          🚪 Abmelden
        </button>

        <div style={{
          marginTop: "20px",
          animation: "float 3s ease-in-out infinite",
          fontSize: "0.9rem",
          opacity: 0.7
        }}>
          Dein Dashboard bekommt bald neue Features...
        </div>
      </div>
    </div>
  );
}

export default App;
