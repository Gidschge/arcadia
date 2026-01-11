import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GAMES } from "../games/registry";
import { getThumbnail } from "../games/thumbnails";

/**
 * GameCard Komponente
 */
function GameCard({ game }) {
  const thumb = getThumbnail(game.id);

  return (
    <Link to={`/app/play/${game.id}`} className="homeCard">
      <div className="homeCover">
        <img
          src={thumb}
          alt={game.name}
          className="homeCoverImg"
          draggable={false}
          loading="lazy"
        />

        <div className="homeCoverInfo">
          <div className="homeCoverName">
            {game.emoji} {game.name}
          </div>
          <div className="homeCoverMeta">
            {game.description || "Highscore jagen!"}
          </div>
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

  const filteredGames = GAMES.filter(
    (game) =>
      game.name.toLowerCase().includes(query) ||
      game.id.toLowerCase().includes(query)
  );

  return (
    <div className="homeWrap">
<header className="homeHeader">
  <div className="homeHeaderInner">
    <div className="homeHeaderText">
      <h1 className="homeTitle">
        {query ? `Suche: ${query}` : "Entdecke Arcadia"}
      </h1>
      {!query && (
        <p className="homeSubtitle">Finde dein nächstes Lieblingsspiel</p>
      )}
    </div>
    <div className="homeHeaderIcon">✨</div>
  </div>
</header>



      <div className="homeGrid">
        {filteredGames.length > 0 ? (
          filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))
        ) : (
          <div className="noResults">
            <div style={{ fontSize: "40px", marginBottom: "15px" }}>🕵️‍♂️</div>
            <h3>Keine Treffer für "{query}"</h3>
            <p className="homeCardMeta">
              Probiere es mit einem anderen Suchbegriff.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
