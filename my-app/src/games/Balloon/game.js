export const balloon = {
    id: "balloon",
    name: "Balloon PRO",
    controls: "Mouse/Touch = Ziehen | WASD/←→↑↓ = Steuern",

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

        // Player
        const p = {
            x: W * 0.35,
            y: H * 0.55,
            vx: 0,
            vy: 0,
            r: 22,
            tether: 64,
            invuln: 0,
        };

        // Input
        const keys = { left: false, right: false, up: false, down: false };
        let pointer = { active: false, x: p.x, y: p.y };

        // World
        let tAlive = 0;
        let score = 0;
        let coins = 0;

        let wind = 0;
        let windTarget = 0;

        const spikes = [];
        const pickups = [];

        // particles
        const particles = [];
        function spawnParticles(x, y, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.35 + Math.random() * 0.6,
                    t: 0,
                    r: 2 + Math.random() * 3,
                    good,
                });
            }
        }

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        function reset() {
            started = false;
            tAlive = 0;
            score = 0;
            coins = 0;
            ctx.callbacks?.onScore?.(0);

            p.x = W * 0.35;
            p.y = H * 0.55;
            p.vx = 0;
            p.vy = 0;
            p.invuln = 0;

            pointer.active = false;
            pointer.x = p.x;
            pointer.y = p.y;

            spikes.length = 0;
            pickups.length = 0;
            particles.length = 0;

            wind = 0;
            windTarget = 0;

            // initial stuff
            for (let i = 0; i < 3; i++) spawnSpike(true);
            for (let i = 0; i < 2; i++) spawnCoin(true);
        }

        // ---------- Spawning ----------
        function spawnSpike(initial = false) {
            const size = 34 + Math.random() * 26;
            const x = initial ? (W + Math.random() * W) : (W + 120 + Math.random() * 380);
            const y = H * 0.22 + Math.random() * (H * 0.60);

            spikes.push({
                x, y,
                w: size,
                h: size,
                vx: -(260 + tAlive * 18 + Math.random() * 140),
                bob: Math.random() * Math.PI * 2,
                rot: (Math.random() * 2 - 1) * 1.2,
                a: Math.random() * Math.PI * 2,
            });
        }

        function spawnCoin(initial = false) {
            const x = initial ? (W + Math.random() * W) : (W + 160 + Math.random() * 420);
            const y = H * 0.18 + Math.random() * (H * 0.65);

            pickups.push({
                x, y,
                r: 12,
                vx: -(220 + tAlive * 16 + Math.random() * 120),
                spin: Math.random() * Math.PI * 2,
            });
        }

        // ---------- Collision ----------
        function dist2(ax, ay, bx, by) {
            const dx = ax - bx, dy = ay - by;
            return dx * dx + dy * dy;
        }

        function hitSpike(s) {
            // simple circle-rect approx using circle-circle to spike center
            const cx = s.x;
            const cy = s.y;
            const rr = (s.w * 0.55) + p.r * 0.85;
            return dist2(p.x, p.y, cx, cy) <= rr * rr;
        }

        function hitCoin(o) {
            const rr = o.r + p.r * 0.72;
            return dist2(p.x, p.y, o.x, o.y) <= rr * rr;
        }

        // ---------- Input ----------
        function onKeyDown(e) {
            const k = e.code;
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(k)) e.preventDefault();
            if (!started) started = true;

            if (k === "ArrowLeft" || k === "KeyA") keys.left = true;
            if (k === "ArrowRight" || k === "KeyD") keys.right = true;
            if (k === "ArrowUp" || k === "KeyW") keys.up = true;
            if (k === "ArrowDown" || k === "KeyS") keys.down = true;
        }
        function onKeyUp(e) {
            const k = e.code;
            if (k === "ArrowLeft" || k === "KeyA") keys.left = false;
            if (k === "ArrowRight" || k === "KeyD") keys.right = false;
            if (k === "ArrowUp" || k === "KeyW") keys.up = false;
            if (k === "ArrowDown" || k === "KeyS") keys.down = false;
        }

        function onPointerDown(e) {
            if (!started) started = true;
            pointer.active = true;
            const r = canvas.getBoundingClientRect();
            pointer.x = e.clientX - r.left;
            pointer.y = e.clientY - r.top;
        }
        function onPointerMove(e) {
            if (!pointer.active) return;
            const r = canvas.getBoundingClientRect();
            pointer.x = e.clientX - r.left;
            pointer.y = e.clientY - r.top;
        }
        function onPointerUp() {
            pointer.active = false;
        }

        // ---------- Drawing helpers ----------
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
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // drifting dots
            c.fillStyle = "rgba(255,255,255,0.05)";
            const off = (t * 0.06) % 40;
            for (let y = 20; y < H; y += 40) {
                for (let x = 20; x < W; x += 70) {
                    c.beginPath();
                    c.arc(x + off, y, 1.6, 0, Math.PI * 2);
                    c.fill();
                }
            }
        }

        function drawParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const q = particles[i];
                q.t += dt;
                q.x += q.vx * dt;
                q.y += q.vy * dt;
                q.vx *= 0.98;
                q.vy *= 0.98;

                const a = Math.max(0, 1 - q.t / q.life);
                c.fillStyle = q.good
                    ? `rgba(160,220,255,${0.30 * a})`
                    : `rgba(255,120,120,${0.32 * a})`;
                c.beginPath();
                c.arc(q.x, q.y, q.r, 0, Math.PI * 2);
                c.fill();

                if (q.t >= q.life) particles.splice(i, 1);
            }
        }

        function drawSpike(s) {
            c.save();
            c.translate(s.x, s.y);
            c.rotate(s.a);

            c.shadowColor = "rgba(255,80,80,0.45)";
            c.shadowBlur = 18;

            // triangle-ish spike
            c.fillStyle = "rgba(255,90,90,0.75)";
            c.beginPath();
            c.moveTo(0, -s.h * 0.58);
            c.lineTo(-s.w * 0.55, s.h * 0.50);
            c.lineTo(s.w * 0.55, s.h * 0.50);
            c.closePath();
            c.fill();

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.18)";
            c.beginPath();
            c.moveTo(0, -s.h * 0.38);
            c.lineTo(-s.w * 0.18, s.h * 0.10);
            c.lineTo(s.w * 0.18, s.h * 0.10);
            c.closePath();
            c.fill();

            c.restore();
        }

        function drawCoin(o) {
            o.spin += 0.10;
            const wob = (Math.sin(o.spin) * 0.18 + 1);

            c.save();
            c.translate(o.x, o.y);

            c.shadowColor = "rgba(255,220,120,0.55)";
            c.shadowBlur = 18;

            c.fillStyle = "rgba(255,220,120,0.22)";
            c.beginPath();
            c.arc(0, 0, o.r * 1.55, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,220,120,0.85)";
            c.beginPath();
            c.ellipse(0, 0, o.r * wob, o.r, 0, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "rgba(0,0,0,0.20)";
            c.font = "900 12px system-ui, Arial";
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText("C", 0, 1);

            c.restore();
        }

        function drawBalloon(t) {
            const bob = Math.sin(t * 0.004) * 4;

            // rope
            c.strokeStyle = "rgba(255,255,255,0.14)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(p.x, p.y + p.r + 6);
            c.bezierCurveTo(p.x - 10, p.y + p.r + 26, p.x + 10, p.y + p.r + 44, p.x, p.y + p.r + p.tether);
            c.stroke();

            // balloon glow
            c.save();
            c.translate(p.x, p.y + bob);

            const inv = p.invuln > 0 ? 0.35 : 0;
            c.shadowColor = `rgba(120,180,255,${0.55 + inv})`;
            c.shadowBlur = 26;

            const g = c.createRadialGradient(-p.r * 0.35, -p.r * 0.35, p.r * 0.2, 0, 0, p.r * 1.4);
            g.addColorStop(0, "rgba(140,180,255,0.95)");
            g.addColorStop(1, "rgba(60,120,255,0.70)");

            c.fillStyle = g;
            c.beginPath();
            c.ellipse(0, 0, p.r * 1.05, p.r * 1.18, 0, 0, Math.PI * 2);
            c.fill();

            // highlight
            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.14)";
            c.beginPath();
            c.ellipse(-p.r * 0.30, -p.r * 0.25, p.r * 0.26, p.r * 0.36, -0.2, 0, Math.PI * 2);
            c.fill();

            // knot
            c.fillStyle = "rgba(255,255,255,0.18)";
            roundedRect(-6, p.r * 0.95, 12, 10, 5);
            c.fill();

            c.restore();
        }

        function drawStartOverlay() {
            if (started) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.35)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "900 22px system-ui, Arial";
            c.fillText("Balloon PRO", 28, 46);

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "500 16px system-ui, Arial";
            c.fillText("Klicke oder drücke eine Taste zum Starten", 28, 78);
            c.fillText("Zieh den Ballon mit der Maus / Touch – weiche Spikes aus!", 28, 102);

            c.restore();
        }

        // ---------- Loop ----------
        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            if (started) {
                tAlive += dt;

                // wind drift
                wind += (windTarget - wind) * (1 - Math.pow(0.03, dt));
                if (Math.random() < 0.008) windTarget = (Math.random() * 2 - 1) * (140 + tAlive * 3);

                // controls force
                let ax = wind * 0.002;
                let ay = -30; // gentle lift

                if (keys.left) ax -= 220;
                if (keys.right) ax += 220;
                if (keys.up) ay -= 220;
                if (keys.down) ay += 220;

                if (pointer.active) {
                    const dx = pointer.x - p.x;
                    const dy = pointer.y - p.y;
                    ax += dx * 3.2;
                    ay += dy * 3.2;
                }

                // integrate
                p.vx += ax * dt;
                p.vy += ay * dt;

                p.vx *= Math.pow(0.05, dt); // strong damping
                p.vy *= Math.pow(0.05, dt);

                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // bounds
                p.x = clamp(p.x, p.r + 14, W - p.r - 14);
                p.y = clamp(p.y, p.r + 14, H - p.r - 90);

                if (p.invuln > 0) p.invuln -= dt;

                // spawn pacing
                if (spikes.length < 6 && Math.random() < 0.03) spawnSpike(false);
                if (pickups.length < 4 && Math.random() < 0.02) spawnCoin(false);

                // update spikes/coins
                for (let i = spikes.length - 1; i >= 0; i--) {
                    const s = spikes[i];
                    s.x += s.vx * dt;
                    s.bob += dt * 2.2;
                    s.y += Math.sin(s.bob) * 20 * dt;
                    s.a += s.rot * dt;

                    // near miss bonus
                    const near = dist2(p.x, p.y, s.x, s.y) < Math.pow(p.r + s.w * 0.62 + 18, 2);
                    if (near && p.invuln <= 0) {
                        score += Math.floor(30 * dt);
                    }

                    if (s.x < -120) spikes.splice(i, 1);
                }

                for (let i = pickups.length - 1; i >= 0; i--) {
                    const o = pickups[i];
                    o.x += o.vx * dt;
                    o.spin += dt * 6;

                    if (hitCoin(o)) {
                        pickups.splice(i, 1);
                        coins += 1;
                        score += 250;
                        ctx.callbacks?.onScore?.(score);
                        spawnParticles(o.x, o.y, 22, 560, true);
                    } else if (o.x < -80) {
                        pickups.splice(i, 1);
                    }
                }

                // collision
                if (p.invuln <= 0) {
                    for (const s of spikes) {
                        if (hitSpike(s)) {
                            spawnParticles(p.x, p.y, 60, 720, false);
                            running = false;
                            ctx.callbacks?.onGameOver?.({ score, reason: `Geplatzt! Coins: ${coins}` });
                            return;
                        }
                    }
                }

                // passive score
                score += Math.floor(40 * dt);
                ctx.callbacks?.onScore?.(score);
            }

            // draw
            c.clearRect(0, 0, W, H);
            drawBackground(t);

            // draw world
            for (const s of spikes) drawSpike(s);
            for (const o of pickups) drawCoin(o);

            drawBalloon(t);
            drawParticles(dt);
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
                window.addEventListener("keyup", onKeyUp, { passive: false });
                canvas.addEventListener("pointerdown", onPointerDown);
                canvas.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);

                raf = requestAnimationFrame(loop);
            },

            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("keyup", onKeyUp);
                canvas.removeEventListener("pointerdown", onPointerDown);
                canvas.removeEventListener("pointermove", onPointerMove);
                window.removeEventListener("pointerup", onPointerUp);
            },

            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
