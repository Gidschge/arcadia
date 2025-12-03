import React, { useEffect, useState } from "react";

export default function Mini2048() {
  const SIZE = 4;

  const [grid, setGrid] = useState(makeEmpty());
  const [score, setScore] = useState(0);

  // Start beim ersten Render
  useEffect(() => {
    restart();
  }, []);

  // Key-Listener mit aktuellem State
  useEffect(() => {
    function handleKey(e) {
      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        return;

      e.preventDefault();
      if (e.key === "ArrowLeft") moveLeft();
      if (e.key === "ArrowRight") moveRight();
      if (e.key === "ArrowUp") moveUp();
      if (e.key === "ArrowDown") moveDown();
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [grid, score]);

  function makeEmpty() {
    return Array(SIZE)
      .fill(null)
      .map(() => Array(SIZE).fill(0));
  }

  function restart() {
    let g = makeEmpty();
    g = addRandom(addRandom(g));
    setGrid(g);
    setScore(0);
  }

  function clone(g) {
    return g.map((r) => [...r]);
  }

  function addRandom(g) {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (g[r][c] === 0) empty.push([r, c]);
      }
    }
    if (!empty.length) return g;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    g[r][c] = Math.random() < 0.9 ? 2 : 4;
    return g;
  }

  // --- Grund-Operation: Reihe nach links bewegen & mergen ---
  function mergeRowLeft(row) {
    row = row.filter((v) => v !== 0);
    let newRow = [];
    let gained = 0;

    for (let i = 0; i < row.length; i++) {
      if (row[i] === row[i + 1]) {
        const v = row[i] * 2;
        newRow.push(v);
        gained += v;
        i++; // nächsten überspringen
      } else {
        newRow.push(row[i]);
      }
    }
    while (newRow.length < SIZE) newRow.push(0);
    return { row: newRow, gained };
  }

  function moveLeft() {
    let g = clone(grid);
    let moved = false;
    let gainedTotal = 0;

    for (let r = 0; r < SIZE; r++) {
      const { row, gained } = mergeRowLeft(g[r]);
      if (row.toString() !== g[r].toString()) moved = true;
      g[r] = row;
      gainedTotal += gained;
    }

    if (!moved) return;
    g = addRandom(g);
    setGrid(g);
    setScore((s) => s + gainedTotal);
  }

  function moveRight() {
    let g = clone(grid);
    let moved = false;
    let gainedTotal = 0;

    for (let r = 0; r < SIZE; r++) {
      const reversed = [...g[r]].reverse();
      const { row, gained } = mergeRowLeft(reversed);
      const back = row.reverse();
      if (back.toString() !== g[r].toString()) moved = true;
      g[r] = back;
      gainedTotal += gained;
    }

    if (!moved) return;
    g = addRandom(g);
    setGrid(g);
    setScore((s) => s + gainedTotal);
  }

  function moveUp() {
    let g = clone(grid);
    let moved = false;
    let gainedTotal = 0;

    for (let c = 0; c < SIZE; c++) {
      const col = g.map((row) => row[c]);
      const { row, gained } = mergeRowLeft(col);
      gainedTotal += gained;
      if (row.toString() !== col.toString()) moved = true;
      for (let r = 0; r < SIZE; r++) g[r][c] = row[r];
    }

    if (!moved) return;
    g = addRandom(g);
    setGrid(g);
    setScore((s) => s + gainedTotal);
  }

  function moveDown() {
    let g = clone(grid);
    let moved = false;
    let gainedTotal = 0;

    for (let c = 0; c < SIZE; c++) {
      const col = g.map((row) => row[c]).reverse();
      const { row, gained } = mergeRowLeft(col);
      const back = row.reverse();
      gainedTotal += gained;
      if (back.toString() !== g.map((row) => row[c]).toString()) moved = true;
      for (let r = 0; r < SIZE; r++) g[r][c] = back[r];
    }

    if (!moved) return;
    g = addRandom(g);
    setGrid(g);
    setScore((s) => s + gainedTotal);
  }

  const tileColor = (v) => {
    const colors = {
      0: "#0f2764",
      2: "#7aa2ff33",
      4: "#7aa2ff66",
      8: "#7aa2ff",
      16: "#f1c40f",
      32: "#e67e22",
      64: "#e74c3c",
      128: "#9b59b6",
      256: "#2ecc71",
      512: "#00a8ff",
      1024: "#e1b12c",
      2048: "#44bd32",
    };
    return colors[v] || "#ffffff";
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div className="controls">
        <span className="pill">Arrow Keys = Move</span>
        <span className="pill">
          Score: <b>{score}</b>
        </span>
      </div>

      <div className="grid-2048" style={{ marginTop: 20 }}>
        {grid.map((row, r) =>
          row.map((v, c) => (
            <div
              key={`${r}-${c}`}
              className="tile"
              style={{
                background: tileColor(v),
                color: v > 4 ? "#051133" : "#e8efff",
                fontSize: v < 128 ? 26 : 20,
                fontWeight: 800,
                transition: "all .12s ease",
              }}
            >
              {v || ""}
            </div>
          ))
        )}
      </div>

      <button className="btn" style={{ marginTop: 16 }} onClick={restart}>
        Restart
      </button>
    </div>
  );
}
