import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GAMES } from "../games/registry";
import { getThumbnail } from "../games/thumbnails"; // 🔥 Wichtig: Pfad prüfen!

/**
 * GameCard Komponente
 * Nutzt die getThumbnail Funktion für das visuelle Cover
 */
function GameCard({ game }) {
  // Generiert das SVG-Cover basierend auf der Game-ID aus deiner thumbnail.js
  const thumb = getThumbnail(game.id);

  return (
    <Link to={`/app/play/${game.id}`} className="homeCard">
      {/* Thumbnail Bereich */}
      <div className="homeCardThumbnail">
        <img 
          src={thumb} 
          alt={game.name} 
          loading="lazy"
        />
        {/* Optionaler Overlay-Effekt */}
        <div className="cardOverlay"></div>
      </div>
      
      {/* Info Bereich */}
      <div className="homeCardInfo">
        <div className="homeCardName">
          {game.emoji} {game.name}
        </div>
        <div className="homeCardMeta">
          {game.description || "Highscore jagen!"}
        </div>
      </div>
    </Link>
  );
}

/**
 * Hauptkomponente der Startseite
 */
export default function Home() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() || "";

  // Filter-Logik: Reagiert auf die Suche aus der Topbar (Layout.jsx)
  const filteredGames = GAMES.filter(game => 
    game.name.toLowerCase().includes(query) || 
    game.id.toLowerCase().includes(query)
  );

  return (
    <div className="homeWrap">
      <header className="homeHeader">
        <h2 className="homeTitle">
          {query ? `Suche: "${query}"` : "Entdecke Arcadia"}
        </h2>
           </header>
      
      <div className="homeGrid">
        {filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <GameCard key={game.id} game={game} />
          ))
        ) : (
          <div className="noResults">
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>🕵️‍♂️</div>
            <h3>Keine Treffer für "{query}"</h3>
            <p className="homeCardMeta">Probiere es mit einem anderen Suchbegriff.</p>
          </div>
        )}
      </div>
    </div>
  );
}