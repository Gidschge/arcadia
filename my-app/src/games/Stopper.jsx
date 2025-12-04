import React, { useEffect, useRef, useState } from 'react'
import {getHighscore, saveHighscore} from "../utils/highscore.js";

export default function Stopper(){
  const canvasRef = useRef(null)
  const [lvl, setLvl] = useState(1)

  const [bestLvl, setBestLvl] = useState(0)
  const gameId = "stopper"

  useEffect(()=>{
    const c = canvasRef.current
    const x = c.getContext('2d')
    let pos=0, dir=1, playing=true, level=1
    let raf

    getHighscore(gameId).then(setBestLvl)

    const targetWidth = ()=> Math.max(40,140 - (level-1)*14)

    const draw = ()=>{
      x.clearRect(0,0,c.width,c.height)
      x.fillStyle='#0b1a4a'; x.fillRect(40,70,c.width-80,40)
      const tw=targetWidth(), tx=c.width/2 - tw/2
      x.fillStyle='#2ecc71'; x.fillRect(tx,70,tw,40)
      const sx=40+pos*(c.width-80-10); x.fillStyle='#eaeaea'; x.fillRect(sx,60,10,60)
    }

    const tick = ()=>{
      if(!playing) return
      pos+=0.012*dir
      if(pos>1||pos<0){ dir*=-1; pos=Math.max(0,Math.min(1,pos)) }
      draw(); raf=requestAnimationFrame(tick)
    }

    const stop = () => {
      if (!playing) return
      playing = false
      const tw = targetWidth(), tx = c.width / 2 - tw / 2
      const sx = 40 + pos * (c.width - 80 - 10)

      if (sx > tx && sx < tx + tw) {
        level++
      } else {
        level = 1
      }

      setLvl(level)
      if (level - 1 > bestLvl) {          // last completed level is level-1
        setBestLvl(level - 1)
        saveHighscore(gameId, level - 1)
      }

      dir = 1; pos = 0; playing = true; tick()
    }

    const key = e => { if (e.code === "Space") { e.preventDefault(); stop() } }
    const click = () => stop()
    window.addEventListener("keydown", key); c.addEventListener("mousedown", click)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("keydown", key)
      c.removeEventListener("mousedown", click)
    }
}, [bestLvl, gameId])

  return (
      <div>
        <div className="controls">
          <span className="pill">Steuerung: <b>Space/Klick</b> = Stop</span>
          <span className="pill">Level: <span className="score">{lvl}</span></span>
          <span className="pill">Best: <span className="best">{bestLvl}</span></span>
        </div>
        <div className="canvas-wrap"><canvas ref={canvasRef} width="720" height="180" ref={canvasRef}/></div>
      </div>
  )
}