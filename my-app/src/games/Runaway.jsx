import React, { useEffect, useRef, useState } from 'react'

export default function Runaway(){
  const containerRef = useRef(null)
  const [clicks, setClicks] = useState(0)
  useEffect(()=>{
    const cont = containerRef.current
    const btn = cont.querySelector('button')
    function moveAway(e){
      const r=cont.getBoundingClientRect()
      const nx=Math.random()*(r.width-100), ny=Math.random()*(r.height-40)
      btn.style.left=Math.max(0,Math.min(r.width-100,nx))+'px'
      btn.style.top=Math.max(0,Math.min(r.height-40,ny))+'px'
    }
    cont.addEventListener('mousemove', moveAway)
    const click = (e)=>{ e.stopPropagation(); setClicks(v=>{ const nv=v+1; if(nv>=5){ btn.textContent='Gewonnen!'; cont.removeEventListener('mousemove',moveAway) } return nv })}
    btn.addEventListener('click', click)
    return ()=>{ cont.removeEventListener('mousemove',moveAway); btn.removeEventListener('click',click) }
  },[])

  return (<div>
    <div className="controls"><span className="pill">Ziel: Button 5× klicken</span><span className="pill">Klicks: <span className="score">{clicks}</span>/5</span></div>
    <div ref={containerRef} style={{height:380,position:'relative'}}>
      <button className="btn" style={{position:'absolute',left:'40%',top:'40%'}}>Klick mich!</button>
    </div>
  </div>)
}
