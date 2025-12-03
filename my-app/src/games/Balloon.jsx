import React, { useEffect, useRef, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Balloon() {
    const canvasRef = useRef(null);
    const [pts, setPts] = useState(0);

    useEffect(() => {
        const c = canvasRef.current;
        const x = c.getContext("2d");

        // GAME STATE
        let size = 40;
        let score = 0;
        let combo = 1;
        let hold = false;
        let particles = [];
        let popFlash = 0;

        function reset() {
            setHighscore("balloon", score);
            score = 0;
            combo = 1;
            size = 40;
            particles = [];
            popFlash = 0;
            setPts(0);
        }

        // INPUT
        const md = () => (hold = true);
        const mu = () => {
            hold = false;
            combo = 1;
        };

        c.addEventListener("mousedown", md);
        window.addEventListener("mouseup", mu);

        // PARTICLES
        function spawnParticles(px, py, color) {
            for (let i = 0; i < 22; i++) {
                particles.push({
                    x: px,
                    y: py,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 24,
                    col: color
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

        // POP
        function pop() {
            popFlash = 10;
            spawnParticles(c.width / 2, c.height / 2, "#e74c3c");
            reset();
        }

        // MAIN LOOP
        let raf;
        const loop = () => {
            x.clearRect(0, 0, c.width, c.height);

            // Background
            x.fillStyle = "#061335";
            x.fillRect(0, 0, c.width, c.height);

            // POP FLASH
            if (popFlash > 0) {
                x.globalAlpha = popFlash / 10;
                x.fillStyle = "#ff4b60";
                x.fillRect(0, 0, c.width, c.height);
                x.globalAlpha = 1;
                popFlash--;
            }

            // HOLD → Inflate
            if (hold) {
                size += 0.9 + combo * 0.08;
                score += combo;
                combo += 0.015;
                setPts(Math.floor(score));

                // Danger Zone ∼ Size over 200
                if (size > 200) {
                    const risk = Math.random();
                    const danger = (size - 200) / 90; // risk ramp

                    if (risk < danger) {
                        pop(); // boom
                    }
                }
            } else {
                // Slowly shrink back when not holding
                size -= 1.2;
                if (size < 40) size = 40;
            }

            // BALLOON
            x.beginPath();
            x.arc(c.width / 2, c.height / 2, size, 0, Math.PI * 2);
            x.fillStyle = size > 170 ? "#f1c40f" : "#7aa2ff";
            x.fill();

            // Balloon highlight
            x.beginPath();
            x.arc(c.width / 2 - size * 0.4, c.height / 2 - size * 0.35, size * 0.3, 0, Math.PI * 2);
            x.fillStyle = "#ffffff33";
            x.fill();

            // String
            x.strokeStyle = "#cccccc55";
            x.lineWidth = 3;
            x.beginPath();
            x.moveTo(c.width / 2, c.height / 2 + size);
            x.lineTo(c.width / 2, c.height);
            x.stroke();

            // PARTICLES
            updateParticles();
            particles.forEach((p) => {
                x.globalAlpha = p.life / 24;
                x.fillStyle = p.col;
                x.fillRect(p.x, p.y, 4, 4);
            });
            x.globalAlpha = 1;

            raf = requestAnimationFrame(loop);
        };

        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            c.removeEventListener("mousedown", md);
            window.removeEventListener("mouseup", mu);
        };
    }, []);

    return (
        <div>
            <div className="controls">
                <span className="pill">Halten: Aufblasen</span>
                <span className="pill">Risk / Reward</span>
                <span className="pill">Score: <b>{pts}</b></span>
            </div>
            <div className="canvas-wrap">
                <canvas ref={canvasRef} width="400" height="400" />
            </div>
        </div>
    );
}
