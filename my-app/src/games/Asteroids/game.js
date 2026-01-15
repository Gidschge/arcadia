export const asteroids = {
    id: "asteroids",
    name: "Neon Asteroids",
    controls: "A/D drehen • W Schub • SPACE/Klick schießen",

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

        const keys = { left: false, right: false, up: false };
        let shootHeld = false;

        let score = 0;
        let timeAlive = 0;

        let shake = 0;

        const ship = {
            x: W * 0.5,
            y: H * 0.62,
            vx: 0,
            vy: 0,
            a: -Math.PI / 2,
            av: 0,
            r: 16,
            cd: 0,
            inv: 0,
        };

        const bullets = [];
        const rocks = [];
        const particles = [];

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
        function wrap(o) {
            if (o.x < -40) o.x = W + 40;
            if (o.x > W + 40) o.x = -40;
            if (o.y < -40) o.y = H + 40;
            if (o.y > H + 40) o.y = -40;
        }
        function dist2(ax, ay, bx, by) {
            const dx = ax - bx, dy = ay - by;
            return dx * dx + dy * dy;
        }

        function spawnParticles(x, y, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.25 + Math.random() * 0.55,
                    t: 0,
                    r: 1.5 + Math.random() * 3,
                    good,
                });
            }
        }

        function spawnRock(size = 3, x = Math.random() * W, y = Math.random() * H) {
            // size: 3 big, 2 medium, 1 small
            const base = size === 3 ? 52 : size === 2 ? 34 : 20;
            const r = base + Math.random() * 6;

            // avoid spawning on ship
            if (dist2(x, y, ship.x, ship.y) < 140 * 140) {
                x = (x + W * 0.45) % W;
                y = (y + H * 0.45) % H;
            }

            const sp = (size === 3 ? 40 : size === 2 ? 70 : 95) + Math.random() * 25;
            const ang = Math.random() * Math.PI * 2;

            // irregular polygon
            const pts = [];
            const steps = 10 + Math.floor(Math.random() * 5);
            for (let i = 0; i < steps; i++) {
                const a = (i / steps) * Math.PI * 2;
                const rr = r * (0.72 + Math.random() * 0.45);
                pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
            }

            rocks.push({
                size,
                x, y,
                vx: Math.cos(ang) * sp,
                vy: Math.sin(ang) * sp,
                a: Math.random() * Math.PI * 2,
                av: (Math.random() * 2 - 1) * (size === 3 ? 0.6 : 1.1),
                r,
                pts,
            });
        }

        function reset() {
            started = false;
            score = 0;
            timeAlive = 0;
            shake = 0;

            ship.x = W * 0.5;
            ship.y = H * 0.62;
            ship.vx = 0;
            ship.vy = 0;
            ship.a = -Math.PI / 2;
            ship.av = 0;
            ship.cd = 0;
            ship.inv = 0.9;

            bullets.length = 0;
            rocks.length = 0;
            particles.length = 0;

            ctx.callbacks?.onScore?.(0);

            for (let i = 0; i < 4; i++) spawnRock(3);
        }

        function fire() {
            if (!started || ship.cd > 0) return;
            ship.cd = 0.16;

            const sp = 680;
            const bx = ship.x + Math.cos(ship.a) * (ship.r + 6);
            const by = ship.y + Math.sin(ship.a) * (ship.r + 6);

            bullets.push({
                x: bx, y: by,
                vx: ship.vx + Math.cos(ship.a) * sp,
                vy: ship.vy + Math.sin(ship.a) * sp,
                life: 0.9,
                t: 0,
            });

            spawnParticles(bx, by, 10, 220, true);
        }

        // -------- Input --------
        function onKeyDown(e) {
            const k = e.code;
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(k)) e.preventDefault();
            if (!started) started = true;

            if (k === "ArrowLeft" || k === "KeyA") keys.left = true;
            if (k === "ArrowRight" || k === "KeyD") keys.right = true;
            if (k === "ArrowUp" || k === "KeyW") keys.up = true;
            if (k === "Space") { shootHeld = true; fire(); }
        }
        function onKeyUp(e) {
            const k = e.code;
            if (k === "ArrowLeft" || k === "KeyA") keys.left = false;
            if (k === "ArrowRight" || k === "KeyD") keys.right = false;
            if (k === "ArrowUp" || k === "KeyW") keys.up = false;
            if (k === "Space") shootHeld = false;
        }
        function onPointerDown() {
            if (!started) started = true;
            shootHeld = true;
            fire();
        }
        function onPointerUp() {
            shootHeld = false;
        }

        // -------- Draw helpers --------
        function drawBackground(t) {
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // stars
            const off = (t * 0.04) % 60;
            c.fillStyle = "rgba(255,255,255,0.06)";
            for (let y = 12; y < H; y += 60) {
                for (let x = 14; x < W; x += 90) {
                    c.beginPath();
                    c.arc(x + off, y, 1.6, 0, Math.PI * 2);
                    c.fill();
                }
            }
        }

        function drawShip() {
            c.save();
            c.translate(ship.x, ship.y);
            c.rotate(ship.a);

            const inv = ship.inv > 0 ? 0.35 : 0;
            c.shadowColor = `rgba(120,180,255,${0.55 + inv})`;
            c.shadowBlur = 22;

            // body
            c.fillStyle = "rgba(140,180,255,0.22)";
            c.beginPath();
            c.moveTo(ship.r + 8, 0);
            c.lineTo(-ship.r, -ship.r * 0.75);
            c.lineTo(-ship.r * 0.45, 0);
            c.lineTo(-ship.r, ship.r * 0.75);
            c.closePath();
            c.fill();

            // highlight
            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.10)";
            c.beginPath();
            c.moveTo(ship.r + 2, 0);
            c.lineTo(-ship.r * 0.40, -ship.r * 0.35);
            c.lineTo(-ship.r * 0.18, 0);
            c.lineTo(-ship.r * 0.40, ship.r * 0.35);
            c.closePath();
            c.fill();

            // flame when thrust
            if (keys.up && started) {
                c.fillStyle = "rgba(80,220,255,0.22)";
                c.beginPath();
                c.moveTo(-ship.r * 0.55, 0);
                c.lineTo(-ship.r - 18 - Math.random() * 10, -8);
                c.lineTo(-ship.r - 18 - Math.random() * 10, 8);
                c.closePath();
                c.fill();
            }

            c.restore();
        }

        function drawRocks() {
            for (const r of rocks) {
                c.save();
                c.translate(r.x, r.y);
                c.rotate(r.a);

                // ✅ stronger neon glow (blue-ish, passt zu deinem Style)
                c.shadowColor = "rgba(160,220,255,0.55)";
                c.shadowBlur = 22;

                // ✅ slightly more visible fill
                c.fillStyle = "rgba(80,140,200,0.16)";

                c.beginPath();
                c.moveTo(r.pts[0][0], r.pts[0][1]);
                for (let i = 1; i < r.pts.length; i++) c.lineTo(r.pts[i][0], r.pts[i][1]);
                c.closePath();
                c.fill();

                // ✅ clear outline
                c.shadowBlur = 0;
                c.strokeStyle = "rgba(235,248,255,0.75)";
                c.lineWidth = Math.max(2.5, r.r * 0.06);
                c.stroke();

                // ✅ subtle inner highlight (adds depth)
                c.strokeStyle = "rgba(255,255,255,0.14)";
                c.lineWidth = 1;
                c.stroke();

                c.restore();
            }
        }


        function drawBullets() {
            for (const b of bullets) {
                c.save();
                c.shadowColor = "rgba(80,220,255,0.35)";
                c.shadowBlur = 12;
                c.fillStyle = "rgba(160,220,255,0.45)";
                c.beginPath();
                c.arc(b.x, b.y, 3.2, 0, Math.PI * 2);
                c.fill();
                c.restore();
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

        function drawStartOverlay() {
            if (started) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.35)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "900 22px system-ui, Arial";
            c.fillText("Neon Asteroids", 28, 46);

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "500 16px system-ui, Arial";
            c.fillText("Klicke oder drücke eine Taste zum Starten", 28, 78);
            c.fillText("A/D drehen • W Schub • SPACE/Klick schießen", 28, 102);

            c.restore();
        }

        // -------- Update loop --------
        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            if (started) {
                timeAlive += dt;

                // ramp difficulty: keep more rocks
                const desired = Math.min(10, 4 + Math.floor(timeAlive / 10));
                while (rocks.length < desired) spawnRock(3);

                // ship rotation + thrust
                const turn = 5.0;
                if (keys.left) ship.a -= turn * dt;
                if (keys.right) ship.a += turn * dt;

                if (keys.up) {
                    const thrust = 420;
                    ship.vx += Math.cos(ship.a) * thrust * dt;
                    ship.vy += Math.sin(ship.a) * thrust * dt;
                    spawnParticles(
                        ship.x - Math.cos(ship.a) * 16,
                        ship.y - Math.sin(ship.a) * 16,
                        2, 120, true
                    );
                }

                // damping
                ship.vx *= Math.pow(0.12, dt);
                ship.vy *= Math.pow(0.12, dt);

                ship.x += ship.vx * dt;
                ship.y += ship.vy * dt;
                wrap(ship);

                if (ship.cd > 0) ship.cd -= dt;
                if (ship.inv > 0) ship.inv -= dt;

                // bullets
                for (let i = bullets.length - 1; i >= 0; i--) {
                    const b = bullets[i];
                    b.t += dt;
                    b.x += b.vx * dt;
                    b.y += b.vy * dt;
                    wrap(b);
                    if (b.t >= b.life) bullets.splice(i, 1);
                }

                // rocks
                for (const r of rocks) {
                    r.x += r.vx * dt;
                    r.y += r.vy * dt;
                    r.a += r.av * dt;
                    wrap(r);
                }

                // collisions: bullet-rock
                for (let bi = bullets.length - 1; bi >= 0; bi--) {
                    const b = bullets[bi];
                    let hit = -1;
                    for (let ri = 0; ri < rocks.length; ri++) {
                        const r = rocks[ri];
                        const rr = r.r + 4;
                        if (dist2(b.x, b.y, r.x, r.y) <= rr * rr) {
                            hit = ri;
                            break;
                        }
                    }
                    if (hit >= 0) {
                        const r = rocks[hit];
                        bullets.splice(bi, 1);
                        rocks.splice(hit, 1);

                        shake = Math.min(10, shake + 4);
                        spawnParticles(r.x, r.y, 34, 520, true);

                        score += (r.size === 3 ? 150 : r.size === 2 ? 240 : 360);
                        ctx.callbacks?.onScore?.(score);

                        // split
                        if (r.size > 1) {
                            spawnRock(r.size - 1, r.x + Math.random() * 8, r.y + Math.random() * 8);
                            spawnRock(r.size - 1, r.x - Math.random() * 8, r.y - Math.random() * 8);
                        }

                        break;
                    }
                }

                // collision: ship-rock
                if (ship.inv <= 0) {
                    for (const r of rocks) {
                        const rr = r.r + ship.r * 0.85;
                        if (dist2(ship.x, ship.y, r.x, r.y) <= rr * rr) {
                            spawnParticles(ship.x, ship.y, 70, 720, false);
                            running = false;
                            ctx.callbacks?.onGameOver?.({ score, reason: "Kollision!" });
                            return;
                        }
                    }
                }

                // passive score
                score += Math.floor(35 * dt);
                ctx.callbacks?.onScore?.(score);
            }

            // draw with screen shake
            c.clearRect(0, 0, W, H);
            drawBackground(t);

            const sx = (Math.random() * 2 - 1) * shake;
            const sy = (Math.random() * 2 - 1) * shake;
            shake *= Math.pow(0.02, dt);

            c.save();
            c.translate(sx, sy);

            drawRocks();
            drawBullets();
            drawShip();
            drawParticles(dt);
            drawStartOverlay();

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
                window.addEventListener("keyup", onKeyUp, { passive: false });
                canvas.addEventListener("pointerdown", onPointerDown);
                window.addEventListener("pointerup", onPointerUp);

                raf = requestAnimationFrame(loop);
            },

            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("keyup", onKeyUp);
                canvas.removeEventListener("pointerdown", onPointerDown);
                window.removeEventListener("pointerup", onPointerUp);
            },

            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
