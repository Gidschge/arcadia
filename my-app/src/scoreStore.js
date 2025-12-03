const KEY_PREFIX = "arcadia:hs:";

export function getHighscore(game) {
  const v = localStorage.getItem(KEY_PREFIX + game);
  return v ? parseInt(v, 10) : 0;
}

export function setHighscore(game, score) {
  const cur = getHighscore(game);
  if (score > cur) {
    localStorage.setItem(KEY_PREFIX + game, String(score));
    window.dispatchEvent(new CustomEvent("arcadia:hs:update"));
  }
}

export function getAllHighscores() {
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(KEY_PREFIX))
    .map((k) => ({
      game: k.replace(KEY_PREFIX, ""),
      score: parseInt(localStorage.getItem(k) || "0", 10),
    }));
}
