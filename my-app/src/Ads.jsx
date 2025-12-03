import React from 'react'

export default function Ads({ onOpen }){
  const promos = [
    {id:'jumper', title:'Neu: One‑Button Jumper', blurb:'Jetzt mit Highscore!', emoji:'🟦'},
    {id:'mini2048', title:'Mini‑2048', blurb:'Süchtig machend seit 2014.', emoji:'🔢'},
    {id:'knives', title:'Knife Thrower', blurb:'Triff die Zielscheibe!', emoji:'🔪'}
  ]
  return (
    <aside className="panel">
      <h2 className="panel-title">Werbung für Spiele</h2>
      <div className="ad-list">
        {promos.map(p=> (
          <button key={p.id} className="ad-item" onClick={()=>onOpen(p.id)}>
            <div className="ad-emoji" aria-hidden>{p.emoji}</div>
            <div>
              <div className="ad-title">{p.title}</div>
              <div className="ad-blurb">{p.blurb}</div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}