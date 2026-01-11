import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../games/registry'; 
import { getThumbnail } from "../games/thumbnails"; // 🔥 Thumbnail-Funktion importieren

export default function Ads() {
  const navigate = useNavigate();

  const promotedGames = useMemo(() => {
    return [...GAMES]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, []);

  return (
    <div className="homeWrap">
      <div className="panelTitle">Vorschläge für dich</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {promotedGames.map(game => {
          // 🔥 Thumbnail für dieses Spiel holen
          const thumb = getThumbnail(game.id);

          return (
            <button 
              key={game.id} 
              className="gameCard" 
              onClick={() => navigate(`/app/play/${game.id}`)}
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'flex-start', 
                textAlign: 'left',
                width: '100%',
                cursor: 'pointer',
                padding: '10px',
                overflow: 'hidden'
              }}
            >
              {/* Thumbnail statt Emoji/Icon */}
              <div className="gameIcon" style={{ 
                width: '64px',   /* Etwas breiter für das Bild */
                height: '48px', 
                borderRadius: '8px',
                overflow: 'hidden',
                flexShrink: 0,
                background: '#000'
              }}>
                <img 
                  src={thumb} 
                  alt={game.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
              
              <div style={{ overflow: 'hidden', marginLeft: '12px' }}>
                <div className="gameName" style={{ fontSize: '14px', marginBottom: '2px' }}>
                  {game.name}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: 'var(--muted)',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {game.description || 'Jetzt spielen & Highscore knacken!'}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}