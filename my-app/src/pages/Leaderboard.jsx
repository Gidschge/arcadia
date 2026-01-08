import React, { useState, useEffect } from "react";
import { 
  collectionGroup, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from "firebase/firestore";
import { db } from "../firebase";
import { GAMES } from "../games/registry";

export default function Leaderboard({ activeGameId }) {
  // State für das aktuell ausgewählte Spiel (Standard: Spiel aus URL oder erstes in Registry)
  const [selectedGame, setSelectedGame] = useState(activeGameId || GAMES[0]?.id);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Synchronisiert das Dropdown, wenn der User ein Spiel in der Mitte startet
  useEffect(() => {
    if (activeGameId) {
      setSelectedGame(activeGameId);
    }
  }, [activeGameId]);

  // Lädt die Daten neu, wenn sich das ausgewählte Spiel im Dropdown ändert
  useEffect(() => {
    if (selectedGame) {
      loadLeaderboard(selectedGame);
    }
  }, [selectedGame]);

  const loadLeaderboard = async (gameId) => {
    setLoading(true);
    try {
      // Abfrage über alle User-Dokumente hinweg nach dem Feld "gameId"
      const gamesQuery = query(
        collectionGroup(db, "games"),
        where("gameId", "==", gameId),
        orderBy("score", "desc"),
        limit(10)
      );

      const snapshot = await getDocs(gamesQuery);
      const topPlayers = snapshot.docs.map(doc => ({
        uid: doc.ref.parent.parent?.id || "unknown",
        ...doc.data()
      }));

      setLeaders(topPlayers);
    } catch (error) {
      console.error("Leaderboard Fehler:", error);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="homeWrap">
      <div className="panelTitle">🏆 TOP 10 HIGHSCORES</div>

      {/* Das Dropdown mit Arcadia-Styling */}
      <div className="leaderboardSelectWrapper" style={{ marginBottom: '20px' }}>
        <select 
          value={selectedGame} 
          onChange={(e) => setSelectedGame(e.target.value)}
          className="arcadiaSearch"
          style={{ 
            width: '100%', 
            maxWidth: 'none', 
            height: '42px', 
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {GAMES.map((g) => (
            <option key={g.id} value={g.id} style={{ background: '#0A1B55', color: 'white' }}>
              {g.name.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Rangliste */}
      {loading ? (
        <div className="homeCardMeta" style={{ textAlign: 'center', padding: '20px' }}>
          Daten werden geladen...
        </div>
      ) : leaders.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {leaders.map((player, i) => (
            <div 
              key={`${player.uid}-${i}`} 
              className="gameOverScore" 
              style={{ 
                padding: '10px 14px', 
                border: i === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid var(--stroke)',
                background: i === 0 ? 'rgba(255, 215, 0, 0.05)' : 'rgba(0,0,0,0.15)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  fontWeight: '900', 
                  fontSize: '16px',
                  color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--muted)',
                  minWidth: '25px'
                }}>
                  #{i + 1}
                </span>
                <span className="homeTitle" style={{ fontSize: '14px' }}>
                  {player.displayName || "Anonym"}
                </span>
              </div>
              <span className="bigScore" style={{ fontSize: '20px', color: '#4ade80' }}>
                {player.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="homeCardMeta" style={{ 
          textAlign: 'center', 
          padding: '30px 20px', 
          border: '1px dashed var(--stroke)', 
          borderRadius: 'var(--radius)' 
        }}>
          Noch keine Rekorde für dieses Spiel vorhanden.
        </div>
      )}
    </div>
  );
}