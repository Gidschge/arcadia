import React, { useEffect, useRef, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Stopper() {
  const canvasRef = useRef(null);
  const [pts, setPts] = useState(0);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    const c = canvasRef.current;
    const x = c.getContext("2d");

    // BAR STATE
    let pos = 0;
    let dir = 1;
    let speed = 4;

    // SCORING
    let score = 0;
    let curCombo = 1;

    // PARTICLES
    let particles = [];

    // ZONES
    const perfectZone = { x: 300, w: 60 };
    const goodZone = { x: 260, w: 140 };

    function reset() {
      setHighscore("stopper", score);
      score = 0;
      curCombo = 1;
      setPts(0);
      setCombo(0);
      particles = [];
    }

    // CLICK INPUT
    function click() {
      checkHit();
    }
    c.addEventListener("mousedown", click);

    // CHECK HIT
    function checkHit() {
      const barX = pos;

      const inPerfect = barX > perfectZone.x && barX < perfectZone.x + perfectZone.w;
      const inGood = barX > goodZone.x && barX < goodZone.x + goodZone.w;

      if (inPerfect) {
        // PERFECT
        score += 10 * curCombo;
        curCombo += 0.2;
        setCombo(Math.floor(curCombo));
        makeParticles(360, 180, "#7aff7a");
      } else if (inGood) {
        // GOOD
        score += 4 * curCombo;
        curCombo += 0.05;
        setCombo(Math.floor(curCombo));
        makeParticles(360, 180, "#f1c40f");
      } else {
        // FAIL
        makeParticles(360, 180, "#e74c3c");
        reset();
        return;
      }

      setPts(Math.floor(score));

      // Increase speed slightly
      speed += 0.15;
    }

    // PARTICLES
    function makeParticles(px, py, col) {
      for (let i = 0; i < 14; i++) {
        particles.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
          life: 20,
          col,
        });
      }
    }

    function updateParticles() {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
      });
      particles = particles.filter((p) => p.life > 0);
    }

    // MAIN LOOP
    let raf;
    const loop = () => {
      x.clearRect(0, 0, c.width, c.height);

      // BACKGROUND
      x.fillStyle = "#051133";
      x.fillRect(0, 0, c.width, c.height);

      // DRAW ZONES
      x.fillStyle = "#2ecc7144";
      x.fillRect(perfectZone.x, 120, perfectZone.w, 120);

      x.fillStyle = "#f1c40f22";
      x.fillRect(goodZone.x, 120, goodZone.w, 120);

      // MOVE BAR
      pos += dir * speed;
      if (pos < 40 || pos > c.width - 40) dir *= -1;

      // DRAW MOVING BAR
      x.fillStyle = "#7aa2ff";
      x.fillRect(pos - 20, 130, 40, 100);

      // PARTICLES
      updateParticles();
      particles.forEach((p) => {
        x.globalAlpha = p.life / 20;
        x.fillStyle = p.col;
        x.fillRect(p.x, p.y, 5, 5);
      });
      x.globalAlpha = 1;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener("mousedown", click);
    };
  }, []);

  return (
    <div>
      <div className="controls">
        <span className="pill">Klick = Stoppen</span>
        <span className="pill">Score: <b>{pts}</b></span>
        <span className="pill">Combo: <b>{combo}</b></span>
      </div>

      <div className="canvas-wrap">
        <canvas ref={canvasRef} width="720" height="360" />
      </div>
    </div>
  );
}
