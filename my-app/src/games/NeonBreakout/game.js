export const breakout = {
    id: "breakout",
    name: "Breakout",
    controls: "Maus oder A/D • SPACE = Start/Pause",

    create(ctx) {
        const canvas = document.createElement("canvas");
        const c = canvas.getContext("2d");
        ctx.root.appendChild(canvas);

        const dpr = window.devicePixelRatio || 1;
        canvas.style.width = `${ctx.width}px`;
        canvas.style.height = `${ctx.height}px`;
        canvas.width = Math.floor(ctx.width * dpr);
        canvas.height = Math.floor(ctx.height * dpr);
        c.scale(dpr, dpr);

        const W = ctx.width, H = ctx.height;

        let raf = 0;
        let running = false;
        let last = 0;

        let score = 0;
        let lives = 3;
        let level = 1;
        let started = false;
        let paused = false;

        const paddle = {
            w: Math.max(110, Math.floor(W * 0.16)),
            h: 14,
            x: W / 2,
            y: H - 46,
            vx: 0,
            speed: 860,
        };

        const ball = {
            r: 7,
            x: W / 2,
            y: paddle.y - 18,
            vx: 260,
            vy: -420,
            stuck: true,
        };

        const bricks = [];
        const particles = [];

        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

        function roundedRect(x, y, w, h, r) {
            const rr = Math.min(r, w / 2, h / 2);
            c.beginPath();
            c.moveTo(x + rr, y);
            c.arcTo(x + w, y, x + w, y + h, rr);
            c.arcTo(x + w, y + h, x, y + h, rr);
            c.arcTo(x, y + h, x, y, rr);
            c.arcTo(x, y, x + w, y, rr);
            c.closePath();
        }

        function spawnParticles(x, y, good = true, n = 18) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * 320,
                    vy: (Math.random() * 2 - 1) * 320,
                    t: 0,
                    life: 0.5 + Math.random() * 0.35,
                    good
                });
            }
        }

        function makeLevel(L) {
            bricks.length = 0;
            const cols = 10;
            const rows = 5 + Math.min(3, L - 1);
            const pad = 10;
            const top = 76;
            const bw = Math.floor((W - pad * 2 - (cols - 1) * 10) / cols);
            const bh = 22;

            for (let r = 0; r < rows; r++) {
                for (let col = 0; col < cols; col++) {
                    const hp = (r % 3 === 0 && L >= 2) ? 2 : 1;
                    bricks.push({
                        x: pad + col * (bw + 10),
                        y: top + r * (bh + 10),
                        w: bw,
                        h: bh,
                        hp,
                    });
                }
            }
        }

        function resetBall(stuck = true) {
            ball.stuck = stuck;
            ball.x = paddle.x;
            ball.y = paddle.y - 18;
            ball.vx = 260 * (Math.random() < 0.5 ? -1 : 1);
            ball.vy = -420;
        }

        function resetAll() {
            score = 0;
            lives = 3;
            level = 1;
            started = false;
            paused = false;
            ctx.callbacks?.onScore?.(0);

            paddle.x = W / 2;
            paddle.vx = 0;
            makeLevel(level);
            resetBall(true);
        }

        // Input
        let mouseX = null;
        const keys = new Set();

        function onMove(e) {
            const r = canvas.getBoundingClientRect();
            mouseX = e.clientX - r.left;
        }
        function onKeyDown(e) {
            if (e.code === "KeyA" || e.code === "ArrowLeft") keys.add("L");
            if (e.code === "KeyD" || e.code === "ArrowRight") keys.add("R");
            if (e.code === "Space") {
                e.preventDefault();
                if (!started) { started = true; ball.stuck = false; return; }
                paused = !paused;
            }
        }
        function onKeyUp(e) {
            if (e.code === "KeyA" || e.code === "ArrowLeft") keys.delete("L");
            if (e.code === "KeyD" || e.code === "ArrowRight") keys.delete("R");
        }
        function onPointerDown() {
            if (!started) { started = true; ball.stuck = false; return; }
            if (ball.stuck) ball.stuck = false;
            else paused = !paused;
        }

        function collideAABB(cx, cy, r, b) {
            const closestX = clamp(cx, b.x, b.x + b.w);
            const closestY = clamp(cy, b.y, b.y + b.h);
            const dx = cx - closestX;
            const dy = cy - closestY;
            return (dx * dx + dy * dy) <= r * r;
        }

        function bounceFromRect(b) {
            // Determine whether to flip vx or vy by penetration
            const px = clamp(ball.x, b.x, b.x + b.w);
            const py = clamp(ball.y, b.y, b.y + b.h);
            const dx = ball.x - px;
            const dy = ball.y - py;

            if (Math.abs(dx) > Math.abs(dy)) ball.vx *= -1;
            else ball.vy *= -1;
        }

        function step(dt) {
            if (!started || paused) return;

            // Paddle control
            if (mouseX != null) {
                paddle.x += (mouseX - paddle.x) * Math.min(1, dt * 14);
            } else {
                paddle.vx = 0;
                if (keys.has("L")) paddle.vx -= paddle.speed;
                if (keys.has("R")) paddle.vx += paddle.speed;
                paddle.x += paddle.vx * dt;
            }
            paddle.x = clamp(paddle.x, paddle.w / 2 + 8, W - paddle.w / 2 - 8);

            if (ball.stuck) {
                ball.x = paddle.x;
                ball.y = paddle.y - 18;
                return;
            }

            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;

            // Walls
            if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; }
            if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx *= -1; }
            if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }

            // Paddle collision (angle depends on hit position)
            const padRect = { x: paddle.x - paddle.w / 2, y: paddle.y - paddle.h / 2, w: paddle.w, h: paddle.h };
            if (ball.vy > 0 && collideAABB(ball.x, ball.y, ball.r, padRect)) {
                const hit = (ball.x - paddle.x) / (paddle.w / 2); // -1..1
                const speed = Math.hypot(ball.vx, ball.vy);
                const ang = (-Math.PI / 2) + hit * (Math.PI / 3); // wider spread
                ball.vx = Math.cos(ang) * speed;
                ball.vy = Math.sin(ang) * speed;
                ball.y = padRect.y - ball.r - 1;
                spawnParticles(ball.x, ball.y, true, 12);
            }

            // Bricks
            for (let i = bricks.length - 1; i >= 0; i--) {
                const b = bricks[i];
                if (!collideAABB(ball.x, ball.y, ball.r, b)) continue;

                bounceFromRect(b);
                b.hp -= 1;
                score += 50;
                ctx.callbacks?.onScore?.(score);
                spawnParticles(ball.x, ball.y, true, 16);

                if (b.hp <= 0) bricks.splice(i, 1);
                break;
            }

            // Lose
            if (ball.y > H + 30) {
                lives -= 1;
                spawnParticles(ball.x, H - 30, false, 28);
                if (lives <= 0) {
                    ctx.callbacks?.onGameOver?.({ score, reason: `Game Over • Level ${level}` });
                    running = false;
                    return;
                }
                resetBall(true);
            }

            // Win level
            if (bricks.length === 0) {
                level += 1;
                score += 300;
                ctx.callbacks?.onScore?.(score);
                makeLevel(level);
                resetBall(true);
            }
        }

        function draw(t, dt) {
            c.clearRect(0, 0, W, H);

            // subtle bg
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // top info (in-canvas, readable)
            c.save();
            c.fillStyle = "rgba(0,0,0,0.18)";
            roundedRect(16, 14, Math.min(560, W - 32), 46, 16);
            c.fill();

            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 16;
            c.fillStyle = "rgba(255,255,255,0.95)";
            c.font = "900 16px system-ui, Arial";
            c.fillText("Breakout", 32, 34);

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "600 13px system-ui, Arial";
            c.fillText(`Leben: ${lives} • Level: ${level} • ${started ? (paused ? "PAUSE (SPACE)" : "SPACE Pause") : "SPACE Start"}`, 32, 52);
            c.restore();

            // bricks
            for (const b of bricks) {
                c.save();
                c.shadowColor = b.hp === 2 ? "rgba(255,220,140,0.45)" : "rgba(160,220,255,0.45)";
                c.shadowBlur = 18;
                c.fillStyle = b.hp === 2 ? "rgba(255,220,140,0.22)" : "rgba(160,220,255,0.18)";
                roundedRect(b.x, b.y, b.w, b.h, 10);
                c.fill();

                c.shadowBlur = 0;
                c.strokeStyle = "rgba(255,255,255,0.10)";
                c.lineWidth = 2;
                roundedRect(b.x, b.y, b.w, b.h, 10);
                c.stroke();
                c.restore();
            }

            // paddle
            c.save();
            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 22;
            c.fillStyle = "rgba(160,220,255,0.20)";
            roundedRect(paddle.x - paddle.w / 2, paddle.y - paddle.h / 2, paddle.w, paddle.h, 999);
            c.fill();
            c.restore();

            // ball
            c.save();
            c.shadowColor = "rgba(255,255,255,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(255,255,255,0.88)";
            c.beginPath();
            c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            c.fill();
            c.restore();

            // particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.t += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = p.good ? `rgba(160,220,255,${0.30 * a})` : `rgba(255,120,120,${0.32 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
                c.fill();
                if (p.t >= p.life) particles.splice(i, 1);
            }

            if (!started) {
                c.save();
                c.fillStyle = "rgba(0,0,0,0.26)";
                c.fillRect(0, 0, W, H);
                c.fillStyle = "rgba(255,255,255,0.92)";
                c.font = "900 22px system-ui, Arial";
                c.fillText("SPACE oder Klick zum Starten", 32, H - 56);
                c.restore();
            }
        }

        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - last) / 1000);
            last = t;

            step(dt);
            draw(t, dt);

            raf = requestAnimationFrame(loop);
        }

        return {
            start() {
                if (running) return;
                running = true;
                resetAll();
                last = performance.now();

                window.addEventListener("keydown", onKeyDown, { passive: false });
                window.addEventListener("keyup", onKeyUp);
                canvas.addEventListener("pointermove", onMove);
                canvas.addEventListener("pointerdown", onPointerDown);

                raf = requestAnimationFrame(loop);
            },
            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("keyup", onKeyUp);
                canvas.removeEventListener("pointermove", onMove);
                canvas.removeEventListener("pointerdown", onPointerDown);
            },
            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
