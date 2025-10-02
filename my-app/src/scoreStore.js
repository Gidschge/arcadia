// Simple localStorage-based highscore store
const KEY_PREFIX = 'arcadia:hs:'

export function getHighscore(game){
  const v = localStorage.getItem(KEY_PREFIX + game)
  return v ? parseInt(v, 10) : 0
}

export function setHighscore(game, score){
  const cur = getHighscore(game)
  if (score > cur){
    localStorage.setItem(KEY_PREFIX + game, String(score))
    const event = new CustomEvent('arcadia:hs:update', { detail: { game, score }})
    window.dispatchEvent(event)
  }
}

export function getAllHighscores(){
  const keys = Object.keys(localStorage).filter(k=>k.startsWith(KEY_PREFIX))
  return keys.map(k=>({ game: k.replace(KEY_PREFIX,''), score: parseInt(localStorage.getItem(k)||'0',10) }))
}
