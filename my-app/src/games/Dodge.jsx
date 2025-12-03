import React, { useEffect, useRef, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Dodge() {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const c = canvasRef.current;
        const x = c.getContext("2d");

        // Player
        const player = {
            x: 310,
            y: 290,
            w: 40,
            h: 40,
            speed: 6
        };

        // Game variables
        let blocks = [];
        let t = 0;
        let s = 0;

        function reset() {
            setHighscore("dodge", s);
            blocks = [];
            s = 0;
            t = 0;
            player.x = 310;
        }

        // Controls
        let left = false;
        let right = false;

        function onKeyDown(e) {
            if (e.key === "ArrowLeft") left = true;
            if (e.key === "ArrowRight") right = true;
        }
        function onKeyUp(e) {
            if (e.key === "ArrowLeft") left = false;
            if (e.key === "ArrowRight") right = false;
        }

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        // Block spawning
        function spawn() {
            const size = 20 + Math.random() * 50;
            const speed = 2 + Math.random() * 4 + s / 400;

            blocks.push({
                x: Math.random() * (c.width - size),
                y: -size,
                w: size,
                h: size,
                s: speed,
                col: Math.random() < 0.33 ? "#e74c3c"
                    : Math.random() < 0.66 ? "#f1c40f"
                        : "#7aa2ff"
            });
        }

        // MAIN LOOP
        let raf;
        const loop = () => {
            x.clearRect(0, 0, c.width, c.height);

            // PLAYER MOVEMENT
            if (left) player.x -= player.speed;
            if (right) player.x += player.speed;

            // Boundaries
            if (player.x < 0) player.x = 0;
            if (player.x > c.width - player.w) player.x = c.width - player.w;

            // PLAYER DRAW
            x.fillStyle = "#7aa2ff";
            x.fillRect(player.x, player.y, player.w, player.h);

            // SPAWN BLOCKS
            if (t % 35 === 0) spawn();

            // UPDATE BLOCKS
            blocks.forEach((b) => (b.y += b.s));
            blocks = blocks.filter((b) => b.y < c.height + 60);

            // DRAW BLOCKS
            blocks.forEach((b) => {
                x.fillStyle = b.col;
                x.fillRect(b.x, b.y, b.w, b.h);
            });

            // COLLISION
            for (const b of blocks) {
                const hit =
                    player.x < b.x + b.w &&
                    player.x + player.w > b.x &&
                    player.y < b.y + b.h &&
                    player.y + player.h > b.y;

                if (hit) {
                    reset();
                    break;
                }
            }

            // SCORE
            s++;
            setScore(s);

            t++;
            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    return (
        <div>
            <div className="controls">
                <span className="pill">Steuerung: ← →</span>
                <span className="pill">Score: <b>{score}</b></span>
            </div>
            <div className="canvas-wrap">
                <canvas ref={canvasRef} width="720" height="360" />
            </div>
        </div>
    );
}
