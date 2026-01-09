export const rhythm = {
    id: "rhythm",
    name: "Rhythm Timing",
    controls: "SPACE / Klick = Hit",

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
        let combo = 0;
        let bestCombo = 0;

        // timing bar
        const bar = {
            x: Math.floor(W * 0.14),
            y: Math.floor(H * 0.58),
            w: Math.floor(W * 0.72),
            h: 22,
        };

        // moving marker (0..1)
        let tPos = 0.0;
        let dir = 1; // ping-pong
        let speed = 0.85; // units per second (increases)

        // target zones
        // center is perfect
        const perfectR = 0.055; // radius around center in normalized units
        const goodR = 0.12;

        // feedback
        let feedback = null; // {text, life}
        let flash = 0;
        let shake = 0;

        // particles
        const particles = [];
        function spawnParticles(x, y, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.28 + Math.random() * 0.55,
                    t: 0,
                    r: 2 + Math.random() * 3,
                    good,
                });
            }
        }

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        function reset() {
            started = false;
            score = 0;
            combo = 0;
            bestCombo = 0;
            ctx.callbacks?.onScore?.(0);

            tPos = 0.0;
            dir = 1;
            speed = 0.85;

            feedback = null;
            flash = 0;
            shake = 0;

            particles.length = 0;
        }

        function setFeedback(text, good = true) {
            feedback = { text, life: 0.9, good };
        }

        function gradeHit() {
            // distance to center
            const d = Math.abs(tPos - 0.5);

            if (d <= perfectR) return "perfect";
            if (d <= goodR) return "good";
            return "bad";
        }

        function hit() {
            if (!running) return;

            if (!started) {
                started = true;
                return;
            }

            const g = gradeHit();

            const mx = bar.x + tPos * bar.w;
            const my = bar.y + bar.h / 2;

            if (g === "perfect") {
                combo += 1;
                bestCombo = Math.max(bestCombo, combo);

                const add = 220 + combo * 25;
                score += add;

                flash = 0.22;
                shake = Math.min(10, shake + 3);

                setFeedback(`PERFECT +${add}`, true);
                spawnParticles(mx, my, 28, 560, true);
            } else if (g === "good") {
                combo += 1;
                bestCombo = Math.max(bestCombo, combo);

                const add = 120 + combo * 12;
                score += add;

                flash = 0.12;
                setFeedback(`GOOD +${add}`, true);
                spawnParticles(mx, my, 16, 420, true);
            } else {
                // bad: combo breaks and you lose one "life" instantly -> game over for arcade feeling
                spawnParticles(mx, my, 44, 700, false);
                setFeedback("MISS!", false);

                running = false;
                ctx.callbacks?.onGameOver?.({ score, reason: `Miss! Best Combo: ${bestCombo}` });
                return;
            }

            ctx.callbacks?.onScore?.(score);

            // slight difficulty bump on hits
            speed = clamp(speed + 0.06, 0.85, 2.4);
        }

        // ---- Input ----
        function onKeyDown(e) {
            if (e.code === "Space") {
                e.preventDefault();
                hit();
            }
        }
        function onPointerDown() {
            hit();
        }

        // ---- Drawing helpers ----
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

            // subtle moving dots
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
                const p = particles[i];
                p.t += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;

                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = p.good
                    ? `rgba(160,220,255,${0.30 * a})`
                    : `rgba(255,120,120,${0.32 * a})`;

                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();

                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function drawBar() {
            // panel behind
            c.save();
            c.shadowColor = "rgba(0,0,0,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(0,0,0,0.16)";
            roundedRect(bar.x - 14, bar.y - 26, bar.w + 28, 92, 18);
            c.fill();
            c.restore();

            // base bar
            c.fillStyle = "rgba(255,255,255,0.06)";
            roundedRect(bar.x, bar.y, bar.w, bar.h, 999);
            c.fill();

            // zones
            const center = bar.x + bar.w * 0.5;

            // good zone
            c.fillStyle = "rgba(80,220,255,0.10)";
            const gx = center - bar.w * goodR;
            const gw = bar.w * goodR * 2;
            roundedRect(gx, bar.y, gw, bar.h, 999);
            c.fill();

            // perfect zone
            c.fillStyle = "rgba(255,255,255,0.10)";
            const px = center - bar.w * perfectR;
            const pw = bar.w * perfectR * 2;
            roundedRect(px, bar.y, pw, bar.h, 999);
            c.fill();

            // marker
            const mx = bar.x + tPos * bar.w;

            c.save();
            c.shadowColor = "rgba(160,220,255,0.45)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(160,220,255,0.35)";
            c.beginPath();
            c.arc(mx, bar.y + bar.h / 2, 10, 0, Math.PI * 2);
            c.fill();
            c.restore();

            // center tick
            c.strokeStyle = "rgba(255,255,255,0.18)";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(center, bar.y - 10);
            c.lineTo(center, bar.y + bar.h + 10);
            c.stroke();

            // text
            c.fillStyle = "rgba(255,255,255,0.75)";
            c.font = "700 14px system-ui, Arial";
            c.textAlign = "left";
            c.fillText("Hit the center!", bar.x, bar.y - 14);

            c.textAlign = "right";
            c.fillText(`Combo: ${combo}`, bar.x + bar.w, bar.y - 14);
        }

        function drawStartOverlay() {
            if (started) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.30)";
            c.fillRect(0, 0, W, H);

            // Info card (oben links)
            const bx = 22, by = 22, bw = Math.min(460, W - 44), bh = 120;

            c.shadowColor = "rgba(0,0,0,0.60)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(0,0,0,0.22)";
            roundedRect(bx, by, bw, bh, 18);
            c.fill();

            c.shadowBlur = 0;

            // Title (mit Glow)
            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(255,255,255,0.95)";
            c.font = "900 22px system-ui, Arial";
            c.textAlign = "left";
            c.textBaseline = "alphabetic";
            c.fillText("Rhythm Timing", bx + 18, by + 36);

            // Text
            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.82)";
            c.font = "600 15px system-ui, Arial";
            c.fillText("SPACE / Klick = Hit", bx + 18, by + 62);

            c.fillStyle = "rgba(255,255,255,0.70)";
            c.font = "500 14px system-ui, Arial";
            c.fillText("Treffe die Mitte: Perfect / Good / Miss", bx + 18, by + 84);

            c.fillStyle = "rgba(255,255,255,0.62)";
            c.fillText("Klick oder SPACE zum Starten", bx + 18, by + 104);

            c.restore();
        }


        function drawFeedback(dt) {
            if (!feedback) return;
            feedback.life -= dt;
            if (feedback.life <= 0) { feedback = null; return; }

            const a = clamp(feedback.life / 0.9, 0, 1);

            c.save();
            c.fillStyle = feedback.good
                ? `rgba(160,220,255,${0.75 * a})`
                : `rgba(255,120,120,${0.75 * a})`;
            c.font = "900 22px system-ui, Arial";
            c.textAlign = "center";
            c.fillText(feedback.text, W / 2, bar.y + 90);
            c.restore();
        }

        // ---- Loop ----
        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            if (flash > 0) flash -= dt;
            if (shake > 0) shake *= Math.pow(0.03, dt);

            if (started) {
                // ping-pong marker
                tPos += dir * speed * dt;
                if (tPos >= 1) { tPos = 1; dir = -1; }
                if (tPos <= 0) { tPos = 0; dir = 1; }

                // passive score
                score += Math.floor(18 * dt);
                ctx.callbacks?.onScore?.(score);

                // slow ramp even without hits
                speed = clamp(speed + 0.004 * dt, 0.85, 2.6);
            }

            // draw
            c.clearRect(0, 0, W, H);

            const sx = (Math.random() * 2 - 1) * shake;
            const sy = (Math.random() * 2 - 1) * shake;

            c.save();
            c.translate(sx, sy);

            drawBackground(t);
            drawBar();
            drawParticles(dt);
            drawFeedback(dt);
            drawStartOverlay();

            if (flash > 0) {
                c.fillStyle = `rgba(255,255,255,${0.10 * (flash / 0.22)})`;
                c.fillRect(0, 0, W, H);
            }

            c.restore();

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
