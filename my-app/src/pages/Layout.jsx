import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom"; // 🔥 useSearchParams hinzugefügt
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

import Ads from "./Ads.jsx";
import Leaderboard from "./Leaderboard.jsx";

export default function Layout() {
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    
    // 🔥 Such-Parameter Hook
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get("q") || "";

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
            } else {
                navigate("/", { replace: true });
            }
        });
        return () => unsub();
    }, [navigate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/", { replace: true });
        } catch (err) {
            console.error("Logout Fehler:", err);
        }
    };

    // 🔥 Such-Funktion: Aktualisiert die URL und springt zur Home-Ansicht, falls man gerade spielt
    const handleSearch = (e) => {
        const value = e.target.value;
        
        // Wenn wir nicht auf /app sind, leiten wir dorthin um, damit man die Ergebnisse sieht
        if (location.pathname !== "/app") {
            navigate(`/app?q=${encodeURIComponent(value)}`);
        } else {
            // Ansonsten updaten wir nur den Parameter in der URL
            setSearchParams(value ? { q: value } : {});
        }
    };

    const pathParts = location.pathname.split("/");
    const activeGameId = pathParts[2] === "play" ? pathParts[3] : "jumper";

    return (
        <div className="arcadiaRoot">
            <header className="arcadiaTopbar">
                {/* 🔥 Input jetzt mit value und onChange verbunden */}
                <input 
                    className="arcadiaSearch" 
                    placeholder="Spiel suchen..." 
                    value={searchQuery}
                    onChange={handleSearch}
                />
                
                <div 
                    className="arcadiaTitle" 
                    onClick={() => {
                        setSearchParams({}); // Suche beim Klick auf Titel löschen
                        navigate("/app");
                    }} 
                    style={{ cursor: "pointer" }}
                >
                    Arcadia
                </div>

                <div className="arcadiaTopRight">        
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