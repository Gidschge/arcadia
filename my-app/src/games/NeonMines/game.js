export const neonMines = {
    id: "mines",
    name: "Mines",
    controls: "Klick = Aufdecken • Rechtsklick/F = Flag • R = Restart",

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
        let started = false;
        let last = 0;

        // --- Board setup ---
        const COLS = 10;
        const ROWS = 10;
        const MINES = 14;

        // layout
        const pad = 18;
        const topUI = 54;

        const boardW = Math.min(W - pad * 2, H - pad * 2 - topUI);
        const cell = Math.floor(boardW / COLS);
        const gridW = cell * COLS;
        const gridH = cell * ROWS;

        const gx = Math.floor((W - gridW) / 2);
        const gy = Math.floor((H - gridH) / 2 + topUI * 0.35);

        // state
        let score = 0;
        let time = 0;
        let won = false;
        let lost = false;

        // each cell: mine, rev, flag, n
        let grid = [];
        const particles = [];

        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

        function idx(x, y) { return y * COLS + x; }
        function inb(x, y) { return x >= 0 && y >= 0 && x < COLS && y < ROWS; }

        function reset() {
            score = 0;
            time = 0;
            won = false;
            lost = false;
            started = false;

            grid = Array.from({ length: COLS * ROWS }, () => ({
                mine: false,
                rev: false,
                flag: false,
                n: 0,
                flash: 0, // small animation when revealed
            }));

            particles.length = 0;
            ctx.callbacks?.onScore?.(0);
        }

        function placeMines(safeX, safeY) {
            // place MINES mines, avoid safe cell + neighbors
            const forbidden = new Set();
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const xx = safeX + dx, yy = safeY + dy;
                    if (inb(xx, yy)) forbidden.add(idx(xx, yy));
                }
            }

            let placed = 0;
            while (placed < MINES) {
                const x = Math.floor(Math.random() * COLS);
                const y = Math.floor(Math.random() * ROWS);
                const k = idx(x, y);
                if (forbidden.has(k)) continue;
                if (grid[k].mine) continue;
                grid[k].mine = true;
                placed++;
            }

            // numbers
            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const k = idx(x, y);
                    if (grid[k].mine) continue;
                    let n = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (!dx && !dy) continue;
                            const xx = x + dx, yy = y + dy;
                            if (inb(xx, yy) && grid[idx(xx, yy)].mine) n++;
                        }
                    }
                    grid[k].n = n;
                }
            }
        }

        function spawnParticles(x, y, good = true, n = 28) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * 520,
                    vy: (Math.random() * 2 - 1) * 520,
                    t: 0,
                    life: 0.35 + Math.random() * 0.45,
                    r: 1.2 + Math.random() * 2.6,
                    good
                });
            }
        }

        function cellFromPointer(e) {
            const r = canvas.getBoundingClientRect();
            const px = (e.clientX - r.left);
            const py = (e.clientY - r.top);
            const x = Math.floor((px - gx) / cell);
            const y = Math.floor((py - gy) / cell);
            if (!inb(x, y)) return null;
            return { x, y };
        }

        function floodReveal(sx, sy) {
            const q = [{ x: sx, y: sy }];
            while (q.length) {
                const { x, y } = q.pop();
                const k = idx(x, y);
                const ce = grid[k];
                if (ce.rev || ce.flag) continue;
                ce.rev = true;
                ce.flash = 1;

                // scoring: empty less, numbers more
                score += (ce.n === 0 ? 10 : 80);
                ctx.callbacks?.onScore?.(score);

                if (ce.n !== 0) continue;

                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const xx = x + dx, yy = y + dy;
                        if (!inb(xx, yy)) continue;
                        const kk = idx(xx, yy);
                        if (!grid[kk].rev && !grid[kk].flag) q.push({ x: xx, y: yy });
                    }
                }
            }
        }

        function checkWin() {
            let safeRevealed = 0;
            for (const ce of grid) {
                if (!ce.mine && ce.rev) safeRevealed++;
            }
            const safeTotal = COLS * ROWS - MINES;
            if (safeRevealed >= safeTotal) {
                won = true;
                running = false;

                // bonus
                const timeBonus = Math.max(0, Math.floor(1200 - time * 80));
                score += 800 + timeBonus;
                ctx.callbacks?.onScore?.(score);

                ctx.callbacks?.onGameOver?.({ score, reason: "Gewonnen! ✅" });
            }
        }

        function revealMineHit(x, y) {
            lost = true;
            running = false;
            spawnParticles(gx + x * cell + cell / 2, gy + y * cell + cell / 2, false, 70);
            ctx.callbacks?.onGameOver?.({ score, reason: "Boom! 💥 Mine erwischt" });
        }

        function revealAllMines() {
            for (const ce of grid) {
                if (ce.mine) ce.rev = true;
            }
        }

        // --- Input ---
        function onPointerDown(e) {
            const pos = cellFromPointer(e);
            if (!pos || won || lost) return;

            // left click: 0, right click: 2
            const isRight = (e.button === 2);

            if (!started) {
                // start game on first reveal only
                if (!isRight) {
                    started = true;
                    placeMines(pos.x, pos.y);
                }
            }

            const k = idx(pos.x, pos.y);
            const ce = grid[k];

            if (isRight) {
                if (ce.rev) return;
                ce.flag = !ce.flag;
                spawnParticles(gx + pos.x * cell + cell / 2, gy + pos.y * cell + cell / 2, true, 10);
                return;
            }

            if (ce.flag || ce.rev) return;
            if (!started) return;

            // reveal
            if (ce.mine) {
                revealAllMines();
                revealMineHit(pos.x, pos.y);
                return;
            }

            floodReveal(pos.x, pos.y);
            checkWin();
        }

        function onKeyDown(e) {
            if (e.code === "KeyR") {
                e.preventDefault();
                reset();
                return;
            }

            // flag mode with keyboard: F toggles flag on hovered cell
            if (e.code === "KeyF") {
                e.preventDefault();
                if (!lastHover || won || lost) return;
                const { x, y } = lastHover;
                const ce = grid[idx(x, y)];
                if (ce.rev) return;
                ce.flag = !ce.flag;
            }
        }

        // prevent context menu on right click
        function onCtx(e) { e.preventDefault(); }

        // hover tracking for F flag
        let lastHover = null;
        function onMove(e) {
            const pos = cellFromPointer(e);
            lastHover = pos;
        }

        // --- Drawing ---
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

            // star dots
            const off = (t * 0.04) % 60;
            c.fillStyle = "rgba(255,255,255,0.05)";
            for (let y = 12; y < H; y += 60) {
                for (let x = 14; x < W; x += 90) {
                    c.beginPath();
                    c.arc(x + off, y, 1.6, 0, Math.PI * 2);
                    c.fill();
                }
            }
        }

        function drawTopUI() { }

        function drawGrid() {
            // panel
            c.save();
            c.shadowColor = "rgba(0,0,0,0.45)";
            c.shadowBlur = 28;
            c.fillStyle = "rgba(255,255,255,0.04)";
            roundedRect(gx - 14, gy - 14, gridW + 28, gridH + 28, 22);
            c.fill();
            c.restore();

            for (let y = 0; y < ROWS; y++) {
                for (let x = 0; x < COLS; x++) {
                    const ce = grid[idx(x, y)];
                    const x0 = gx + x * cell;
                    const y0 = gy + y * cell;

                    // cell base
                    c.save();
                    const isHover = lastHover && lastHover.x === x && lastHover.y === y && !won && !lost;
                    const glow = isHover ? 1 : 0;

                    if (!ce.rev) {
                        c.shadowColor = `rgba(120,180,255,${0.10 + glow * 0.22})`;
                        c.shadowBlur = 10 + glow * 18;
                        c.fillStyle = "rgba(255,255,255,0.05)";
                        roundedRect(x0 + 3, y0 + 3, cell - 6, cell - 6, 10);
                        c.fill();

                        // subtle stroke
                        c.shadowBlur = 0;
                        c.strokeStyle = "rgba(255,255,255,0.10)";
                        c.lineWidth = 1;
                        roundedRect(x0 + 3, y0 + 3, cell - 6, cell - 6, 10);
                        c.stroke();

                        // flag
                        if (ce.flag) {
                            c.shadowColor = "rgba(255,120,180,0.55)";
                            c.shadowBlur = 14;
                            c.fillStyle = "rgba(255,120,180,0.72)";
                            c.beginPath();
                            c.moveTo(x0 + cell * 0.46, y0 + cell * 0.26);
                            c.lineTo(x0 + cell * 0.46, y0 + cell * 0.72);
                            c.lineTo(x0 + cell * 0.42, y0 + cell * 0.72);
                            c.lineTo(x0 + cell * 0.42, y0 + cell * 0.26);
                            c.closePath();
                            c.fill();

                            c.fillStyle = "rgba(255,255,255,0.80)";
                            c.beginPath();
                            c.moveTo(x0 + cell * 0.46, y0 + cell * 0.28);
                            c.lineTo(x0 + cell * 0.68, y0 + cell * 0.36);
                            c.lineTo(x0 + cell * 0.46, y0 + cell * 0.44);
                            c.closePath();
                            c.fill();
                        }

                        c.restore();
                        continue;
                    }

                    // revealed cell
                    ce.flash = Math.max(0, ce.flash - 0.08);
                    const flashA = ce.flash;

                    c.shadowColor = "rgba(0,0,0,0.25)";
                    c.shadowBlur = 10;

                    c.fillStyle = `rgba(0,0,0,${0.22 - flashA * 0.10})`;
                    roundedRect(x0 + 3, y0 + 3, cell - 6, cell - 6, 10);
                    c.fill();

                    c.shadowBlur = 0;
                    c.strokeStyle = "rgba(255,255,255,0.08)";
                    c.lineWidth = 1;
                    roundedRect(x0 + 3, y0 + 3, cell - 6, cell - 6, 10);
                    c.stroke();

                    if (ce.mine) {
                        // mine
                        c.shadowColor = "rgba(255,120,120,0.65)";
                        c.shadowBlur = 18;
                        c.fillStyle = "rgba(255,120,120,0.55)";
                        c.beginPath();
                        c.arc(x0 + cell / 2, y0 + cell / 2, cell * 0.16, 0, Math.PI * 2);
                        c.fill();

                        c.shadowBlur = 0;
                        c.fillStyle = "rgba(255,255,255,0.55)";
                        c.beginPath();
                        c.arc(x0 + cell / 2 - 3, y0 + cell / 2 - 3, cell * 0.06, 0, Math.PI * 2);
                        c.fill();
                    } else if (ce.n > 0) {
                        // number
                        const colors = [
                            null,
                            "rgba(160,220,255,0.90)",
                            "rgba(120,255,190,0.88)",
                            "rgba(255,220,140,0.88)",
                            "rgba(255,140,200,0.88)",
                            "rgba(255,120,120,0.88)",
                            "rgba(200,160,255,0.90)",
                            "rgba(255,255,255,0.85)",
                            "rgba(255,255,255,0.85)",
                        ];
                        c.shadowColor = "rgba(160,220,255,0.35)";
                        c.shadowBlur = 10;
                        c.fillStyle = colors[ce.n] ?? "rgba(255,255,255,0.85)";
                        c.font = `900 ${Math.floor(cell * 0.42)}px system-ui, Arial`;
                        c.textAlign = "center";
                        c.textBaseline = "middle";
                        c.fillText(String(ce.n), x0 + cell / 2, y0 + cell / 2 + 1);
                    }
                    c.restore();
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
                c.fillStyle = p.good ? `rgba(160,220,255,${0.30 * a})` : `rgba(255,120,120,${0.34 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();
                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function drawStartOverlay() {
            if (started) return;
            c.save();
            c.fillStyle = "rgba(0,0,0,0.30)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "900 22px system-ui, Arial";
            c.fillText("Mines", 28, 46);

            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "600 16px system-ui, Arial";
            c.fillText("Klick zum Starten (erste Fläche ist immer sicher).", 28, 78);
            c.fillText("Rechtsklick oder F = Flag • R = Restart", 28, 102);

            c.restore();
        }

        function step(dt) {
            if (!started || won || lost) return;
            time += dt;
        }

        function draw(t, dt) {
            c.clearRect(0, 0, W, H);
            drawBackground(t);
            drawTopUI();
            drawGrid();
            drawParticles(dt);
            drawStartOverlay();
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
                reset();
                last = performance.now();

                window.addEventListener("keydown", onKeyDown, { passive: false });
                canvas.addEventListener("pointermove", onMove);
                canvas.addEventListener("pointerdown", onPointerDown);
                canvas.addEventListener("contextmenu", onCtx);

                raf = requestAnimationFrame(loop);
            },
            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
                canvas.removeEventListener("pointermove", onMove);
                canvas.removeEventListener("pointerdown", onPointerDown);
                canvas.removeEventListener("contextmenu", onCtx);
            },
            destroy() {
                this.stop();
                canvas.remove();
            },
        };
    },
};
