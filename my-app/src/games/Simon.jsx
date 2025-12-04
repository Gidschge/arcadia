import React, { useEffect, useState } from 'react'
import { getHighscore, saveHighscore } from "../utils/highscore"

export default function Simon(){
  const [seq, setSeq] = useState([])
  const [input, setInput] = useState([])
  const [round, setRound] = useState(0)
  const [best, setBest] = useState(0)
  const [playing, setPlaying] = useState(false)
  const gameId = "simon"

  useEffect(() => {
    getHighscore(gameId).then(setBest)
  }, [gameId])

  const flash = (i)=>{
    const el = document.querySelector(`#simon .pad[data-id="${i}"]`)
    if(!el) return
    el.classList.add('active'); setTimeout(()=>el.classList.remove('active'),300)
  }

  const playSeq = ()=>{
    setPlaying(true)
    let i=0
    const iv = setInterval(()=>{
      flash(seq[i]); i++;
      if(i>=seq.length){
        clearInterval(iv);
        setPlaying(false)
      }
    }, 450)
  }

  const next = ()=>{
    const n = Math.floor(Math.random()*4)
    const s = [...seq, n]
    setSeq(s)
    setInput([])
    setRound(round+1)
    if(round + 1 > best){
      setBest(round + 1)
      saveHighscore(gameId, round + 1)
    }
    setTimeout(()=>playSeq(), 300)
  }

  const start = ()=>{
    setSeq([])
    setInput([])
    setRound(0)
    setTimeout(next, 200)
  }

  const onClick = (i)=>{
    if(playing) return
    flash(i)
    const ni = [...input, i]
    setInput(ni)

    for(let j=0;j<ni.length;j++){
      if(ni[j]!==seq[j]){
        setRound(0)
        setSeq([])
        setTimeout(next,700)
        return
      }
    }

    if(ni.length===seq.length) setTimeout(next, 400)
  }

  return (<div id="simon">
    <div className="controls">
      <span className="pill">Merke die Reihenfolge</span>
      <span className="pill">Runde: <span className="score">{round}</span></span>
      <span className="pill">Best: <span className="best">{best}</span></span>
    </div>
    <div className="pad4">
      {[0,1,2,3].map(i=> <div className="pad" key={i} data-id={i} onClick={()=>onClick(i)} /> )}
    </div>
    <div style={{textAlign:'center',marginTop:10}}><button className="btn" onClick={start}>Start</button></div>
  </div>)
}
