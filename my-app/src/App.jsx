import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleRegister = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setMessage(`✅ Konto erstellt: ${res.user.email}`);
    } catch (err) {
      setMessage(`❌ Fehler: ${err.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setMessage(`✅ Angemeldet als: ${res.user.email}`);
    } catch (err) {
      setMessage(`❌ Fehler: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setMessage("✅ Abgemeldet");
  };

  // Container-Styles passend zum Mainpage-Design
  const containerStyle = {
    backgroundColor: "#0f163f", // dunkles Blau
    color: "white",
    fontFamily: "Arial, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "2rem",
  };

  const cardStyle = {
    backgroundColor: "#1b2360", // etwas helleres Blau für Boxen
    borderRadius: "12px",
    padding: "2rem",
    width: "320px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  };

  const inputStyle = {
    width: "90%",
    padding: "0.5rem",
    margin: "0.5rem 0",
    borderRadius: "8px",
    border: "none",
  };

  const buttonStyle = {
    width: "45%",
    padding: "0.5rem",
    margin: "0.5rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#4b61ff",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const messageStyle = {
    marginTop: "1rem",
    fontWeight: "bold",
    color: message.startsWith("✅") ? "#0f0" : "#f55",
  };

  if (user) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2>Willkommen, {user.email}!</h2>
          <button style={buttonStyle} onClick={handleLogout}>
            Abmelden
          </button>
          <p style={messageStyle}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2>Login / Registrierung</h2>
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
        <div>
          <button style={buttonStyle} onClick={handleRegister}>
            Registrieren
          </button>
          <button style={buttonStyle} onClick={handleLogin}>
            Anmelden
          </button>
        </div>
        <p style={messageStyle}>{message}</p>
      </div>
    </div>
  );
}

export default App;
