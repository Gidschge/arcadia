import React, { useState, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";

import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Home from "./Home.jsx";
import Ads from "./Ads.jsx";
import Leaderboard from "./Leaderboard.jsx";

import Jumper from "./games/Jumper.jsx";
import Stopper from "./games/Stopper.jsx";
import Dodge from "./games/Dodge.jsx";
import Stack from "./games/Stack.jsx";
import Knives from "./games/Knives.jsx";
import Runaway from "./games/Runaway.jsx";
import Balloon from "./games/Balloon.jsx";
import Clicker from "./games/Clicker.jsx";
import Simon from "./games/Simon.jsx";
import Mini2048 from "./games/Mini2048.jsx";

const items = [
  { id: "jumper", title: "One-Button Jumper", Comp: Jumper, logo: "🟦" },
  { id: "stopper", title: "Stop at the Right Time", Comp: Stopper, logo: "🎯" },
  { id: "dodge", title: "Falling Blocks Dodge", Comp: Dodge, logo: "🧱" },
  { id: "stack", title: "Stack Tower", Comp: Stack, logo: "🏗️" },
  { id: "knives", title: "Knife Thrower", Comp: Knives, logo: "🔪" },
  { id: "runaway", title: "Runaway Button", Comp: Runaway, logo: "🏃‍♂️" },
  { id: "balloon", title: "Balloon PRO", Comp: Balloon, logo: "🎈" },
  { id: "clicker", title: "Clicker PRO", Comp: Clicker, logo: "🥔" },
  { id: "simon", title: "Simon Says PRO", Comp: Simon, logo: "🟩" },
  { id: "mini2048", title: "Mini-2048 PRO", Comp: Mini2048, logo: "🔢" },
];

export default function App() {
  const [active, setActive] = useState("home");
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [headerGlow, setHeaderGlow] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Comp = items.find((i) => i.id === active)?.Comp ?? null;
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  // 🔐 Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) navigate("/login", { replace: true });
    });
    return () => unsub();
  }, [navigate]);

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    setActive("home");
  };

  // 🔍 Suche
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => {
        const title = item.title.toLowerCase();
        const id = item.id.toLowerCase();
        return title.includes(normalizedQuery) || id.includes(normalizedQuery);
      })
    : items;

  return (
    <div className="app-wrapper">
      {/* ✨ Gamified Header */}
      <header className={`header ${headerGlow ? "header--glow" : ""}`}>
        <div className="header-inner">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <span className="hamburger" />
          </button>

          <form
            className="search-container"
            onSubmit={(e) => {
              e.preventDefault();
              if (filteredItems.length > 0) {
                setActive(filteredItems[0].id);
              }
            }}
          >
            <div className="search-glass">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                placeholder="Finde dein nächstes Game..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setHeaderGlow(true)}
                onBlur={() => setHeaderGlow(false)}
              />
            </div>
          </form>

          <h1
            className="brand"
            onClick={() => {
              setActive("home");
              setQuery("");
            }}
          >
            <span className="brand-glow">Arcadia</span>
          </h1>

          <div className="header-actions">
            <div className="coins-display">
              <span className="coins-icon">🪙</span>
              <span className="coins-amount">1,247</span>
              <div className="coins-glow" />
            </div>

            {user ? (
              <div className="user-menu">
                <div className="user-avatar">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" />
                  ) : (
                    <span>{user.email?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <button className="logout-btn" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m4-4v4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4v-4m0 4H5" />
                  </svg>
                </button>
              </div>
            ) : (
              <span className="login-hint">Login für Leaderboards</span>
            )}
          </div>
        </div>
      </header>

      <main className={`main ${sidebarOpen ? "main--sidebar-open" : ""}`}>
        {/* Sidebar */}
        <aside className="sidebar left">
          <div className="sidebar-inner">
            <Ads onOpen={setActive} />
          </div>
        </aside>

        {/* Game Area */}
        <section id="stage" className="stage">
          <Suspense fallback={<div className="loading">Lade Game…</div>}>
            {active === "home" ? (
              <Home items={filteredItems} onOpen={setActive} />
            ) : (
              Comp && <Comp />
            )}
          </Suspense>
        </section>

        {/* Leaderboard */}
        <aside className="sidebar right">
          <div className="sidebar-inner">
            <Leaderboard />
          </div>
        </aside>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          © {year} Arcadia – <span className="footer-link">Datenschutz</span> |{" "}
          <span className="footer-link">Impressum</span>
        </div>
      </footer>
    </div>
  );
}
