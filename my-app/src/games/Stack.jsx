import React, { useEffect, useRef, useState } from 'react'

export default function Stack(){
  const canvasRef = useRef(null)
  const [height, setHeight] = useState(0)
  useEffect(()=>{
    const c=canvasRef.current, x=c.getContext('2d')
    let base={x:120,y:c.height-30,w:240,h:20}
    let current={x:0,y:base.y-20,w:base.w,h:20,dir:1}
    let tower=[base]; let h=0
    function drop(){
      const prev=tower[tower.length-1]
      const left=Math.max(prev.x,current.x)
      const right=Math.min(prev.x+prev.w,current.x+current.w)
      const overlap=right-left
      if(overlap<=5){ reset(); return }
      current.x=left; current.w=overlap; tower.push({...current}); h++; setHeight(h)
      current={x: (Math.random()<.5?0:c.width-current.w), y: prev.y-20, w: current.w, h:20, dir: (Math.random()<.5?1:-1)}
    }
    function reset(){ tower=[base]; current={x:0,y:base.y-20,w:base.w,h:20,dir:1}; h=0; setHeight(0) }
    function move(){ current.x+=3*current.dir; if(current.x<=0||current.x+current.w>=c.width) current.dir*=-1 }
    const key=(e)=>{ if(e.code==='Space'){ e.preventDefault(); drop() } }
    const click=()=> drop()
    window.addEventListener('keydown',key); c.addEventListener('mousedown',click)
    let raf; const loop=()=>{ move(); x.clearRect(0,0,c.width,c.height); x.fillStyle='#0b1a4a'; x.fillRect(0,c.height-10,c.width,10); x.fillStyle='#7aa2ff'; tower.forEach(b=>x.fillRect(b.x,b.y,b.w,b.h)); x.fillStyle='#eaeaea'; x.fillRect(current.x,current.y,current.w,current.h); raf=requestAnimationFrame(loop) }
    raf=requestAnimationFrame(loop)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('keydown',key); c.removeEventListener('mousedown',click) }
  },[])

  return (<div>
    <div className="controls"><span className="pill">Steuerung: <b>Space/Klick</b> = Block droppen</span><span className="pill">Höhe: <span className="score">{height}</span></span></div>
    <div className="canvas-wrap"><canvas ref={canvasRef} width="480" height="480"/></div>
  </div>)
}
