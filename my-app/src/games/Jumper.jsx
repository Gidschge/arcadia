import React, { useEffect, useRef, useState } from "react";
import { setHighscore } from "../scoreStore";

export default function Jumper() {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const c = canvasRef.current;
        const x = c.getContext("2d");

        // ===== PLAYER =====
        const player = {
            x: 120,
            y: 260,
            w: 28,
            h: 28,
            vy: 0,
            onGround: true,
            doubleJump: true,
            lane: 0, // 0 bottom, 1 top
            dash: 0 // dash timer
        };

        // ===== GAME VARS =====
        let s = 0;
        let obstacles = [];
        let particles = [];
        let t = 0;
        const gravity = 0.6;

        function reset() {
            setHighscore("jumper", s);
            s = 0;
            t = 0;
            player.y = 260;
            player.vy = 0;
            player.onGround = true;
            player.doubleJump = true;
            obstacles = [];
            particles = [];
        }

        // ===== INPUT =====
        const kd = (e) => {
            if (e.code === "Space") {
                e.preventDefault();
                jump();
            }
            if (e.code === "ArrowUp") switchLane(1);
            if (e.code === "ArrowDown") switchLane(0);
            if (e.code === "ShiftLeft") dash();
        };

        const click = () => jump();

        window.addEventListener("keydown", kd);
        c.addEventListener("mousedown", click);

        // ===== ACTIONS =====
        function jump() {
            if (player.onGround) {
                player.vy = -12;
                player.onGround = false;
                player.doubleJump = true;
            } else if (player.doubleJump) {
                player.vy = -10;
                player.doubleJump = false;
            }
        }

        function switchLane(to) {
            player.lane = to;
        }

        function dash() {
            if (player.dash <= 0) {
                player.dash = 12; // frames
            }
        }

        // ===== PARALLAX BG =====
        const bg1 = { x: 0 }, bg2 = { x: c.width };

        function drawParallax(speed) {
            bg1.x -= speed;
            bg2.x -= speed;

            if (bg1.x <= -c.width) bg1.x = c.width;
            if (bg2.x <= -c.width) bg2.x = c.width;

            x.fillStyle = "#06143d";
            x.fillRect(0, 0, c.width, c.height);

            x.fillStyle = "#0d1b47";
            x.fillRect(bg1.x, 0, c.width, c.height);
            x.fillRect(bg2.x, 0, c.width, c.height);
        }

        // ===== OBSTACLES =====
        function spawn() {
            const laneY = player.lane === 1 ? 180 : 260;
            const y = Math.random() < 0.5 ? 260 : 180;
            obstacles.push({
                x: c.width + 30,
                y,
                w: 30 + Math.random() * 30,
                h: 28 + Math.random() * 14,
                s: 4 + s / 500
            });
        }

        // ===== PARTICLES =====
        function spawnParticles(px, py, col) {
            for (let i = 0; i < 8; i++) {
                particles.push({
                    x: px,
                    y: py,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 1) * 4,
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

        // ===== MAIN LOOP =====
        let raf;
        const loop = () => {
            x.clearRect(0, 0, c.width, c.height);

            drawParallax(1.5 + s / 1000);

            // LANE HEIGHT
            const targetY = player.lane === 1 ? 180 : 260;

            // PLAYER PHYSICS
            player.vy += gravity;
            player.y += player.vy;

            if (player.y > targetY) {
                player.y = targetY;
                player.vy = 0;
                player.onGround = true;
            }

            // DASH
            if (player.dash > 0) {
                player.dash--;
                x.globalAlpha = 0.5;
                x.fillStyle = "#7aa2ff";
                x.fillRect(player.x - 10, player.y, player.w + 20, player.h);
                x.globalAlpha = 1;
            }

            // PLAYER DRAW
            x.fillStyle = "#7aa2ff";
            x.fillRect(player.x, player.y, player.w, player.h);

            // OBSTACLES
            if (t % 90 === 0) spawn();

            obstacles.forEach((o) => (o.x -= o.s));
            obstacles = obstacles.filter((o) => o.x + o.w > 0);

            x.fillStyle = "#e74c3c";
            obstacles.forEach((o) => {
                x.fillRect(o.x, o.y, o.w, o.h);
            });

            // COLLISION
            for (const o of obstacles) {
                const hit =
                    player.x < o.x + o.w &&
                    player.x + player.w > o.x &&
                    player.y < o.y + o.h &&
                    player.y + player.h > o.y;

                if (hit) {
                    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, "#e74c3c");
                    reset();
                    break;
                }
            }

            // PARTICLES
            updateParticles();
            particles.forEach((p) => {
                x.globalAlpha = p.life / 20;
                x.fillStyle = p.col;
                x.fillRect(p.x, p.y, 4, 4);
            });
            x.globalAlpha = 1;

            // SCORE
            s++;
            setScore(s);

            t++;
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
                <span className="pill">JUMP: Space/Klick</span>
                <span className="pill">LANE: ↑ / ↓</span>
                <span className="pill">DASH: Shift</span>
                <span className="pill">Score: <b>{score}</b></span>
            </div>
            <div className="canvas-wrap">
                <canvas ref={canvasRef} width="720" height="360" />
            </div>
        </div>
    );
}
