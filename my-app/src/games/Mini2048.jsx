import React, { useEffect, useState } from 'react'
import { getHighscore, saveHighscore } from "../utils/highscore"

export default function Mini2048(){
  const [cells, setCells] = useState(new Array(16).fill(0))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const gameId = "mini2048"

  const drawCells = ()=>cells.map((v,i)=> <div className="tile" key={i} style={{background: v?`rgba(122,162,255,${Math.min(0.1+Math.log2(v)/6,0.95)})`:'#0b1a4a'}}>{v||''}</div> )

  const spawn = (arr)=>{
    const free = arr.map((v,i)=>!v?i:null).filter(v=>v!==null)
    if(!free.length) return arr
    const idx = free[Math.floor(Math.random()*free.length)]
    arr[idx] = Math.random()<.9?2:4
    return arr
  }

  useEffect(()=>{ // init
    let a = new Array(16).fill(0); spawn(a); spawn(a); setCells(a)
    getHighscore(gameId).then(setBest)
  }, [gameId])

  const idx = (r,c)=> r*4+c

  const moveDir = (dir)=>{
    let moved=false, sc=score
    const getLines = ()=>{
      const rows=[0,1,2,3].map(r=>[idx(r,0),idx(r,1),idx(r,2),idx(r,3)])
      const cols=[0,1,2,3].map(c=>[idx(0,c),idx(1,c),idx(2,c),idx(3,c)])
      if(dir==='left') return rows
      if(dir==='right') return rows.map(a=>[...a].reverse())
      if(dir==='up') return cols
      return cols.map(a=>[...a].reverse())
    }
    let a=[...cells]
    for(const line of getLines()){
      let arr=line.map(i=>a[i]).filter(v=>v)
      for(let i=0;i<arr.length-1;i++){
        if(arr[i]===arr[i+1]){ arr[i]*=2; sc+=arr[i]; arr.splice(i+1,1) }
      }
      while(arr.length<4) arr.push(0)
      line.forEach((i,k)=>{ if(a[i]!==arr[k]){ moved=true; a[i]=arr[k] } })
    }
    if(moved){ spawn(a); setCells(a); setScore(sc) }
  }

  useEffect(()=>{
    const onKey=(e)=>{
      const k=e.key
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(k)) e.preventDefault()
      if(k==='ArrowLeft') moveDir('left')
      if(k==='ArrowRight') moveDir('right')
      if(k==='ArrowUp') moveDir('up')
      if(k==='ArrowDown') moveDir('down')
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  }, [cells, score])

  const reset=()=>{
    if (score > best) {
      setBest(score)
      saveHighscore(gameId, score)
    }
    let a=new Array(16).fill(0); spawn(a); spawn(a); setCells(a); setScore(0)
  }

  return (<div>
    <div className="controls">
      <span className="pill">Steuerung: Pfeiltasten</span>
      <span className="pill">Score: <span className="score">{score}</span></span>
      <span className="pill">Best: <span className="best">{best}</span></span>
    </div>
    <div className="grid-2048">{drawCells()}</div>
    <div style={{textAlign:'center',marginTop:10}}>
      <button className="btn" onClick={reset}>Neu</button>
    </div>
  </div>)
}
