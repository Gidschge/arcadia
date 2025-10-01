import React, { useEffect, useRef, useState } from 'react'

export default function Jumper(){
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)

  useEffect(()=>{
    const c = canvasRef.current
    const x = c.getContext('2d')
    let t=0, s=0
    const player={x:80,y:250,w:24,h:24,vy:0,onGround:false}
    const g=0.7
    let obstacles=[]
    function reset(){ s=0; player.y=250; player.vy=0; obstacles=[]; t=0 }
    function spawn(){ obstacles.push({x:c.width+20,y:290,w:30+Math.random()*30,h:30}); if(Math.random()<.5) obstacles.push({x:c.width+80,y:300,w:18,h:20}) }
    function jump(){ if(player.onGround){ player.vy=-12; player.onGround=false } }
    const key = (e)=>{ if(e.code==='Space'){ e.preventDefault(); jump() } }
    const click = ()=> jump()
    window.addEventListener('keydown', key)
    c.addEventListener('mousedown', click)

    let raf
    const step = ()=>{
      x.clearRect(0,0,c.width,c.height)
      x.fillStyle='#0b1a4a'; x.fillRect(0,300,c.width,60)
      player.vy+=g; player.y+=player.vy; if(player.y>276){ player.y=276; player.vy=0; player.onGround=true }
      if(t%110===0) spawn()
      obstacles.forEach(o=>o.x-=4+(s/300))
      obstacles=obstacles.filter(o=>o.x+o.w>0)
      x.fillStyle='#e74c3c'; obstacles.forEach(o=>x.fillRect(o.x,o.y,o.w,o.h))
      x.fillStyle='#7aa2ff'; x.fillRect(player.x,player.y,player.w,player.h)
      for(const o of obstacles){ if(player.x<o.x+o.w&&player.x+player.w>o.x&&player.y<o.y+o.h&&player.y+player.h>o.y){ reset(); break } }
      s++; setScore(s); t++; raf=requestAnimationFrame(step)
    }
    raf=requestAnimationFrame(step)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('keydown',key); c.removeEventListener('mousedown',click) }
  }, [])

  return (<div>
    <div className="controls"><span className="pill">Steuerung: <b>Space/Klick</b> = Springen</span><span className="pill">Score: <span className="score">{score}</span></span></div>
    <div className="canvas-wrap"><canvas ref={canvasRef} width="720" height="360"/></div>
  </div>)
}
