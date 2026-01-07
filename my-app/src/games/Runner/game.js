export const knifeThrower = {
    id: "knives",
    name: "Knife Thrower",
    controls: "SPACE / Klick = Werfen",

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

        // Target
        const cx = Math.floor(W * 0.5);
        const cy = Math.floor(H * 0.36);
        const baseR = Math.min(W, H) * 0.12;

        // Gameplay
        let score = 0;
        let level = 1;
        let knivesTotal = 6;   // knives needed this level
        let hits = 0;          // successful hits this level
        let knivesLeft = 6;    // throws remaining

        // Rotation
        let rot = 0;
        let rotVel = 1.2;
        let rotVelTarget = 1.2;

        // Each stuck knife: angle in target-local coordinates
        const stuck = [];

        // Flying knife
        const fly = {
            active: false,
            x: cx,
            y: Math.floor(H * 0.86),
            vy: -1250,
        };

        // Juice
        let shake = 0;
        let flashGood = 0;
        let flashBad = 0;

        // Particles
        const particles = [];
        function spawnParticles(x, y, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x,
                    y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.35 + Math.random() * 0.6,
                    t: 0,
                    r: 2 + Math.random() * 3,
                    good,
                });
            }
        }

        function clamp(v, a, b) {
            return Math.max(a, Math.min(b, v));
        }

        function wrapAngle(a) {
            while (a > Math.PI) a -= Math.PI * 2;
            while (a < -Math.PI) a += Math.PI * 2;
            return a;
        }

        function resetAll() {
            score = 0;
            level = 1;

            rot = 0;
            rotVel = 1.2;
            rotVelTarget = 1.2;

            stuck.length = 0;
            particles.length = 0;

            fly.active = false;
            fly.x = cx;
            fly.y = Math.floor(H * 0.86);

            shake = 0;
            flashGood = 0;
            flashBad = 0;

            setupLevel(1);
            ctx.callbacks?.onScore?.(0);
        }

        function setupLevel(lv) {
            level = lv;

            // difficulty scaling
            knivesTotal = clamp(6 + Math.floor((lv - 1) * 0.9), 6, 12);
            knivesLeft = knivesTotal;
            hits = 0;

            stuck.length = 0;
            fly.active = false;

            // rotation ramps
            const base = 1.0 + lv * 0.12;
            rotVel = (Math.random() < 0.5 ? -1 : 1) * base;
            rotVelTarget = (Math.random() < 0.5 ? -1 : 1) * (base + 0.35 + Math.random() * 0.4);

            flashGood = 0.18;
        }

        function gameOver(reason) {
            running = false;
            ctx.callbacks?.onGameOver?.({ score, reason });
        }

        function attemptThrow() {
            if (!running) return;

            if (!started) {
                started = true;
                return;
            }

            if (fly.active) return;
            if (knivesLeft <= 0) return;

            knivesLeft -= 1;

            fly.active = true;
            fly.x = cx;
            fly.y = Math.floor(H * 0.86);

            spawnParticles(cx, fly.y, 10, 320, true);
        }

        function onKeyDown(e) {
            if (e.code === "Space") {
                e.preventDefault();
                attemptThrow();
            }
        }
        function onPointerDown() {
            attemptThrow();
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

            const off = (t * 0.08) % 22;
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
            c.fillStyle = "rgba(255,255,255,0.86)";
            c.font = "800 18px system-ui, Arial";
            c.fillText(`Level: ${level}`, 22, 34);

            c.fillStyle = "rgba(255,255,255,0.70)";
            c.font = "600 14px system-ui, Arial";
            c.fillText(`Treffer: ${hits}/${knivesTotal}`, 22, 58);

            c.restore();
        }

        function drawStartOverlay() {
            if (started) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.35)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "900 22px system-ui, Arial";
            c.fillText("Knife Thrower", 28, 46);

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "500 16px system-ui, Arial";
            c.fillText("SPACE/Klick zum Starten", 28, 78);
            c.fillText("Wirf Messer – triff keine anderen Messer!", 28, 102);

            c.restore();
        }

        function drawKnifeAtLocalAngle(aLocal, r) {
            // local angle (target coordinates)
            // Knife points outward from center at angle
            const len = r * 0.90;
            const w = 6; // slimmer looks better & plays better

            c.save();
            c.translate(cx, cy);
            c.rotate(rot + aLocal);

            // blade
            c.save();
            c.shadowColor = "rgba(255,255,255,0.22)";
            c.shadowBlur = 10;

            const gg = c.createLinearGradient(0, -len, 0, 0);
            gg.addColorStop(0, "rgba(255,255,255,0.92)");
            gg.addColorStop(1, "rgba(255,255,255,0.15)");
            c.fillStyle = gg;

            roundedRect(-w / 2, -len, w, len - 12, 6);
            c.fill();
            c.restore();

            // tip
            c.fillStyle = "rgba(255,255,255,0.78)";
            c.beginPath();
            c.moveTo(0, -len - 10);
            c.lineTo(-w / 2, -len + 2);
            c.lineTo(w / 2, -len + 2);
            c.closePath();
            c.fill();

            // handle
            c.shadowColor = "rgba(80,220,255,0.35)";
            c.shadowBlur = 10;
            c.fillStyle = "rgba(80,220,255,0.22)";
            roundedRect(-w / 2, -10, w, 18, 6);
            c.fill();

            c.restore();
        }

        function drawTarget() {
            // target disc + stuck knives
            // draw in world space but knives are drawn via helper above (rot + local angle)

            // outer glow
            c.save();
            c.shadowColor = "rgba(80,220,255,0.22)";
            c.shadowBlur = 26;
            c.fillStyle = "rgba(0,0,0,0.16)";
            c.beginPath();
            c.arc(cx, cy, baseR + 18, 0, Math.PI * 2);
            c.fill();
            c.restore();

            // disc
            c.save();
            c.translate(cx, cy);
            c.rotate(rot);

            const discG = c.createRadialGradient(-baseR * 0.35, -baseR * 0.35, baseR * 0.2, 0, 0, baseR);
            discG.addColorStop(0, "rgba(210,160,110,0.95)");
            discG.addColorStop(1, "rgba(120,80,45,0.90)");
            c.fillStyle = discG;
            c.beginPath();
            c.arc(0, 0, baseR, 0, Math.PI * 2);
            c.fill();

            c.strokeStyle = "rgba(0,0,0,0.22)";
            c.lineWidth = 4;
            for (let r = baseR * 0.25; r < baseR; r += baseR * 0.25) {
                c.beginPath();
                c.arc(0, 0, r, 0, Math.PI * 2);
                c.stroke();
            }

            c.fillStyle = "rgba(80,220,255,0.20)";
            c.beginPath();
            c.arc(0, 0, baseR * 0.14, 0, Math.PI * 2);
            c.fill();

            c.restore();

            // stuck knives: use radius slightly INSIDE the disc edge
            const stuckR = baseR - 10;
            for (const aLocal of stuck) {
                drawKnifeAtLocalAngle(aLocal, stuckR);
            }

            // feedback flash
            if (flashGood > 0) {
                c.save();
                c.fillStyle = `rgba(80,220,255,${0.16 * (flashGood / 0.20)})`;
                c.fillRect(0, 0, W, H);
                c.restore();
            }
            if (flashBad > 0) {
                c.save();
                c.fillStyle = `rgba(255,90,90,${0.18 * (flashBad / 0.24)})`;
                c.fillRect(0, 0, W, H);
                c.restore();
            }
        }

        function drawFlyingKnife() {
            const x = fly.x;
            const y = fly.y;

            c.save();
            c.translate(x, y);

            c.shadowColor = "rgba(255,255,255,0.28)";
            c.shadowBlur = 14;

            const bladeLen = 120;
            const w = 8;

            const g = c.createLinearGradient(0, -bladeLen, 0, 0);
            g.addColorStop(0, "rgba(255,255,255,0.92)");
            g.addColorStop(1, "rgba(255,255,255,0.15)");
            c.fillStyle = g;
            roundedRect(-w / 2, -bladeLen, w, bladeLen - 16, 7);
            c.fill();

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.beginPath();
            c.moveTo(0, -bladeLen - 12);
            c.lineTo(-w / 2, -bladeLen + 2);
            c.lineTo(w / 2, -bladeLen + 2);
            c.closePath();
            c.fill();

            c.shadowColor = "rgba(80,220,255,0.35)";
            c.shadowBlur = 12;
            c.fillStyle = "rgba(80,220,255,0.22)";
            roundedRect(-w / 2, -8, w, 20, 7);
            c.fill();

            c.restore();
        }

        // ---------- Loop ----------
        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            flashGood = Math.max(0, flashGood - dt);
            flashBad = Math.max(0, flashBad - dt);
            shake = Math.max(0, shake - dt);

            if (started) {
                // rotation smoothing
                rotVel += (rotVelTarget - rotVel) * (1 - Math.pow(0.02, dt));
                rot += rotVel * dt;

                // occasional velocity target change
                if (Math.random() < 0.010) {
                    const base = 1.0 + level * 0.12;
                    rotVelTarget = (Math.random() < 0.5 ? -1 : 1) * (base + Math.random() * 0.55);
                }
            }

            // update flying knife
            if (started && fly.active) {
                fly.y += fly.vy * dt;

                // When reaching target edge => attempt stick
                const hitLine = cy + baseR - 8; // slightly inside disc edge
                if (fly.y <= hitLine) {
                    // Incoming knife is coming from bottom to center.
                    // In world space it points "up" into the disc. The outward direction at bottom is +90deg.
                    // So knife should stick at world angle = +90deg.
                    const aWorld = Math.PI / 2;

                    // Convert to target-local angle (remove current rotation)
                    const aLocal = wrapAngle(aWorld - rot);

                    // Collision check with existing stuck knives (angle spacing)
                    // 0.20 rad ~ 11.5 degrees: good balance
                    let collide = false;
                    for (const s of stuck) {
                        const d = Math.abs(wrapAngle(aLocal - s));
                        if (d < 0.20) { collide = true; break; }
                    }

                    if (collide) {
                        spawnParticles(cx, hitLine, 46, 640, false);
                        flashBad = 0.24;
                        shake = 0.20;
                        fly.active = false;
                        gameOver("Messer getroffen!");
                        return;
                    }

                    // success
                    stuck.push(aLocal);
                    hits += 1;

                    score += 160 + Math.floor(level * 14);
                    ctx.callbacks?.onScore?.(score);

                    spawnParticles(cx, hitLine, 28, 520, true);
                    flashGood = 0.20;

                    fly.active = false;

                    // Level cleared?
                    if (hits >= knivesTotal) {
                        // bonus
                        score += 250 + level * 40;
                        ctx.callbacks?.onScore?.(score);

                        // next level after short flash
                        setupLevel(level + 1);
                    }
                }
            }

            // passive score
            if (started) {
                score += Math.floor(12 * dt);
                ctx.callbacks?.onScore?.(score);
            }

            // draw
            c.clearRect(0, 0, W, H);

            if (shake > 0) {
                const mag = 10 * (shake / 0.20);
                const sx = (Math.random() * 2 - 1) * mag;
                const sy = (Math.random() * 2 - 1) * mag;
                c.save();
                c.translate(sx, sy);

                drawBackground(t);
                drawParticles(dt);
                drawHUD();
                drawTarget();
                if (fly.active) drawFlyingKnife();
                drawStartOverlay();

                c.restore();
            } else {
                drawBackground(t);
                drawParticles(dt);
                drawHUD();
                drawTarget();
                if (fly.active) drawFlyingKnife();
                drawStartOverlay();
            }

            raf = requestAnimationFrame(loop);
        }

        return {
            start() {
                if (running) return;
                running = true;
                started = false;

                resetAll();

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
