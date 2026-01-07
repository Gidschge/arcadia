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

  const Comp = items.find((i) => i.id === active)?.Comp ?? null;
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  // 🔍 Auth Listener
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

  return (
    <>
      <header>
        <div className="header-inner">
          <form className="search">
            <input placeholder="Search" aria-label="Search" />
          </form>

          <h1
            className="brand"
            onClick={() => setActive("home")}
            style={{ cursor: "pointer" }}
          >
            Arcadia
          </h1>

          <div className="account">
            <span>Coins: <strong>0</strong></span>

            {user && (
              <>
                <span style={{ margin: "0 12px" }}>
                  👤 {user.displayName || user.email}
                </span>

                <button className="btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <aside className="sidebar left">
          <Ads onOpen={setActive} />
        </aside>

        <section id="stage">
          <Suspense fallback={<div style={{ padding: 20 }}>Lade…</div>}>
            {active === "home" ? (
              <Home items={items} onOpen={setActive} />
            ) : (
              <Comp />
            )}
          </Suspense>
        </section>

        <aside className="sidebar right">
          <Leaderboard />
        </aside>
      </main>

      <footer>© {year} Arcadia</footer>
    </>
  );
}
