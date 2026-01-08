import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Ads from "./Ads.jsx";
import Leaderboard from "./Leaderboard.jsx";

export default function Layout() {
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // 1. Auth-Status überwachen & Schutz
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
            } else {
                // Wenn kein User eingeloggt ist, sofort zum Login zurückschicken
                navigate("/", { replace: true });
            }
        });
        return () => unsub();
    }, [navigate]);

    // 2. Logout-Logik
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // navigate wird bereits durch den useEffect oben ausgelöst,
            // aber wir können es hier zur Sicherheit auch explizit machen.
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Logout Fehler:", err);
        }
    };

    // 3. Spiel-ID aus URL für das Leaderboard extrahieren
    const pathParts = location.pathname.split("/");
    // Pfad ist /app/play/:gameId -> ["", "app", "play", "gameId"]
    const activeGameId = pathParts[2] === "play" ? pathParts[3] : "jumper";

    return (
        <div className="arcadiaRoot">
            <header className="arcadiaTopbar">
                <input className="arcadiaSearch" placeholder="Spiel suchen..." />
                
                <div 
                    className="arcadiaTitle" 
                    onClick={() => navigate("/app")} 
                    style={{ cursor: "pointer" }}
                >
                    Arcadia
                </div>

                <div className="arcadiaTopRight">
                    <div className="arcadiaCoins" style={{ marginRight: "15px" }}>
                        Coins: <strong>0</strong>
                    </div>
                    
                    {user && (
                        <div className="userStatus" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span className="userName">
                                👤 {user.displayName || user.email?.split("@")[0]}
                            </span>
                            <button className="arcadiaLogin" onClick={handleLogout}>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="arcadiaGrid">
                <aside className="arcadiaLeft">
                    <Ads />
                </aside>

                <section className="arcadiaCenter">
                    {/* Hier werden Home oder PlayGame gerendert */}
                    <Outlet />
                </section>

                <aside className="arcadiaRight">
                    <Leaderboard activeGameId={activeGameId} />
                </aside>
            </div>

            <footer style={{ textAlign: "center", padding: "10px", fontSize: "12px", opacity: 0.6 }}>
                © {new Date().getFullYear()} Arcadia — Retro Arcade
            </footer>
        </div>
    );
}