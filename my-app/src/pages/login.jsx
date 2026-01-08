import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";

function LoginComponent() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); // ⬅️ neu

  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        navigate("/app", { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ➕ REGISTRIEREN inkl Username
  const handleRegister = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // username speichern
      await updateProfile(res.user, {
        displayName: username
      });

      setMessage(`✅ Konto erstellt: ${username}`);
      setTimeout(() => navigate("/app", { replace: true }), 800);
    } catch (err) {
      setMessage(`❌ Fehler: ${err.message}`);
    }
  };

  // 🔑 LOGIN
  const handleLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setMessage(
        `✅ Willkommen: ${res.user.displayName || res.user.email}`
      );
      setTimeout(() => navigate("/app", { replace: true }), 800);
    } catch (err) {
      setMessage(`❌ Fehler: ${err.message}`);
    }
  };

  // ---------- STYLES (deins, unverändert) ----------
  const containerStyle = {
    backgroundColor: "#0f163f",
    color: "white",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  };

  const titleStyle = {
    marginBottom: "clamp(12px, 2.5vw, 24px)",
    fontSize: "clamp(28px, 6vw, 64px)",
    fontWeight: "bold",
    background: "linear-gradient(45deg, #4b61ff, #6376ff, #a3b2ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    textShadow: "0 0 20px rgba(75, 97, 255, 0.5)",
    animation: "glow 2s ease-in-out infinite alternate"
  };

  const sceneStyle = {
    width: "100%",
    maxWidth: "440px",
    margin: "0 auto",
    perspective: "1000px"
  };

  const cardWrapperStyle = {
    position: "relative",
    width: "100%",
    transformStyle: "preserve-3d",
    transition: "transform 0.8s",
    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
  };

  const cardFaceBase = {
    position: "relative",
    width: "100%",
    backfaceVisibility: "hidden",
    background: "linear-gradient(145deg, #1b2360, #2a3378)",
    borderRadius: "16px",
    padding: "clamp(16px, 3vw, 28px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "clamp(8px, 2vw, 16px)",
    alignItems: "center",
    textAlign: "center",
    border: "1px solid rgba(75, 97, 255, 0.3)",
    backgroundClip: "padding-box"
  };

  const cardFrontStyle = { ...cardFaceBase };
  const cardBackStyle = { ...cardFaceBase, transform: "rotateY(180deg)", position: "absolute", top: 0, left: 0 };

  const inputStyle = {
    width: "100%",
    padding: "clamp(10px, 2.3vw, 14px)",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "white",
    fontSize: "clamp(14px, 2.8vw, 16px)",
    backdropFilter: "blur(10px)"
  };

  const buttonStyle = {
    width: "100%",
    padding: "clamp(12px, 2.6vw, 16px)",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(45deg, #4b61ff, #6376ff)",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  };

  const linkButtonStyle = {
    width: "100%",
    padding: "clamp(10px, 2.3vw, 14px)",
    borderRadius: "12px",
    border: "1px solid rgba(75, 97, 255, 0.6)",
    backgroundColor: "transparent",
    color: "#4b61ff",
    cursor: "pointer",
    fontWeight: "bold"
  };

  const messageStyle = {
    marginTop: "1.5rem",
    fontWeight: "bold",
    color: message.startsWith("✅") ? "#4ade80" : "#f87171",
    fontSize: "0.9rem"
  };

  return (
    <div style={containerStyle}>
      <div style={titleStyle}>Arcadia</div>

      <div style={sceneStyle}>
        <div style={cardWrapperStyle}>

          {/* LOGIN */}
          <div style={cardFrontStyle}>
            <h2>Anmelden</h2>

            <input
              style={inputStyle}
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={inputStyle}
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={buttonStyle} onClick={handleLogin}>
              Anmelden
            </button>

            <button
              style={linkButtonStyle}
              onClick={() => setIsFlipped(true)}
            >
              Kein Konto? Registrieren
            </button>

            <p style={messageStyle}>{message}</p>
          </div>

          {/* REGISTER */}
          <div style={cardBackStyle}>
            <h2>Registrieren</h2>

            <input
              style={inputStyle}
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              style={inputStyle}
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              style={inputStyle}
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button style={buttonStyle} onClick={handleRegister}>
              Konto erstellen
            </button>

            <button
              style={linkButtonStyle}
              onClick={() => setIsFlipped(false)}
            >
              Bereits Konto? Anmelden
            </button>

            <p style={messageStyle}>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginComponent;
