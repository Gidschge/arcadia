import React, { useState } from 'react'

export default function Clicker(){
  const [n, setN] = useState(0)
  const level = n>200?'Weltherrschaft': n>100?'Super':'Kartoffel'
  return (<div>
    <div className="controls"><span className="pill">Einfach klicken :)</span><span className="pill">Level: <span className="score">{level}</span></span></div>
    <div className="canvas-wrap" style={{flexDirection:'column',gap:12}}>
      <button className="btn" style={{fontSize:20,padding:'16px 24px'}} onClick={()=>setN(n+1)}>{n>200?'🥔🚀 Mega Potato!':n>100?'🥔🔥 Super Potato':'🥔 Click!'}</button>
      <div>Clicks: <b>{n}</b></div>
    </div>
  </div>)
}
