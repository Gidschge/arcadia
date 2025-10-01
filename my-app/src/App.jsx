import React, { useState, Suspense } from 'react'
import Jumper from './games/Jumper.jsx'
import Stopper from './games/Stopper.jsx'
import Dodge from './games/Dodge.jsx'
import Stack from './games/Stack.jsx'
import Knives from './games/Knives.jsx'
import Runaway from './games/Runaway.jsx'
import Balloon from './games/Balloon.jsx'
import Clicker from './games/Clicker.jsx'
import Simon from './games/Simon.jsx'
import Mini2048 from './games/Mini2048.jsx'

const items = [
  { id:'jumper', title:'One-Button Jumper', Comp: Jumper },
  { id:'stopper', title:'Stop at the Right Time', Comp: Stopper },
  { id:'dodge', title:'Falling Blocks Dodge', Comp: Dodge },
  { id:'stack', title:'Stack Tower', Comp: Stack },
  { id:'knives', title:'Knife Thrower', Comp: Knives },
  { id:'runaway', title:'Runaway Button', Comp: Runaway },
  { id:'balloon', title:"Don't Explode the Balloon", Comp: Balloon },
  { id:'clicker', title:'Clicker Lite', Comp: Clicker },
  { id:'simon', title:'Memory (Simon)', Comp: Simon },
  { id:'mini2048', title:'Slide to Merge (Mini‑2048)', Comp: Mini2048 },
]

export default function App(){
  const [active, setActive] = useState('jumper')
  const Comp = items.find(i=>i.id===active)?.Comp ?? (()=>null)
  const year = new Date().getFullYear()

  return (
    <>
      <header>
        <div className="header-inner">
          <form className="search"><input placeholder="Search" aria-label="Search"/></form>
          <h1 className="brand">Arcadia</h1>
          <div className="account">
            <span>Coins: <strong>0</strong></span>
            <a className="btn" href="#">Login</a>
          </div>
        </div>
      </header>

      <main>
        <nav>
          <h2>Spiele</h2>
          {items.map(i=>(
            <button key={i.id} onClick={()=>setActive(i.id)}>{i.title}</button>
          ))}
        </nav>

        <section id="stage">
          <Suspense fallback={<div style={{padding:20}}>Lade …</div>}>
            <Comp/>
          </Suspense>
        </section>
      </main>

      <footer>© {year} Arcadia</footer>
    </>
  )
}
