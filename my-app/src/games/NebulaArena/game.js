export const nebula = {
    id: "nebula",
    name: "Nebula Arena",
    controls: "WASD/Arrow • Shift = Dash • Space = Super",

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

        const STATE = { READY: "READY", PLAY: "PLAY", OVER: "OVER" };
        let state = STATE.READY;

        // --- Score / Meta ---
        let score = 0;
        let time = 0;
        let wave = 1;
        let streak = 0;
        let bestStreak = 0;

        // Energy (Super)
        let energy = 0; // 0..1
        let superActive = false;
        let superT = 0;

        // Danger slow-mo
        let slowMo = 0; // 0..1

        // --- Player ---
        const player = {
            x: W / 2,
            y: H / 2,
            vx: 0,
            vy: 0,
            r: 12,
            hp: 3,
            inv: 0,
            dashCd: 0,
            dashT: 0,
            dashDirX: 0,
            dashDirY: 0,
            trail: [],
            pulse: 0,
        };

        // --- Entities ---
        const orbs = [];
        const enemies = [];
        const bullets = [];
        const particles = [];
        const rings = []; // shockwaves / FX

        // --- Helpers ---
        const keys = new Set();
        let pointer = null;

        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const lerp = (a, b, t) => a + (b - a) * t;
        const rand = (a, b) => a + Math.random() * (b - a);

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

        function dist(ax, ay, bx, by) {
            return Math.hypot(ax - bx, ay - by);
        }

        function spawnParticles(x, y, good = true, n = 18) {
            for (let i = 0; i < n; i++) {
                const a = Math.random() * Math.PI * 2;
                const sp = rand(60, 260);
                particles.push({
                    x,
                    y,
                    vx: Math.cos(a) * sp,
                    vy: Math.sin(a) * sp,
                    t: 0,
                    life: rand(0.35, 0.75),
                    good,
                });
            }
        }

        function addRing(x, y, max = 160, life = 0.55, good = true) {
            rings.push({ x, y, r: 0, max, t: 0, life, good });
        }

        function spawnOrb() {
            // spawn away from player
            for (let tries = 0; tries < 20; tries++) {
                const x = rand(60, W - 60);
                const y = rand(86, H - 60);
                if (dist(x, y, player.x, player.y) > 160) {
                    orbs.push({ x, y, r: 7, t: 0 });
                    return;
                }
            }
            orbs.push({ x: rand(60, W - 60), y: rand(86, H - 60), r: 7, t: 0 });
        }

        function spawnEnemy(kind = "chaser") {
            // spawn from edges
            const side = Math.floor(Math.random() * 4);
            let x = 0, y = 0;
            if (side === 0) { x = -30; y = rand(90, H - 30); }
            if (side === 1) { x = W + 30; y = rand(90, H - 30); }
            if (side === 2) { x = rand(30, W - 30); y = -30; }
            if (side === 3) { x = rand(30, W - 30); y = H + 30; }

            const base = {
                x, y,
                vx: 0, vy: 0,
                r: kind === "tank" ? 18 : 14,
                hp: kind === "tank" ? 3 : 1,
                kind,
                t: 0,
                shootCd: rand(0.8, 1.6),
                ang: rand(0, Math.PI * 2),
            };

            enemies.push(base);
        }

        function shootFromEnemy(e) {
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const d = Math.max(0.001, Math.hypot(dx, dy));
            const sp = 240 + wave * 8;
            bullets.push({
                x: e.x,
                y: e.y,
                vx: (dx / d) * sp,
                vy: (dy / d) * sp,
                r: 4,
                t: 0,
                life: 3.0,
            });
        }

        function startGame() {
            state = STATE.PLAY;

            score = 0;
            time = 0;
            wave = 1;
            streak = 0;
            bestStreak = 0;

            energy = 0;
            superActive = false;
            superT = 0;
            slowMo = 0;

            player.x = W / 2;
            player.y = H / 2;
            player.vx = 0;
            player.vy = 0;
            player.hp = 3;
            player.inv = 1.0;
            player.dashCd = 0;
            player.dashT = 0;
            player.trail.length = 0;

            orbs.length = 0;
            enemies.length = 0;
            bullets.length = 0;
            particles.length = 0;
            rings.length = 0;

            ctx.callbacks?.onScore?.(0);

            for (let i = 0; i < 6; i++) spawnOrb();
            for (let i = 0; i < 2; i++) spawnEnemy("chaser");
        }

        function endGame(reason) {
            state = STATE.OVER;
            ctx.callbacks?.onGameOver?.({ score, reason });
            running = false;
        }

        // --- Input ---
        function onKeyDown(e) {
            const k = e.code;
            if (k === "ArrowUp" || k === "KeyW") keys.add("U");
            if (k === "ArrowDown" || k === "KeyS") keys.add("D");
            if (k === "ArrowLeft" || k === "KeyA") keys.add("L");
            if (k === "ArrowRight" || k === "KeyD") keys.add("R");
            if (k === "ShiftLeft" || k === "ShiftRight") keys.add("SHIFT");

            if (k === "Space") {
                e.preventDefault();
                if (state === STATE.READY) startGame();
                else if (state === STATE.OVER) startGame();
                else if (state === STATE.PLAY) {
                    if (energy >= 1 && !superActive) {
                        superActive = true;
                        superT = 0;
                        energy = 0;
                        addRing(player.x, player.y, 220, 0.55, true);
                        spawnParticles(player.x, player.y, true, 40);
                    }
                }
            }
        }
        function onKeyUp(e) {
            const k = e.code;
            if (k === "ArrowUp" || k === "KeyW") keys.delete("U");
            if (k === "ArrowDown" || k === "KeyS") keys.delete("D");
            if (k === "ArrowLeft" || k === "KeyA") keys.delete("L");
            if (k === "ArrowRight" || k === "KeyD") keys.delete("R");
            if (k === "ShiftLeft" || k === "ShiftRight") keys.delete("SHIFT");
        }

        function onPointerMove(e) {
            const r = canvas.getBoundingClientRect();
            pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
        }
        function onPointerDown() {
            if (state === STATE.READY || state === STATE.OVER) startGame();
            else if (state === STATE.PLAY && energy >= 1 && !superActive) {
                superActive = true;
                superT = 0;
                energy = 0;
                addRing(player.x, player.y, 220, 0.55, true);
                spawnParticles(player.x, player.y, true, 40);
            }
        }

        // --- Core update ---
        let spawnTimer = 0;

        function update(dtRaw) {
            if (state !== STATE.PLAY) return;

            // slow-mo when danger close (near bullet/enemy)
            let danger = 0;
            for (const e of enemies) {
                const d = dist(e.x, e.y, player.x, player.y);
                if (d < 120) danger = Math.max(danger, 1 - d / 120);
            }
            for (const b of bullets) {
                const d = dist(b.x, b.y, player.x, player.y);
                if (d < 100) danger = Math.max(danger, 1 - d / 100);
            }
            slowMo = lerp(slowMo, clamp(danger, 0, 1), Math.min(1, dtRaw * 8));
            const dt = dtRaw * (1 - slowMo * 0.35); // subtle cinematic

            time += dt;

            // wave scaling
            if (time > wave * 14) {
                wave++;
                // Add enemies and a "boss-wave" tank every 3 waves
                spawnEnemy("chaser");
                spawnEnemy("shooter");
                if (wave % 3 === 0) spawnEnemy("tank");
                addRing(player.x, player.y, 260, 0.65, true);
            }

            // Player invulnerability
            player.inv = Math.max(0, player.inv - dt);
            player.dashCd = Math.max(0, player.dashCd - dt);

            // Dash
            const wantDash = keys.has("SHIFT") && player.dashCd <= 0 && player.dashT <= 0;
            if (wantDash) {
                let dx = 0, dy = 0;
                if (keys.has("L")) dx -= 1;
                if (keys.has("R")) dx += 1;
                if (keys.has("U")) dy -= 1;
                if (keys.has("D")) dy += 1;

                if (dx === 0 && dy === 0 && pointer) {
                    dx = pointer.x - player.x;
                    dy = pointer.y - player.y;
                }
                const d = Math.max(0.001, Math.hypot(dx, dy));
                player.dashDirX = dx / d;
                player.dashDirY = dy / d;
                player.dashT = 0.13;
                player.dashCd = 0.75;
                spawnParticles(player.x, player.y, true, 18);
            }

            // Move input
            let ix = 0, iy = 0;
            if (keys.has("L")) ix -= 1;
            if (keys.has("R")) ix += 1;
            if (keys.has("U")) iy -= 1;
            if (keys.has("D")) iy += 1;
            const im = Math.hypot(ix, iy);
            if (im > 0) { ix /= im; iy /= im; }

            const accel = 920;
            const maxSpeed = 360;
            const friction = 7.5;

            player.vx += ix * accel * dt;
            player.vy += iy * accel * dt;

            // dash overrides velocity briefly
            if (player.dashT > 0) {
                player.dashT -= dt;
                player.vx = player.dashDirX * 780;
                player.vy = player.dashDirY * 780;
            }

            // friction
            player.vx *= Math.exp(-friction * dt);
            player.vy *= Math.exp(-friction * dt);

            // clamp speed
            const sp = Math.hypot(player.vx, player.vy);
            if (sp > maxSpeed && player.dashT <= 0) {
                player.vx = (player.vx / sp) * maxSpeed;
                player.vy = (player.vy / sp) * maxSpeed;
            }

            player.x += player.vx * dt;
            player.y += player.vy * dt;

            // bounds
            player.x = clamp(player.x, 24, W - 24);
            player.y = clamp(player.y, 86, H - 24);

            // trail
            player.trail.push({ x: player.x, y: player.y, t: 0 });
            if (player.trail.length > 80) player.trail.shift();

            // Orbs
            for (let i = orbs.length - 1; i >= 0; i--) {
                const o = orbs[i];
                o.t += dt;

                if (dist(o.x, o.y, player.x, player.y) < player.r + o.r + 4) {
                    orbs.splice(i, 1);

                    streak += 1;
                    bestStreak = Math.max(bestStreak, streak);

                    const add = 120 + streak * 18;
                    score += add;
                    ctx.callbacks?.onScore?.(score);

                    energy = clamp(energy + 0.18, 0, 1);

                    spawnParticles(o.x, o.y, true, 18);
                    addRing(o.x, o.y, 90, 0.45, true);

                    // keep orbs flowing
                    spawnOrb();
                    spawnOrb();
                }
            }

            // Enemies AI + collisions
            for (const e of enemies) {
                e.t += dt;

                // behaviors
                if (e.kind === "chaser") {
                    const dx = player.x - e.x, dy = player.y - e.y;
                    const d = Math.max(0.001, Math.hypot(dx, dy));
                    const spd = 95 + wave * 6;
                    e.vx = lerp(e.vx, (dx / d) * spd, Math.min(1, dt * 4));
                    e.vy = lerp(e.vy, (dy / d) * spd, Math.min(1, dt * 4));
                } else if (e.kind === "shooter") {
                    // orbit + shoot
                    const dx = player.x - e.x, dy = player.y - e.y;
                    const d = Math.max(0.001, Math.hypot(dx, dy));
                    const spd = 70 + wave * 4;
                    // tangent orbit
                    const tx = -dy / d, ty = dx / d;
                    const pull = clamp((d - 190) / 190, -1, 1);
                    e.vx = lerp(e.vx, tx * spd + (dx / d) * pull * 55, Math.min(1, dt * 3));
                    e.vy = lerp(e.vy, ty * spd + (dy / d) * pull * 55, Math.min(1, dt * 3));

                    e.shootCd -= dt;
                    if (e.shootCd <= 0) {
                        e.shootCd = rand(0.9, 1.4) * (1 - Math.min(0.35, wave * 0.02));
                        shootFromEnemy(e);
                    }
                } else if (e.kind === "tank") {
                    // slow but heavy
                    const dx = player.x - e.x, dy = player.y - e.y;
                    const d = Math.max(0.001, Math.hypot(dx, dy));
                    const spd = 55 + wave * 3;
                    e.vx = lerp(e.vx, (dx / d) * spd, Math.min(1, dt * 2));
                    e.vy = lerp(e.vy, (dy / d) * spd, Math.min(1, dt * 2));

                    e.shootCd -= dt;
                    if (e.shootCd <= 0) {
                        e.shootCd = rand(1.2, 1.8);
                        // burst
                        for (let k = 0; k < 3; k++) shootFromEnemy(e);
                    }
                }

                e.x += e.vx * dt;
                e.y += e.vy * dt;

                // collide with player
                if (dist(e.x, e.y, player.x, player.y) < e.r + player.r) {
                    if (player.inv <= 0) {
                        player.hp -= 1;
                        player.inv = 1.0;
                        streak = 0;
                        energy = Math.max(0, energy - 0.35);
                        spawnParticles(player.x, player.y, false, 32);
                        addRing(player.x, player.y, 140, 0.55, false);

                        if (player.hp <= 0) {
                            endGame(`Core destroyed • Wave ${wave} • Best Streak x${bestStreak}`);
                            return;
                        }
                    }
                }
            }

            // Bullets
            for (let i = bullets.length - 1; i >= 0; i--) {
                const b = bullets[i];
                b.t += dt;
                b.x += b.vx * dt;
                b.y += b.vy * dt;

                // bounds / life
                if (b.t > b.life || b.x < -60 || b.x > W + 60 || b.y < -60 || b.y > H + 60) {
                    bullets.splice(i, 1);
                    continue;
                }

                if (dist(b.x, b.y, player.x, player.y) < b.r + player.r) {
                    if (player.inv <= 0) {
                        bullets.splice(i, 1);
                        player.hp -= 1;
                        player.inv = 1.0;
                        streak = 0;
                        energy = Math.max(0, energy - 0.25);
                        spawnParticles(player.x, player.y, false, 28);
                        addRing(player.x, player.y, 140, 0.55, false);

                        if (player.hp <= 0) {
                            endGame(`Core destroyed • Wave ${wave} • Best Streak x${bestStreak}`);
                            return;
                        }
                    } else {
                        bullets.splice(i, 1);
                    }
                }
            }

            // Super
            if (superActive) {
                superT += dt;
                // kill enemies in radius
                const R = 160 + superT * 220;
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const e = enemies[i];
                    const d = dist(e.x, e.y, player.x, player.y);
                    if (d < R) {
                        e.hp -= 1;
                        spawnParticles(e.x, e.y, true, 14);

                        if (e.hp <= 0) {
                            enemies.splice(i, 1);
                            streak += 1;
                            bestStreak = Math.max(bestStreak, streak);
                            const add = 180 + streak * 24 + wave * 6;
                            score += add;
                            ctx.callbacks?.onScore?.(score);
                            addRing(e.x, e.y, 120, 0.55, true);
                        }
                    }
                }
                if (superT > 0.55) superActive = false;
            }

            // spawn pacing
            spawnTimer -= dt;
            if (spawnTimer <= 0) {
                spawnTimer = Math.max(0.35, 1.25 - wave * 0.06);
                // chance enemy types
                const r = Math.random();
                if (r < 0.58) spawnEnemy("chaser");
                else spawnEnemy("shooter");
            }

            // FX updates
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.t += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.98;
                p.vy *= 0.98;
                if (p.t >= p.life) particles.splice(i, 1);
            }

            for (let i = rings.length - 1; i >= 0; i--) {
                const r = rings[i];
                r.t += dt;
                r.r = r.max * Math.sin(Math.min(1, r.t / r.life) * (Math.PI / 2));
                if (r.t >= r.life) rings.splice(i, 1);
            }

            // energy passive (small reward for survival)
            energy = clamp(energy + dt * 0.015, 0, 1);
        }

        // --- Draw ---
        function drawBG() {
            // soft vignette
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.25)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // starfield
            c.save();
            c.fillStyle = "rgba(255,255,255,0.035)";
            for (let i = 0; i < 110; i++) {
                const x = (i * 97) % W;
                const y = ((i * 53) + (time * 18)) % H;
                c.fillRect(x, y, 1, 1);
            }
            c.restore();
        }

        function drawInfo() {
            c.save();
            c.fillStyle = "rgba(0,0,0,0.18)";
            roundedRect(16, 14, Math.min(820, W - 32), 52, 16);
            c.fill();

            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 16;
            c.fillStyle = "rgba(255,255,255,0.95)";
            c.font = "900 16px system-ui, Arial";
            c.fillText("Nebula Arena", 32, 36);

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "700 13px system-ui, Arial";
            const hpTxt = "♥".repeat(player.hp) + "·".repeat(Math.max(0, 3 - player.hp));
            const ePct = Math.floor(energy * 100);
            c.fillText(`Wave: ${wave} • Streak: x${Math.floor(streak)} (Best x${bestStreak}) • HP: ${hpTxt}`, 32, 56);

            // energy bar
            const bx = Math.min(W - 270, 560);
            const by = 28;
            const bw = 180;
            const bh = 10;

            c.fillStyle = "rgba(255,255,255,0.10)";
            roundedRect(bx, by, bw, bh, 99);
            c.fill();

            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 16;
            c.fillStyle = "rgba(160,220,255,0.25)";
            roundedRect(bx, by, bw * energy, bh, 99);
            c.fill();

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.72)";
            c.font = "800 12px system-ui, Arial";
            c.fillText(`SUPER ${ePct}% (SPACE)`, bx, by - 6);

            // dash ready indicator
            const dx = bx + bw + 22;
            const dy = by + 5;
            const ready = player.dashCd <= 0;
            c.shadowColor = ready ? "rgba(120,255,190,0.55)" : "rgba(255,255,255,0.20)";
            c.shadowBlur = 18;
            c.fillStyle = ready ? "rgba(120,255,190,0.22)" : "rgba(255,255,255,0.10)";
            c.beginPath(); c.arc(dx, dy, 7, 0, Math.PI * 2); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.70)";
            c.font = "700 11px system-ui, Arial";
            c.fillText("DASH", dx + 14, dy + 4);

            c.restore();
        }

        function drawEntities(dt) {
            // rings
            for (const r of rings) {
                const a = Math.max(0, 1 - r.t / r.life);
                c.save();
                c.shadowColor = r.good ? "rgba(160,220,255,0.55)" : "rgba(255,120,120,0.55)";
                c.shadowBlur = 22;
                c.strokeStyle = r.good ? `rgba(160,220,255,${0.22 * a})` : `rgba(255,120,120,${0.24 * a})`;
                c.lineWidth = 4;
                c.beginPath();
                c.arc(r.x, r.y, r.r, 0, Math.PI * 2);
                c.stroke();
                c.restore();
            }

            // orbs
            for (const o of orbs) {
                const glow = 0.5 + 0.5 * Math.sin(o.t * 6);
                c.save();
                c.shadowColor = "rgba(160,220,255,0.65)";
                c.shadowBlur = 22;
                c.fillStyle = `rgba(160,220,255,${0.18 + glow * 0.08})`;
                c.beginPath();
                c.arc(o.x, o.y, 10, 0, Math.PI * 2);
                c.fill();
                c.fillStyle = "rgba(255,255,255,0.75)";
                c.beginPath();
                c.arc(o.x, o.y, 3.2, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }

            // bullets
            for (const b of bullets) {
                c.save();
                c.shadowColor = "rgba(255,120,120,0.60)";
                c.shadowBlur = 18;
                c.fillStyle = "rgba(255,120,120,0.65)";
                c.beginPath();
                c.arc(b.x, b.y, b.r + 1.2, 0, Math.PI * 2);
                c.fill();
                c.restore();
            }

            // enemies
            for (const e of enemies) {
                c.save();
                const isTank = e.kind === "tank";
                const col = e.kind === "shooter" ? "rgba(255,220,140," : "rgba(255,120,120,";
                c.shadowColor = e.kind === "shooter" ? "rgba(255,220,140,0.60)" : "rgba(255,120,120,0.60)";
                c.shadowBlur = 22;

                c.fillStyle = `${col}${isTank ? 0.18 : 0.16})`;
                c.beginPath();
                c.arc(e.x, e.y, e.r + (isTank ? 2 : 0), 0, Math.PI * 2);
                c.fill();

                c.shadowBlur = 0;
                c.strokeStyle = "rgba(255,255,255,0.10)";
                c.lineWidth = 2;
                c.beginPath();
                c.arc(e.x, e.y, e.r, 0, Math.PI * 2);
                c.stroke();

                // hp ticks for tanks
                if (isTank) {
                    c.fillStyle = "rgba(255,255,255,0.65)";
                    c.font = "800 12px system-ui, Arial";
                    c.textAlign = "center";
                    c.fillText(`${e.hp}`, e.x, e.y + 4);
                }
                c.restore();
            }

            // player trail
            for (let i = player.trail.length - 1; i >= 0; i--) {
                const t = player.trail[i];
                t.t += dt;
                const a = Math.max(0, 1 - t.t / 0.55);
                if (a <= 0) { player.trail.splice(i, 1); continue; }
                c.fillStyle = `rgba(160,220,255,${0.12 * a})`;
                c.beginPath();
                c.arc(t.x, t.y, 3.4, 0, Math.PI * 2);
                c.fill();
            }

            // player
            c.save();
            const invA = player.inv > 0 ? 0.55 + 0.45 * Math.sin(time * 18) : 1;
            c.shadowColor = "rgba(160,220,255,0.70)";
            c.shadowBlur = 28;

            c.fillStyle = `rgba(160,220,255,${0.18 * invA})`;
            c.beginPath();
            c.arc(player.x, player.y, player.r + 6, 0, Math.PI * 2);
            c.fill();

            c.shadowBlur = 0;
            c.fillStyle = `rgba(255,255,255,${0.88 * invA})`;
            c.beginPath();
            c.arc(player.x, player.y, player.r, 0, Math.PI * 2);
            c.fill();

            // core dot
            c.fillStyle = "rgba(0,0,0,0.18)";
            c.beginPath();
            c.arc(player.x, player.y, 3.2, 0, Math.PI * 2);
            c.fill();

            // super aura
            if (superActive) {
                c.shadowColor = "rgba(120,255,190,0.65)";
                c.shadowBlur = 28;
                c.strokeStyle = "rgba(120,255,190,0.28)";
                c.lineWidth = 3;
                c.beginPath();
                c.arc(player.x, player.y, 44 + superT * 60, 0, Math.PI * 2);
                c.stroke();
            }

            c.restore();

            // particles
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = p.good ? `rgba(160,220,255,${0.30 * a})` : `rgba(255,120,120,${0.32 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
                c.fill();
            }
        }

        function drawOverlay() {
            if (state === STATE.PLAY) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.30)";
            c.fillRect(0, 0, W, H);

            const bw = Math.min(560, W - 60);
            const bh = state === STATE.READY ? 220 : 250;
            const bx = Math.floor(W / 2 - bw / 2);
            const by = Math.floor(H / 2 - bh / 2);

            c.shadowColor = "rgba(0,0,0,0.70)";
            c.shadowBlur = 26;
            c.fillStyle = "rgba(0,0,0,0.24)";
            roundedRect(bx, by, bw, bh, 22);
            c.fill();

            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(255,255,255,0.96)";
            c.textAlign = "center";

            c.font = "900 28px system-ui, Arial";
            c.fillText(state === STATE.READY ? "Nebula Arena PRO" : "Game Over", bx + bw / 2, by + 56);

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "700 14px system-ui, Arial";
            c.fillText(
                state === STATE.READY
                    ? "Sammle Orbs für Score & Super. Weiche Gegnern aus."
                    : `Wave ${wave} • Best Streak x${bestStreak}`,
                bx + bw / 2,
                by + 86
            );

            if (state === STATE.READY) {
                c.fillStyle = "rgba(255,255,255,0.70)";
                c.font = "700 13px system-ui, Arial";
                c.fillText("WASD/Pfeile = Move • Shift = Dash • Space = Super", bx + bw / 2, by + 122);

                c.fillStyle = "rgba(255,255,255,0.62)";
                c.font = "700 13px system-ui, Arial";
                c.fillText("SPACE oder Klick zum Starten", bx + bw / 2, by + 176);
            } else {
                c.fillStyle = "rgba(255,255,255,0.88)";
                c.font = "900 20px system-ui, Arial";
                c.fillText(`Score: ${score}`, bx + bw / 2, by + 134);

                c.fillStyle = "rgba(255,255,255,0.68)";
                c.font = "700 13px system-ui, Arial";
                c.fillText("SPACE oder Klick = Nochmal", bx + bw / 2, by + 188);

                c.fillStyle = "rgba(255,255,255,0.56)";
                c.font = "700 13px system-ui, Arial";
                c.fillText("Tipp: Super (SPACE) löscht Gegner in deiner Nähe", bx + bw / 2, by + 214);
            }

            c.restore();
        }

        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - last) / 1000);
            last = t;

            // Update only when playing
            update(dt);

            // Draw
            c.clearRect(0, 0, W, H);
            drawBG();
            drawInfo();
            drawEntities(dt);
            drawOverlay();

            raf = requestAnimationFrame(loop);
        }

        return {
            start() {
                if (running) return;
                running = true;
                last = performance.now();

                window.addEventListener("keydown", onKeyDown, { passive: false });
                window.addEventListener("keyup", onKeyUp);
                canvas.addEventListener("pointermove", onPointerMove);
                canvas.addEventListener("pointerdown", onPointerDown);

                raf = requestAnimationFrame(loop);
            },
            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                window.removeEventListener("keyup", onKeyUp);
                canvas.removeEventListener("pointermove", onPointerMove);
                canvas.removeEventListener("pointerdown", onPointerDown);
            },
            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
