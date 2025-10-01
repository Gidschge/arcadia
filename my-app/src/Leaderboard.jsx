import React from 'react'

const mock = [
  {user:'Nico', score: 1240},
  {user:'Gideon', score: 1170},
  {user:'Aleks', score: 990},
  {user:'Guest42', score: 910},
  {user:'Lena', score: 880},
]

export default function Leaderboard(){
  return (
    <aside className="panel">
      <h2 className="panel-title">Leaderboard</h2>
      <ol className="board-list">
        {mock.map((r,i)=>(
          <li key={i}><span className="user">{i+1}. {r.user}</span><span className="score">{r.score}</span></li>
        ))}
      </ol>
    </aside>
  )
}
