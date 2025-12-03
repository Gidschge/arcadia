import React, { useEffect, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Simon() {
  const pads = [
    { id: 0, color: "#2ecc71" },
    { id: 1, color: "#e74c3c" },
    { id: 2, color: "#3498db" },
    { id: 3, color: "#f1c40f" },
  ];

  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activePad, setActivePad] = useState(null);
  const [locked, setLocked] = useState(true);
  const [pts, setPts] = useState(0);

  // SOUNDS (optional, fallback if Audio not available)
  const beep = (f = 440) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = f;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      osc.stop(ctx.currentTime + 0.15);
    } catch { }
  };

  useEffect(() => {
    startGame();
  }, []);

  function startGame() {
    setSequence([Math.floor(Math.random() * 4)]);
    setPlayerIndex(0);
    setPts(0);
    playSequence([Math.floor(Math.random() * 4)]);
  }

  function playSequence(seq = sequence) {
    setLocked(true);

    let i = 0;
    const speed = Math.max(500 - seq.length * 20, 200); // faster each level

    const interval = setInterval(() => {
      setActivePad(seq[i]);
      beep(300 + seq[i] * 120);

      setTimeout(() => setActivePad(null), speed * 0.6);

      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => setLocked(false), 300);
      }
    }, speed);
  }

  function handlePadClick(id) {
    if (locked) return;

    // Light feedback + sound
    setActivePad(id);
    beep(300 + id * 120);
    setTimeout(() => setActivePad(null), 150);

    // Incorrect?
    if (id !== sequence[playerIndex]) {
      setHighscore("simon", pts);
      startGame();
      return;
    }

    // Correct
    const nextIndex = playerIndex + 1;
    if (nextIndex >= sequence.length) {
      // Completed sequence → next round
      const newScore = pts + sequence.length * 2;
      setPts(newScore);
      setHighscore("simon", newScore);

      const nextSeq = [...sequence, Math.floor(Math.random() * 4)];
      setSequence(nextSeq);
      setPlayerIndex(0);

      setTimeout(() => playSequence(nextSeq), 600);
    } else {
      // Continue input
      setPlayerIndex(nextIndex);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div className="controls">
        <span className="pill">Wiederhole die Reihenfolge</span>
        <span className="pill">Score: <b>{pts}</b></span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 160px)",
          gap: "16px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        {pads.map((p) => (
          <div
            key={p.id}
            onClick={() => handlePadClick(p.id)}
            className="pad"
            style={{
              width: "160px",
              height: "160px",
              borderRadius: "20px",
              background: p.color,
              opacity: activePad === p.id ? 1 : 0.6,
              transform: activePad === p.id ? "scale(1.05)" : "scale(1.0)",
              transition: "all 0.12s ease",
              cursor: locked ? "default" : "pointer",
              boxShadow:
                activePad === p.id
                  ? "0 0 25px rgba(255,255,255,0.5)"
                  : "0 0 10px rgba(0,0,0,0.4)",
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
