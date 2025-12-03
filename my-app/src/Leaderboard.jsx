import React, { useEffect, useState } from 'react'
import { getAllHighscores } from './scoreStore'

export default function Leaderboard(){
  const [rows, setRows] = useState([])

  const refresh = ()=>{
    const data = getAllHighscores().sort((a,b)=>b.score-a.score).slice(0,10)
    setRows(data)
  }

  useEffect(()=>{
    refresh()
    const onUpdate = ()=>refresh()
    window.addEventListener('arcadia:hs:update', onUpdate)
    return ()=>window.removeEventListener('arcadia:hs:update', onUpdate)
  },[])

  return (
    <aside className="panel">
      <h2 className="panel-title">Leaderboard (Local)</h2>
      {rows.length===0 ? <p style={{color:'var(--muted)'}}>Spiele und stelle einen Highscore auf!</p> :
      <ol className="board-list">
        {rows.map((r,i)=>(
          <li key={i}><span className="user">{r.game}</span><span className="score">{r.score}</span></li>
        ))}
      </ol>}
    </aside>
  )
}