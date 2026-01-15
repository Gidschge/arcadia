import { Link } from "react-router-dom";
import { GAMES } from "../games/registry";

export default function Home() {
  return (
    <div className="homeWrap">
      <div className="homeHeader">
        <div className="homeTitle">Willkommen bei Arcadia – wähle ein Spiel</div>
        <div className="homeSub">Neue Highscores, neue Spiele – alles an einem Ort.</div>
      </div>

      <div className="homeGrid">
        {GAMES.map((g) => (
          <Link key={g.id} to={`/play/${g.id}`} className="homeCard">
            <div className="homeCover">
              <img src={g.thumbnail} alt={g.name} className="homeCoverImg" draggable={false} />

              {/* Overlay Text (nicht im Thumbnail) */}
              <div className="homeCoverInfo">
                <div className="homeCoverName">{g.name}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
