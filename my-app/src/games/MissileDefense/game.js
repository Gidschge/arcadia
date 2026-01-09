export const missiledefense = {
    id: "missiledefense",
    name: "Missile Defense",
    controls: "Klick = Abfangrakete",

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
        let combo = 0;
        let lives = 3;
        let started = false;

        const missiles = [];
        const interceptors = [];
        const explosions = [];
        const particles = [];

        const groundY = H - 44;
        const base = { x: W / 2, y: groundY };

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

        function spawnParticles(x, y, good = true, n = 22) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * 420,
                    vy: (Math.random() * 2 - 1) * 420,
                    t: 0,
                    life: 0.45 + Math.random() * 0.45,
                    good
                });
            }
        }

        function reset() {
            score = 0;
            combo = 0;
            lives = 3;
            started = false;
            missiles.length = 0;
            interceptors.length = 0;
            explosions.length = 0;
            particles.length = 0;
            ctx.callbacks?.onScore?.(0);
        }

        let spawnT = 0;
        let difficulty = 1;

        function spawnMissile() {
            missiles.push({
                x: Math.random() * W,
                y: -20,
                vx: (Math.random() * 2 - 1) * 20,
                vy: 140 + Math.random() * 120 + difficulty * 25,
                alive: true,
            });
        }

        function fireAt(x, y) {
            started = true;
            interceptors.push({
                x: base.x,
                y: base.y,
                tx: x,
                ty: y,
                t: 0,
                speed: 720,
                alive: true,
            });
        }

        function onPointerDown(e) {
            const r = canvas.getBoundingClientRect();
            const mx = e.clientX - r.left;
            const my = e.clientY - r.top;
            fireAt(mx, my);
        }

        function step(dt) {
            // spawn ramp
            spawnT -= dt;
            if (spawnT <= 0) {
                spawnMissile();
                spawnT = Math.max(0.35, 1.1 - difficulty * 0.08);
                difficulty += dt * 0.28;
            }

            // missiles
            for (const m of missiles) {
                if (!m.alive) continue;
                m.x += m.vx * dt;
                m.y += m.vy * dt;

                if (m.y >= groundY) {
                    m.alive = false;
                    lives -= 1;
                    combo = 0;
                    spawnParticles(m.x, groundY, false, 40);

                    if (lives <= 0) {
                        ctx.callbacks?.onGameOver?.({ score, reason: "Städte zerstört!" });
                        running = false;
                        return;
                    }
                }
            }

            // interceptors -> create explosion at target
            for (const it of interceptors) {
                if (!it.alive) continue;
                const dx = it.tx - it.x;
                const dy = it.ty - it.y;
                const dist = Math.hypot(dx, dy);
                const stepLen = it.speed * dt;

                if (dist <= stepLen || dist < 3) {
                    it.alive = false;
                    explosions.push({
                        x: it.tx, y: it.ty,
                        r: 0,
                        max: 64,
                        t: 0,
                        life: 0.55,
                    });
                    spawnParticles(it.tx, it.ty, true, 20);
                } else {
                    it.x += (dx / dist) * stepLen;
                    it.y += (dy / dist) * stepLen;
                }
            }

            // explosions damage missiles
            for (const ex of explosions) {
                ex.t += dt;
                ex.r = ex.max * Math.sin(Math.min(1, ex.t / ex.life) * (Math.PI / 2));

                for (const m of missiles) {
                    if (!m.alive) continue;
                    const d = Math.hypot(m.x - ex.x, m.y - ex.y);
                    if (d < ex.r) {
                        m.alive = false;
                        combo += 1;
                        const add = 120 + combo * 35;
                        score += add;
                        ctx.callbacks?.onScore?.(score);
                        spawnParticles(m.x, m.y, true, 28);
                    }
                }
            }

            // cleanup
            for (let i = missiles.length - 1; i >= 0; i--) if (!missiles[i].alive) missiles.splice(i, 1);
            for (let i = interceptors.length - 1; i >= 0; i--) if (!interceptors[i].alive) interceptors.splice(i, 1);
            for (let i = explosions.length - 1; i >= 0; i--) if (explosions[i].t >= explosions[i].life) explosions.splice(i, 1);

            // particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.t += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function draw(t, dt) {
            c.clearRect(0, 0, W, H);

            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.24)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // Info
            c.save();
            c.fillStyle = "rgba(0,0,0,0.18)";
            roundedRect(16, 14, Math.min(620, W - 32), 46, 16);
            c.fill();
            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 16;
            c.fillStyle = "rgba(255,255,255,0.95)";
            c.font = "900 16px system-ui, Arial";
            c.fillText("Missile Defense", 32, 34);
            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "600 13px system-ui, Arial";
            c.fillText(`Leben: ${lives} • Combo: x${combo} • Klick = Abfangen`, 32, 52);
            c.restore();

            // Ground
            c.save();
            c.strokeStyle = "rgba(255,255,255,0.10)";
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(0, groundY);
            c.lineTo(W, groundY);
            c.stroke();
            c.restore();

            // Base
            c.save();
            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(160,220,255,0.18)";
            c.beginPath();
            c.arc(base.x, base.y, 10, 0, Math.PI * 2);
            c.fill();
            c.restore();

            // Missiles
            for (const m of missiles) {
                c.save();
                c.shadowColor = "rgba(255,120,120,0.55)";
                c.shadowBlur = 16;
                c.strokeStyle = "rgba(255,120,120,0.75)";
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(m.x, m.y - 12);
                c.lineTo(m.x - m.vx * 0.03, m.y - m.vy * 0.03);
                c.stroke();

                c.fillStyle = "rgba(255,120,120,0.85)";
                c.beginPath();
                c.arc(m.x, m.y, 3.2, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }

            // Interceptors
            for (const it of interceptors) {
                c.save();
                c.shadowColor = "rgba(160,220,255,0.55)";
                c.shadowBlur = 16;
                c.strokeStyle = "rgba(160,220,255,0.65)";
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(base.x, base.y);
                c.lineTo(it.x, it.y);
                c.stroke();

                c.fillStyle = "rgba(255,255,255,0.85)";
                c.beginPath();
                c.arc(it.x, it.y, 3, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }

            // Explosions
            for (const ex of explosions) {
                c.save();
                c.shadowColor = "rgba(160,220,255,0.55)";
                c.shadowBlur = 22;
                c.fillStyle = "rgba(160,220,255,0.10)";
                c.beginPath();
                c.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
                c.fill();

                c.strokeStyle = "rgba(255,255,255,0.12)";
                c.lineWidth = 2;
                c.beginPath();
                c.arc(ex.x, ex.y, ex.r, 0, Math.PI * 2);
                c.stroke();
                c.restore();
            }

            // particles
            for (const p of particles) {
                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = p.good ? `rgba(160,220,255,${0.30 * a})` : `rgba(255,120,120,${0.32 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
                c.fill();
            }

            if (!started) {
                c.save();
                c.fillStyle = "rgba(0,0,0,0.22)";
                c.fillRect(0, 0, W, H);
                c.fillStyle = "rgba(255,255,255,0.92)";
                c.font = "900 22px system-ui, Arial";
                c.fillText("Klick zum Starten", 32, H - 56);
                c.restore();
            }
        }

        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - last) / 1000);
            last = t;

            if (started) step(dt);
            draw(t, dt);

            raf = requestAnimationFrame(loop);
        }

        return {
            start() {
                if (running) return;
                running = true;
                reset();
                last = performance.now();

                canvas.addEventListener("pointerdown", onPointerDown);
                raf = requestAnimationFrame(loop);
            },
            stop() {
                running = false;
                cancelAnimationFrame(raf);
                canvas.removeEventListener("pointerdown", onPointerDown);
            },
            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
