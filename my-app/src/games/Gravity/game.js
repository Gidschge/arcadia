export const gravity = {
    id: "gravity",
    name: "Gravity Switch",
    controls: "SPACE / Klick = Gravity wechseln",

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

        const W = ctx.width;
        const H = ctx.height;

        let raf = 0;
        let running = false;
        let started = false;
        let lastTime = 0;

        let score = 0;
        let gravityDir = 1; // 1 = down, -1 = up
        let slowMo = 0;

        const ball = {
            x: W * 0.25,
            y: H * 0.5,
            vy: 0,
            r: 12,
        };

        const obstacles = [];
        const particles = [];

        function reset() {
            started = false;
            score = 0;
            gravityDir = 1;
            slowMo = 0;

            ball.y = H * 0.5;
            ball.vy = 0;

            obstacles.length = 0;
            particles.length = 0;

            ctx.callbacks?.onScore?.(0);
        }

        function spawnObstacle() {
            const gapY = 80 + Math.random() * (H - 160);
            obstacles.push({
                x: W + 40,
                gapY,
                gapH: 90,
                passed: false,
            });
        }

        function spawnParticles(x, y, good = true) {
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x,
                    y,
                    vx: (Math.random() * 2 - 1) * 240,
                    vy: (Math.random() * 2 - 1) * 240,
                    life: 0.5,
                    t: 0,
                    good,
                });
            }
        }

        function hit() {
            if (!started) {
                started = true;
                return;
            }

            gravityDir *= -1;
            ball.vy *= -0.6;
            slowMo = 0.15;
            spawnParticles(ball.x, ball.y, true);
        }

        function onKeyDown(e) {
            if (e.code === "Space") {
                e.preventDefault();
                hit();
            }
        }
        function onPointerDown() {
            hit();
        }

        function drawBackground(t) {
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.05)");
            g.addColorStop(1, "rgba(0,0,0,0.25)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.05)";
            for (let y = 20; y < H; y += 40) {
                for (let x = 20; x < W; x += 60) {
                    c.beginPath();
                    c.arc(x + (t * 0.03) % 60, y, 1.5, 0, Math.PI * 2);
                    c.fill();
                }
            }
        }

        function drawBall() {
            c.save();
            c.shadowColor = "rgba(160,220,255,0.6)";
            c.shadowBlur = 20;
            c.fillStyle = "rgba(160,220,255,0.9)";
            c.beginPath();
            c.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            c.fill();
            c.restore();
        }

        function drawObstacles() {
            for (const o of obstacles) {
                c.fillStyle = "rgba(255,255,255,0.12)";
                c.fillRect(o.x, 0, 20, o.gapY - o.gapH / 2);
                c.fillRect(
                    o.x,
                    o.gapY + o.gapH / 2,
                    20,
                    H - o.gapY
                );
            }
        }

        function drawStartOverlay() {
            if (started) return;

            c.fillStyle = "rgba(0,0,0,0.35)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.95)";
            c.font = "900 22px system-ui";
            c.fillText("Gravity Switch", 30, 50);

            c.fillStyle = "rgba(255,255,255,0.75)";
            c.font = "500 16px system-ui";
            c.fillText("SPACE / Klick = Schwerkraft wechseln", 30, 80);
            c.fillText("Überlebe so lange wie möglich", 30, 105);
        }

        function loop(t) {
            if (!running) return;
            let dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            if (slowMo > 0) {
                dt *= 0.35;
                slowMo -= dt;
            }

            if (started) {
                ball.vy += gravityDir * 980 * dt;
                ball.y += ball.vy * dt;

                if (ball.y < ball.r || ball.y > H - ball.r) {
                    spawnParticles(ball.x, ball.y, false);
                    running = false;
                    ctx.callbacks?.onGameOver?.({
                        score,
                        reason: "Zerschellt!",
                    });
                    return;
                }

                if (
                    obstacles.length === 0 ||
                    obstacles[obstacles.length - 1].x < W - 260
                ) {
                    spawnObstacle();
                }

                for (const o of obstacles) {
                    o.x -= 240 * dt;

                    if (!o.passed && o.x + 20 < ball.x) {
                        o.passed = true;
                        score += 100;
                        ctx.callbacks?.onScore?.(score);
                    }

                    if (
                        ball.x + ball.r > o.x &&
                        ball.x - ball.r < o.x + 20 &&
                        (ball.y < o.gapY - o.gapH / 2 ||
                            ball.y > o.gapY + o.gapH / 2)
                    ) {
                        spawnParticles(ball.x, ball.y, false);
                        running = false;
                        ctx.callbacks?.onGameOver?.({
                            score,
                            reason: "Hindernis!",
                        });
                        return;
                    }
                }

                score += Math.floor(20 * dt);
                ctx.callbacks?.onScore?.(score);
            }

            c.clearRect(0, 0, W, H);
            drawBackground(t);
            drawObstacles();
            drawBall();
            drawStartOverlay();

            raf = requestAnimationFrame(loop);
        }

        return {
            start() {
                if (running) return;
                running = true;
                reset();

                lastTime = performance.now();
                window.addEventListener("keydown", onKeyDown, { passive: false });
                canvas.addEventListener("pointerdown", onPointerDown);

                raf = requestAnimationFrame(loop);
            },

            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                canvas.removeEventListener("pointerdown", onPointerDown);
            },

            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
