import React, { useEffect, useRef, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Clicker() {
    const canvasRef = useRef(null);

    const [score, setScore] = useState(0);
    const [mult, setMult] = useState(1);
    const [auto, setAuto] = useState(0); // auto clicks / sec
    const [nextMult, setNextMult] = useState(100);
    const [nextAuto, setNextAuto] = useState(150);
    const [flash, setFlash] = useState(0);

    useEffect(() => {
        const c = canvasRef.current;
        const x = c.getContext("2d");

        let particles = [];
        let raf;

        // Draw potato
        function drawPotato() {
            x.fillStyle = "#7a5833";
            x.beginPath();
            x.ellipse(c.width / 2, c.height / 2, 120, 150, 0, 0, Math.PI * 2);
            x.fill();

            // Shine
            x.fillStyle = "#ffffff22";
            x.beginPath();
            x.ellipse(c.width / 2 - 40, c.height / 2 - 50, 40, 60, 0, 0, Math.PI * 2);
            x.fill();
        }

        // Spawn click particles
        function makeParticles(px, py) {
            for (let i = 0; i < 12; i++) {
                particles.push({
                    x: px,
                    y: py,
                    vx: (Math.random() - 0.5) * 6,
                    vy: (Math.random() - 1) * 5,
                    life: 20,
                    col: "#f1c40f"
                });
            }
        }

        // Update particles
        function updateParticles() {
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
            });
            particles = particles.filter((p) => p.life > 0);
        }

        // Click detection
        function click(e) {
            const rect = c.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            const dx = mx - c.width / 2;
            const dy = my - c.height / 2;
            const inside = Math.sqrt(dx * dx + dy * dy) < 130;

            if (inside) {
                // CRIT chance
                const critRoll = Math.random();
                let add = mult;

                if (critRoll < 0.05) {
                    add *= 10;
                    setFlash(8);
                } else if (critRoll < 0.15) {
                    add *= 5;
                    setFlash(5);
                }

                const newScore = score + add;
                setScore(newScore);
                makeParticles(mx, my);
                setHighscore("clicker", newScore);
            }
        }

        c.addEventListener("mousedown", click);

        // Auto-clicker
        const autoTimer = setInterval(() => {
            if (auto > 0) {
                const gain = auto * mult;
                const newScore = score => score + gain;
                setScore(newScore);
                setHighscore("clicker", newScore);
            }
        }, 1000);

        // MAIN LOOP
        const loop = () => {
            x.clearRect(0, 0, c.width, c.height);

            // Background
            x.fillStyle = "#0b1a4a";
            x.fillRect(0, 0, c.width, c.height);

            // Flash (crit feedback)
            if (flash > 0) {
                x.globalAlpha = flash / 10;
                x.fillStyle = "#ffd54f55";
                x.fillRect(0, 0, c.width, c.height);
                x.globalAlpha = 1;
                setFlash(flash - 1);
            }

            // Potato
            drawPotato();

            // Particles
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
            clearInterval(autoTimer);
        };
    }, [mult, auto, score, flash]);

    // Upgrade system
    function buyMult() {
        if (score >= nextMult) {
            setScore(score - nextMult);
            setMult(mult + 1);
            setNextMult(Math.round(nextMult * 1.8));
        }
    }

    function buyAuto() {
        if (score >= nextAuto) {
            setScore(score - nextAuto);
            setAuto(auto + 1);
            setNextAuto(Math.round(nextAuto * 2));
        }
    }

    return (
        <div>
            <div className="controls">
                <span className="pill">Click Me!</span>
                <span className="pill">Score: <b>{score}</b></span>
                <span className="pill">Multi: x{mult}</span>
                <span className="pill">Auto: {auto}/s</span>
            </div>

            <div className="canvas-wrap">
                <canvas ref={canvasRef} width="500" height="500" />
            </div>

            <div style={{ display: "grid", gap: "14px", marginTop: "16px", textAlign: "center" }}>
                <button className="btn" onClick={buyMult}>
                    +1 Multiplier ({nextMult})
                </button>
                <button className="btn" onClick={buyAuto}>
                    Buy Auto-Clicker ({nextAuto})
                </button>
            </div>
        </div>
    );
}
