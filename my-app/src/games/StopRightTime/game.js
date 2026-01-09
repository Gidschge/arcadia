export const stopRightTime = {
    id: "stop",
    name: "Stop at the Right Time",
    controls: "SPACE / Klick = Stop",

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

        // Game state
        let score = 0;
        let combo = 0;
        let level = 1;

        // Cursor moves 0..1 back and forth
        let x = 0.2;
        let dir = 1;
        let speed = 1.05; // units per second (in normalized bar space)

        // Target zone center & width (normalized)
        let targetCenter = 0.72;
        let targetWidth = 0.20;

        // Feedback / juice
        let shake = 0;
        let flashGood = 0;
        let flashBad = 0;

        const particles = [];
        function spawnParticles(px, py, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x: px,
                    y: py,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.45 + Math.random() * 0.55,
                    t: 0,
                    r: 2 + Math.random() * 3,
                    good,
                });
            }
        }

        function clamp01(v) {
            return Math.max(0, Math.min(1, v));
        }

        function reset() {
            score = 0;
            combo = 0;
            level = 1;

            x = 0.2;
            dir = 1;
            speed = 1.05;

            targetCenter = 0.72;
            targetWidth = 0.20;

            shake = 0;
            flashGood = 0;
            flashBad = 0;
            particles.length = 0;

            ctx.callbacks?.onScore?.(0);
        }

        function nextRound(success) {
            if (success) {
                combo += 1;
                level += 1;

                // Score: base + combo bonus
                const gain = 120 + combo * 25;
                score += gain;
                ctx.callbacks?.onScore?.(score);

                // Harder: smaller target, faster cursor
                targetWidth = Math.max(0.07, targetWidth * 0.92);
                speed = Math.min(2.4, speed + 0.08);

                // New target somewhere else
                targetCenter = 0.15 + Math.random() * 0.70;

                flashGood = 0.22;
            } else {
                // lose combo (but not score)
                combo = 0;

                // Make it slightly easier after fail
                targetWidth = Math.min(0.24, targetWidth * 1.08);
                speed = Math.max(1.0, speed - 0.06);

                // move target
                targetCenter = 0.15 + Math.random() * 0.70;

                flashBad = 0.26;
                shake = 0.20;
            }
        }

        function attemptStop() {
            if (!running) return;

            if (!started) {
                started = true;
                return;
            }

            const left = targetCenter - targetWidth / 2;
            const right = targetCenter + targetWidth / 2;

            const ok = x >= left && x <= right;

            const barX = Math.floor(W * 0.12);
            const barW = Math.floor(W * 0.76);
            const barY = Math.floor(H * 0.52);
            const barH = Math.max(18, Math.floor(H * 0.07));

            const px = barX + x * barW;
            const py = barY + barH / 2;

            if (ok) {
                spawnParticles(px, py, 26, 420, true);
            } else {
                spawnParticles(px, py, 30, 520, false);
            }

            nextRound(ok);
        }

        function onKeyDown(e) {
            if (e.code === "Space") {
                e.preventDefault();
                attemptStop();
            }
        }
        function onPointerDown() {
            attemptStop();
        }

        // ----- Drawing helpers -----
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

        function drawBackground(time) {
            // subtle internal gradient
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // moving scanlines
            const off = (time * 0.08) % 22;
            c.strokeStyle = "rgba(255,255,255,0.04)";
            c.lineWidth = 1;
            for (let y = -30; y < H + 30; y += 22) {
                c.beginPath();
                c.moveTo(0, y + off);
                c.lineTo(W, y + off);
                c.stroke();
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
                    ? `rgba(160,220,255,${0.35 * a})`
                    : `rgba(255,120,120,${0.35 * a})`;

                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();

                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function drawHUD() {
            c.save();
            c.fillStyle = "rgba(255,255,255,0.85)";
            c.font = "700 18px system-ui, Arial";
            c.fillText(`Level: ${level}`, 22, 34);

            c.fillStyle = "rgba(255,255,255,0.70)";
            c.font = "600 14px system-ui, Arial";
            c.fillText(`Combo: x${combo}`, 22, 58);

            c.restore();
        }

        function drawStartOverlay() {
            if (started) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.35)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "800 22px system-ui, Arial";
            c.fillText("Stop at the Right Time", 28, 46);

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "500 16px system-ui, Arial";
            c.fillText("Drücke SPACE oder klicke zum Starten", 28, 78);
            c.fillText("Dann stoppe den Cursor in der Zielzone.", 28, 102);

            c.restore();
        }

        function drawBar() {
            const barX = Math.floor(W * 0.12);
            const barW = Math.floor(W * 0.76);
            const barY = Math.floor(H * 0.52);
            const barH = Math.max(18, Math.floor(H * 0.07));

            // Bar background
            c.save();
            c.shadowColor = "rgba(0,0,0,0.55)";
            c.shadowBlur = 16;
            c.fillStyle = "rgba(0,0,0,0.20)";
            roundedRect(barX, barY, barW, barH, 16);
            c.fill();
            c.restore();

            // Target zone
            const left = clamp01(targetCenter - targetWidth / 2);
            const right = clamp01(targetCenter + targetWidth / 2);

            const tx = barX + left * barW;
            const tw = (right - left) * barW;

            c.save();
            c.shadowColor = "rgba(0,255,255,0.35)";
            c.shadowBlur = 18;

            const tg = c.createLinearGradient(tx, barY, tx + tw, barY + barH);
            tg.addColorStop(0, "rgba(80,220,255,0.20)");
            tg.addColorStop(0.5, "rgba(80,220,255,0.45)");
            tg.addColorStop(1, "rgba(80,220,255,0.20)");

            c.fillStyle = tg;
            roundedRect(tx, barY + 4, tw, barH - 8, 12);
            c.fill();
            c.restore();

            // Cursor
            const cx = barX + x * barW;
            const cy = barY + barH / 2;

            c.save();
            c.shadowColor = "rgba(255,255,255,0.35)";
            c.shadowBlur = 16;

            const cg = c.createLinearGradient(cx - 8, barY, cx + 8, barY + barH);
            cg.addColorStop(0, "rgba(255,255,255,0.20)");
            cg.addColorStop(0.5, "rgba(255,255,255,0.88)");
            cg.addColorStop(1, "rgba(255,255,255,0.20)");

            c.fillStyle = cg;
            roundedRect(cx - 8, barY - 10, 16, barH + 20, 10);
            c.fill();

            // Little arrow indicator
            c.fillStyle = "rgba(255,255,255,0.75)";
            c.beginPath();
            c.moveTo(cx, barY - 14);
            c.lineTo(cx - 8, barY - 2);
            c.lineTo(cx + 8, barY - 2);
            c.closePath();
            c.fill();

            c.restore();

            // Feedback flash overlay
            if (flashGood > 0) {
                c.save();
                c.fillStyle = `rgba(80,220,255,${0.20 * (flashGood / 0.22)})`;
                roundedRect(barX, barY, barW, barH, 16);
                c.fill();
                c.restore();
            }
            if (flashBad > 0) {
                c.save();
                c.fillStyle = `rgba(255,90,90,${0.22 * (flashBad / 0.26)})`;
                roundedRect(barX, barY, barW, barH, 16);
                c.fill();
                c.restore();
            }
        }

        function loop(time) {
            if (!running) return;
            const dt = Math.min(0.033, (time - lastTime) / 1000);
            lastTime = time;

            // Update juice timers
            flashGood = Math.max(0, flashGood - dt);
            flashBad = Math.max(0, flashBad - dt);
            shake = Math.max(0, shake - dt);

            // Update cursor movement only after start
            if (started) {
                x += dir * speed * dt;
                if (x <= 0) { x = 0; dir = 1; }
                if (x >= 1) { x = 1; dir = -1; }
            }

            // Draw
            c.clearRect(0, 0, W, H);

            // camera shake
            if (shake > 0) {
                const mag = 10 * (shake / 0.20);
                const sx = (Math.random() * 2 - 1) * mag;
                const sy = (Math.random() * 2 - 1) * mag;
                c.save();
                c.translate(sx, sy);
                drawBackground(time);
                drawParticles(dt);
                drawHUD();
                drawBar();
                drawStartOverlay();
                c.restore();
            } else {
                drawBackground(time);
                drawParticles(dt);
                drawHUD();
                drawBar();
                drawStartOverlay();
            }

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
