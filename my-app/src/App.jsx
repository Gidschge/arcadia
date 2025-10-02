import React, { useState, Suspense } from 'react'
import Home from './Home.jsx'
import Ads from './Ads.jsx'
import Leaderboard from './Leaderboard.jsx'
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
  { id:'jumper', title:'One-Button Jumper', Comp: Jumper, logo:'🟦' },
  { id:'stopper', title:'Stop at the Right Time', Comp: Stopper, logo:'🎯' },
  { id:'dodge', title:'Falling Blocks Dodge', Comp: Dodge, logo:'🧱' },
  { id:'stack', title:'Stack Tower', Comp: Stack, logo:'🏗️' },
  { id:'knives', title:'Knife Thrower', Comp: Knives, logo:'🔪' },
  { id:'runaway', title:'Runaway Button', Comp: Runaway, logo:'🏃‍♂️' },
  { id:'balloon', title:"Don't Explode the Balloon", Comp: Balloon, logo:'🎈' },
  { id:'clicker', title:'Clicker Lite', Comp: Clicker, logo:'🥔' },
  { id:'simon', title:'Memory (Simon)', Comp: Simon, logo:'🟩' },
  { id:'mini2048', title:'Slide to Merge (Mini-2048)', Comp: Mini2048, logo:'🔢' },
]

// test change x

export default function App(){
  const [active, setActive] = useState('home')
  const Comp = items.find(i=>i.id===active)?.Comp ?? (()=>null)
  const year = new Date().getFullYear()

  return (
    <>
      <header>
        <div className="header-inner">
          <form className="search"><input placeholder="Search" aria-label="Search"/></form>
          <h1 className="brand" onClick={()=>setActive('home')} style={{cursor:'pointer'}}>Arcadia</h1>
          <div className="account">
            <span>Coins: <strong>0</strong></span>
            <a className="btn" href="#" onClick={(e)=>e.preventDefault()}>Login</a>
          </div>
        </div>
      </header>

      <main>
        <aside className="sidebar left">
          <Ads onOpen={setActive} />
        </aside>

        <section id="stage">
          <Suspense fallback={<div style={{padding:20}}>Lade …</div>}>
            {active==='home'
              ? <Home items={items} onOpen={setActive} />
              : <Comp/>}
          </Suspense>
        </section>

        <aside className="sidebar right">
          <Leaderboard />
        </aside>
      </main>

      <footer>© {year} Arcadia</footer>
    </>
  )
}
