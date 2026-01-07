export const fallingBlocksDodge = {
    id: "dodge",
    name: "Falling Blocks Dodge",
    controls: "←/→ oder A/D | SPACE = Dash",

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
        let timeAlive = 0;

        // Player
        const player = {
            x: W * 0.5,
            y: H * 0.82,
            w: 44,
            h: 44,
            vx: 0,
            dash: 0,
            dashCd: 0,
        };

        // Falling blocks
        const blocks = [];
        let spawnT = 0.0;
        let difficulty = 1.0;

        // Particles
        const particles = [];
        function spawnParticles(x, y, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.35 + Math.random() * 0.55,
                    t: 0,
                    r: 2 + Math.random() * 3,
                    good,
                });
            }
        }

        // Input
        const keys = { left: false, right: false };

        function reset() {
            score = 0;
            timeAlive = 0;
            difficulty = 1.0;

            player.x = W * 0.5;
            player.vx = 0;
            player.dash = 0;
            player.dashCd = 0;

            blocks.length = 0;
            particles.length = 0;
            spawnT = 0.4;

            ctx.callbacks?.onScore?.(0);
        }

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
            return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
        }

        function dash() {
            if (!running || !started) return;
            if (player.dashCd > 0) return;

            player.dash = 0.14;   // seconds
            player.dashCd = 0.65; // cooldown
            spawnParticles(player.x, player.y, 18, 520, true);
        }

        function onKeyDown(e) {
            if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = true;
            if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = true;

            if (e.code === "Space") {
                e.preventDefault();
                if (!started) { started = true; return; }
                dash();
            }
        }
        function onKeyUp(e) {
            if (e.code === "ArrowLeft" || e.code === "KeyA") keys.left = false;
            if (e.code === "ArrowRight" || e.code === "KeyD") keys.right = false;
        }
        function onPointerDown() {
            if (!started) { started = true; return; }
            dash();
        }

        // Spawn blocks (with neon look)
        function spawnBlock() {
            const size = 26 + Math.random() * 22;
            const x = 30 + Math.random() * (W - 60 - size);
            const vy = 220 + Math.random() * 120 + difficulty * 45;

            blocks.push({
                x,
                y: -size - 20,
                s: size,
                vy,
                hue: 180 + Math.random() * 50, // cyan-ish
                rot: (Math.random() * 2 - 1) * 0.9,
                a: Math.random() * Math.PI * 2,
            });
        }

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

        function drawBackground(t) {
            // inner gradient
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // subtle moving dots
            const off = (t * 0.08) % 32;
            c.fillStyle = "rgba(255,255,255,0.05)";
            for (let y = 10; y < H; y += 32) {
                for (let x = 10; x < W; x += 32) {
                    c.fillRect(x + off * 0.2, y, 2, 2);
                }
            }

            // bottom glow lane
            c.strokeStyle = "rgba(0,255,255,0.16)";
            c.lineWidth = 6;
            c.beginPath();
            c.moveTo(0, H * 0.90);
            c.lineTo(W, H * 0.90);
            c.stroke();

            c.strokeStyle = "rgba(255,255,255,0.10)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(0, H * 0.90);
            c.lineTo(W, H * 0.90);
            c.stroke();
        }

        function drawParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.t += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;

                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = p.good
                    ? `rgba(160,220,255,${0.35 * a})`
                    : `rgba(255,120,120,${0.35 * a})`;

                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();

                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function drawPlayer() {
            const px = player.x - player.w / 2;
            const py = player.y - player.h / 2;

            // shadow
            c.fillStyle = "rgba(0,0,0,0.30)";
            c.beginPath();
            c.ellipse(player.x, player.y + 30, 18, 6, 0, 0, Math.PI * 2);
            c.fill();

            // glow body
            c.save();
            c.shadowColor = "rgba(120,180,255,0.55)";
            c.shadowBlur = player.dash > 0 ? 28 : 18;

            const g = c.createLinearGradient(px, py, px + player.w, py + player.h);
            g.addColorStop(0, "rgba(140,180,255,0.95)");
            g.addColorStop(1, "rgba(60,120,255,0.75)");
            c.fillStyle = g;

            roundedRect(px, py, player.w, player.h, 12);
            c.fill();
            c.restore();

            // dash trail hint
            if (player.dash > 0) {
                c.save();
                c.fillStyle = "rgba(80,220,255,0.10)";
                roundedRect(px - 24, py + 8, 22, player.h - 16, 10);
                c.fill();
                c.restore();
            }
        }

        function drawBlocks() {
            for (const b of blocks) {
                c.save();
                c.translate(b.x + b.s / 2, b.y + b.s / 2);
                c.rotate(b.a);
                c.translate(-(b.x + b.s / 2), -(b.y + b.s / 2));

                c.shadowColor = `hsla(${b.hue}, 90%, 60%, 0.50)`;
                c.shadowBlur = 18;

                const gx = c.createLinearGradient(b.x, b.y, b.x + b.s, b.y + b.s);
                gx.addColorStop(0, `hsla(${b.hue}, 90%, 68%, 0.95)`);
                gx.addColorStop(1, `hsla(${b.hue - 30}, 90%, 45%, 0.70)`);
                c.fillStyle = gx;

                roundedRect(b.x, b.y, b.s, b.s, 12);
                c.fill();

                // highlight stripe
                c.shadowBlur = 0;
                c.fillStyle = "rgba(255,255,255,0.16)";
                roundedRect(b.x + 5, b.y + 6, Math.max(6, b.s * 0.22), b.s - 12, 10);
                c.fill();

                c.restore();
            }
        }

        function drawStartOverlay() {
            if (started) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.35)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "800 22px system-ui, Arial";
            c.fillText("Falling Blocks Dodge", 28, 46);

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "500 16px system-ui, Arial";
            c.fillText("SPACE/Klick zum Starten", 28, 78);
            c.fillText("Bewege dich: ←/→ oder A/D   |   Dash: SPACE", 28, 102);

            c.restore();
        }

        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            if (started) {
                timeAlive += dt;
                difficulty = 1 + timeAlive * 0.18;

                // spawn
                spawnT -= dt;
                const spawnRate = Math.max(0.14, 0.42 - difficulty * 0.04);
                if (spawnT <= 0) {
                    spawnBlock();
                    spawnT = spawnRate;
                }

                // movement input
                const accel = player.dash > 0 ? 2200 : 1500;
                const maxV = player.dash > 0 ? 820 : 520;
                let dir = 0;
                if (keys.left) dir -= 1;
                if (keys.right) dir += 1;

                player.vx += dir * accel * dt;
                player.vx *= Math.pow(0.0008, dt); // smooth friction
                player.vx = clamp(player.vx, -maxV, maxV);

                // dash timer
                if (player.dash > 0) player.dash -= dt;
                if (player.dashCd > 0) player.dashCd -= dt;

                player.x += player.vx * dt;
                player.x = clamp(player.x, 30, W - 30);

                // blocks update
                for (let i = blocks.length - 1; i >= 0; i--) {
                    const b = blocks[i];
                    b.y += b.vy * dt;
                    b.a += b.rot * dt;

                    // scoring if passed bottom
                    if (b.y > H + 80) {
                        blocks.splice(i, 1);
                        score += 30;
                        ctx.callbacks?.onScore?.(score);
                    }
                }

                // collision
                const px = player.x - player.w / 2;
                const py = player.y - player.h / 2;
                for (const b of blocks) {
                    if (
                        rectOverlap(
                            px, py, player.w, player.h,
                            b.x, b.y, b.s, b.s
                        )
                    ) {
                        // hit
                        spawnParticles(player.x, player.y, 50, 620, false);
                        running = false;
                        ctx.callbacks?.onGameOver?.({ score, reason: "Getroffen!" });
                        return;
                    }
                }

                // time score
                score += Math.floor(40 * dt);
                ctx.callbacks?.onScore?.(score);
            }

            // draw
            c.clearRect(0, 0, W, H);
            drawBackground(t);
            drawParticles(dt);
            drawBlocks();
            drawPlayer();
            drawStartOverlay();

            raf = requestAnimationFrame(loop);
        }

        return {
            start() {
                if (running) return;
                running = true;
                started = false;
                reset();

                lastTime = performance.now();
                window.addEventListener("keydown", onKeyDown, { passive: false });
                window.addEventListener("keyup", onKeyUp);
                canvas.addEventListener("pointerdown", onPointerDown);

                raf = requestAnimationFrame(loop);
            },

            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("keyup", onKeyUp);
                canvas.removeEventListener("pointerdown", onPointerDown);
            },

            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
