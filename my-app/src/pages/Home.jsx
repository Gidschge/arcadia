import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GAMES } from "../games/registry";

// 🔥 Die fehlende Komponente definieren oder importieren
function GameCard({ game }) {
  return (
    <Link to={`/app/play/${game.id}`} className="homeCard">
      <div className="homeCardIcon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
        {game.emoji || "🎮"}
      </div>
      <div className="homeCardName">{game.name}</div>
      <div className="homeCardMeta">
        {game.description || "Klicke zum Starten"}
      </div>
    </Link>
  );
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";

  // Spiele basierend auf der Suche aus dem Layout filtern
  const filteredGames = GAMES.filter(game => 
    game.name.toLowerCase().includes(query) || 
    game.id.toLowerCase().includes(query)
  );

  return (
    <div className="homeWrap">
      <div className="homeHeader">
        <h2 className="homeTitle">
          {query ? `Ergebnisse für "${query}"` : "Entdecke Arcadia"}
        </h2>
  
      </div>
      
      <div className="homeGrid">
        {filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        ) : (
          <div className="homeCardMeta" style={{ gridColumn: "1/-1", padding: "60px", textAlign: "center", border: "1px dashed var(--stroke)", borderRadius: "18px" }}>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>🔍</div>
            Kein Spiel gefunden, das zu <strong>"{query}"</strong> passt.
          </div>
        )}
      </div>
    </div>
  );
}