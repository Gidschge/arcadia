import React, { useEffect, useRef, useState } from "react";

export default function Stack() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const c = canvasRef.current;
    const x = c.getContext("2d");

    const W = c.width;
    const H = c.height;

    let blocks = [];
    let speed = 3;
    let dir = 1;
    let points = 0;

    function init() {
      blocks = [
        {
          x: W / 2 - 150,
          y: H - 50,
          w: 300,
          h: 24,
          moving: false,
        },
      ];
      spawnBlock();
      points = 0;
      setScore(0);
      speed = 3;
      dir = 1;
    }

    function spawnBlock() {
      const last = blocks[blocks.length - 1];
      blocks.push({
        x: -last.w,
        y: last.y - last.h,
        w: last.w,
        h: last.h,
        moving: true,
      });
    }

    function place() {
      const top = blocks[blocks.length - 1];
      const prev = blocks[blocks.length - 2];

      if (!top.moving) return;

      top.moving = false;

      const left = Math.max(top.x, prev.x);
      const right = Math.min(top.x + top.w, prev.x + prev.w);
      const overlap = right - left;

      if (overlap <= 0) {
        init(); // Game over → restart
        return;
      }

      // abschneiden
      top.x = left;
      top.w = overlap;

      points++;
      setScore(points);

      speed += 0.15;
      spawnBlock();
    }

    c.addEventListener("mousedown", place);

    let raf;
    function loop() {
      x.clearRect(0, 0, W, H);

      // Hintergrund
      x.fillStyle = "#051133";
      x.fillRect(0, 0, W, H);

      // Blöcke updaten & zeichnen
      blocks.forEach((b, index) => {
        if (b.moving) {
          b.x += speed * dir;
          if (b.x < 0 || b.x + b.w > W) dir *= -1;
        }

        x.fillStyle = index % 2 === 0 ? "#7aa2ff" : "#9bbaff";
        x.fillRect(b.x, b.y, b.w, b.h);
      });

      raf = requestAnimationFrame(loop);
    }

    init();
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      c.removeEventListener("mousedown", place);
    };
  }, []);

  return (
    <div>
      <div className="controls">
        <span className="pill">Click = Block platzieren</span>
        <span className="pill">
          Score: <b>{score}</b>
        </span>
      </div>
      <div className="canvas-wrap">
        <canvas ref={canvasRef} width="720" height="360" />
      </div>
    </div>
  );
}
