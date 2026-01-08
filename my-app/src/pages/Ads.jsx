import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../games/registry'; // 🔥 Nutzt deine echte Registry

export default function Ads() {
  const navigate = useNavigate();

  // Wählt zufällig 3 Spiele aus deiner Registry aus, die "beworben" werden
  const promotedGames = useMemo(() => {
    // Falls du weniger als 3 Spiele hast, nimm alle, ansonsten mische und nimm 3
    return [...GAMES]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, []);

  return (
    <div className="homeWrap">
      <div className="panelTitle">Vorschläge für dich</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {promotedGames.map(game => (
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
              padding: '12px'
            }}
          >
            {/* Hier wird das Icon oder Emoji aus deinem Game-Objekt genutzt */}
            <div className="gameIcon" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '24px',
              flexShrink: 0 
            }}>
              {game.emoji || '🎮'} 
            </div>
            
            <div style={{ overflow: 'hidden', marginLeft: '10px' }}>
              <div className="gameName" style={{ fontSize: '14px' }}>{game.name}</div>
              <div className="homeCardMeta" style={{ textAlign: 'left', fontSize: '12px' }}>
                {game.description || 'Jetzt spielen & Highscore knacken!'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}