import React, { useEffect, useRef, useState } from 'react'

export default function Dodge(){
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)

  useEffect(()=>{
    const c=canvasRef.current, x=c.getContext('2d')
    let player={x:c.width/2-15,y:c.height-40,w:30,h:30},left=false,right=false,blocks=[],tick=0,s=0
    const kd=(e)=>{ if(e.key==='ArrowLeft') left=true; if(e.key==='ArrowRight') right=true }
    const ku=(e)=>{ if(e.key==='ArrowLeft') left=false; if(e.key==='ArrowRight') right=false }
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku)
    function spawn(){ blocks.push({x:Math.random()*(c.width-30),y:-20,w:20+Math.random()*40,h:20+Math.random()*20,s:2+Math.random()*3+s/300}) }
    function reset(){ blocks=[]; s=0; player.x=c.width/2-15 }
    let raf
    const loop=()=>{
      x.clearRect(0,0,c.width,c.height)
      if(left) player.x-=5; if(right) player.x+=5; player.x=Math.max(0,Math.min(c.width-player.w,player.x))
      x.fillStyle='#7aa2ff'; x.fillRect(player.x,player.y,player.w,player.h)
      if(tick%24===0) spawn(); blocks.forEach(b=>b.y+=b.s); blocks=blocks.filter(b=>b.y<c.height+10)
      x.fillStyle='#e74c3c'; blocks.forEach(b=>x.fillRect(b.x,b.y,b.w,b.h))
      for(const b of blocks){ if(player.x<b.x+b.w&&player.x+player.w>b.x&&player.y<b.y+b.h&&player.y+player.h>b.y){ reset(); break } }
      s++; setScore(s); tick++; raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku) }
  },[])

  return (<div>
    <div className="controls"><span className="pill">Steuerung: <b>← →</b></span><span className="pill">Score: <span className="score">{score}</span></span></div>
    <div className="canvas-wrap"><canvas ref={canvasRef} width="720" height="360"/></div>
  </div>)
}
