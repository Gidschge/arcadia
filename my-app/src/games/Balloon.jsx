import React, { useEffect, useRef, useState } from 'react'
import { getHighscore, saveHighscore } from "../utils/highscore"

export default function Balloon(){
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const gameId = "balloon"

  useEffect(()=>{
    let r=20, hold=false, threshold=60

    // Load best score once
    getHighscore(gameId).then(setBest)

    const c=canvasRef.current, x=c.getContext('2d')

    function draw(){
      x.clearRect(0,0,c.width,c.height);
      x.fillStyle='#e74c3c';
      x.beginPath();
      x.arc(c.width/2,c.height/2,r,0,Math.PI*2);
      x.fill();
      x.fillStyle='#fff';
      x.fillText('Grenze: '+Math.floor(threshold),10,20)
    }

    function pop(){
      r=20;
      threshold=50+Math.random()*60
    }

    function bank(){
      const points = Math.floor(r)
      setScore(v=>v+points)
      if (points > best) {
        setBest(points)
        saveHighscore(gameId, points)
      }
      r=20;
      threshold=50+Math.random()*60
    }

    const kd=(e)=>{ if(e.code==='Space'){ e.preventDefault(); hold=true } }
    const ku=(e)=>{ if(e.code==='Space'){ hold=false } }
    const md=()=>{ hold=true }, mu=()=>{ bank(); hold=false }

    window.addEventListener('keydown',kd);
    window.addEventListener('keyup',ku);
    c.addEventListener('mousedown',md);
    c.addEventListener('mouseup',mu)

    let raf;
    const loop=()=>{
      if(hold){
        r+=1.4;
        if(r>threshold){
          pop();
          hold=false
        }
      }
      draw();
      raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop)
    return ()=>{
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown',kd);
      window.removeEventListener('keyup',ku);
      c.removeEventListener('mousedown',md);
      c.removeEventListener('mouseup',mu)
    }
  },[best, gameId])

  return (<div>
    <div className="controls">
      <span className="pill">Halte <b>Mouse/Space</b> zum Aufblasen</span>
      <span className="pill">Punkte: <span className="score">{score}</span></span>
      <span className="pill">Best: <span className="best">{best}</span></span>
    </div>
    <div className="canvas-wrap">
      <canvas ref={canvasRef} width="540" height="360"/>
    </div>
  </div>)
}
