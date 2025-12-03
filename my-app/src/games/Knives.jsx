import React, { useEffect, useRef, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Knives() {
    const canvasRef = useRef(null);
    const [hits, setHits] = useState(0);

    useEffect(() => {
        const c = canvasRef.current;
        const x = c.getContext("2d");

        // GAME STATE
        let angle = 0;
        let speed = 0.025;
        let knives = [];
        let score = 0;
        let particles = [];

        function reset() {
            setHighscore("knives", score);
            angle = 0;
            speed = 0.025;
            knives = [];
            particles = [];
            score = 0;
            setHits(0);
        }

        // ===== INPUT =====
        const kd = (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                throwKnife();
            }
        };
        const click = () => throwKnife();

        window.addEventListener("keydown", kd);
        c.addEventListener("mousedown", click);

        // ===== PARTICLES =====
        function makeParticles(px, py, col) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x: px,
                    y: py,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    life: 20,
                    col
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

        // ===== THROWING =====
        function throwKnife() {
            const target = angle;

            // COLLISION CHECK
            for (const a of knives) {
                const d = Math.abs(a - target);
                if (d < 0.22 || Math.abs(d - Math.PI * 2) < 0.22) {
                    makeParticles(c.width / 2, c.height / 2, "#e74c3c");
                    reset();
                    return;
                }
            }

            knives.push(target);
            score++;
            setHits(score);

            if (score % 5 === 0) speed += 0.01;
        }

        // ===== MAIN LOOP =====
        let raf;
        const loop = () => {
            x.clearRect(0, 0, c.width, c.height);

            const cx = c.width / 2;
            const cy = c.height / 2;
            const r = 140;

            // SPIN
            angle = (angle + speed) % (Math.PI * 2);

            // BACKGROUND
            x.fillStyle = "#061335";
            x.fillRect(0, 0, c.width, c.height);

            // WHEEL
            x.beginPath();
            x.arc(cx, cy, r, 0, Math.PI * 2);
            x.fillStyle = "#0b1a4a";
            x.fill();

            // CENTER DOT
            x.beginPath();
            x.arc(cx, cy, 16, 0, Math.PI * 2);
            x.fillStyle = "#7aa2ff88";
            x.fill();

            // EXISTING KNIVES
            x.strokeStyle = "#f1c40f";
            x.lineWidth = 4;
            knives.forEach((a) => {
                const x1 = cx + Math.cos(a) * (r - 8);
                const y1 = cy + Math.sin(a) * (r - 8);
                const x2 = cx + Math.cos(a) * (r + 25);
                const y2 = cy + Math.sin(a) * (r + 25);

                x.beginPath();
                x.moveTo(x1, y1);
                x.lineTo(x2, y2);
                x.stroke();
            });

            // MOVING KNIFE (AIM)
            x.strokeStyle = "#7aa2ff";
            x.lineWidth = 5;
            const x1 = cx + Math.cos(angle) * (r - 14);
            const y1 = cy + Math.sin(angle) * (r - 14);
            const x2 = cx + Math.cos(angle) * (r + 30);
            const y2 = cy + Math.sin(angle) * (r + 30);

            x.beginPath();
            x.moveTo(x1, y1);
            x.lineTo(x2, y2);
            x.stroke();

            // PARTICLES
            updateParticles();
            particles.forEach((p) => {
                x.globalAlpha = p.life / 20;
                x.fillStyle = p.col;
                x.fillRect(p.x, p.y, 4, 4);
            });
            x.globalAlpha = 1;

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("keydown", kd);
            c.removeEventListener("mousedown", click);
        };
    }, []);

    return (
        <div>
            <div className="controls">
                <span className="pill">Steuerung: Space / Klick</span>
                <span className="pill">Treffer: <b>{hits}</b></span>
            </div>
            <div className="canvas-wrap">
                <canvas ref={canvasRef} width="480" height="480" />
            </div>
        </div>
    );
}
