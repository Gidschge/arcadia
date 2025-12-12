import React from 'react'

export default function Home({ items, onOpen }){
    return (
        <div className="home">
            <div className="controls">
                <span className="pill">Willkommen bei <b>Arcadia</b> – wähle ein Spiel</span>
            </div>
            <div className="home-grid">
                {items.map(i => (
                    <button key={i.id} className="home-card" onClick={()=>onOpen(i.id)} aria-label={`Open ${i.title}`}>
                        <div className="logo" aria-hidden>{i.logo}</div>
                        <div className="name">{i.title}</div>
                    </button>
                ))}
            </div>
        </div>
    )
}