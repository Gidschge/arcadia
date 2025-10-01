import React, { useEffect, useRef, useState } from 'react'

export default function Knives(){
  const canvasRef = useRef(null)
  const [hits, setHits] = useState(0)
  useEffect(()=>{
    const c=canvasRef.current, x=c.getContext('2d')
    let angle=0, knives=[], speed=0.03, h=0
    function throwKnife(){
      const kAngle=angle
      for(const a of knives){ const d=Math.abs(a-kAngle); if(d<0.2||Math.abs(d-2*Math.PI)<0.2){ h=0; knives=[]; speed=0.03; setHits(0); return } }
      knives.push(kAngle); h++; setHits(h); if(knives.length%6===0) speed+=0.01
    }
    const key=(e)=>{ if(e.code==='Space'){ e.preventDefault(); throwKnife() } }
    const click=()=> throwKnife()
    window.addEventListener('keydown',key); c.addEventListener('mousedown',click)
    let raf; const loop=()=>{
      x.clearRect(0,0,c.width,c.height); const cx=c.width/2, cy=c.height/2, r=140
      angle=(angle+speed)%(Math.PI*2)
      x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fillStyle='#0b1a4a'; x.fill(); x.strokeStyle='#7aa2ff'; x.lineWidth=4; x.stroke()
      x.fillStyle='#eaeaea'; x.beginPath(); x.arc(cx,cy,12,0,Math.PI*2); x.fill()
      x.strokeStyle='#e74c3c'; x.lineWidth=3; knives.forEach(a=>{ x.beginPath(); x.moveTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); x.lineTo(cx+Math.cos(a)*(r+18),cy+Math.sin(a)*(r+18)); x.stroke() })
      x.strokeStyle='#f1c40f'; x.beginPath(); x.moveTo(cx+Math.cos(angle)*(r-10),cy+Math.sin(angle)*(r-10)); x.lineTo(cx+Math.cos(angle)*(r+10),cy+Math.sin(angle)*(r+10)); x.stroke()
      raf=requestAnimationFrame(loop)
    }
    raf=requestAnimationFrame(loop)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('keydown',key); c.removeEventListener('mousedown',click) }
  },[])

  return (<div>
    <div className="controls"><span className="pill">Steuerung: <b>Space/Klick</b> Messer werfen</span><span className="pill">Treffer: <span className="score">{hits}</span></span></div>
    <div className="canvas-wrap"><canvas ref={canvasRef} width="480" height="480"/></div>
  </div>)
}
