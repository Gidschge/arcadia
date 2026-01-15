export const mini2048 = {
    id: "match3",
    name: "Mini-2048",
    controls: "WASD/←→↑↓ oder Swipe (Touch)",

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
        let lastTime = 0;

        const N = 4;
        const board = Array.from({ length: N }, () => Array(N).fill(0));

        // animation: tiles are drawn by board but we keep a tween list during a move
        let animating = false;
        let animT = 0;
        const animDur = 0.12;

        // move animation pieces: {fromR,fromC,toR,toC,v, mergeToV? , pop?}
        let animPieces = [];

        let score = 0;

        // particles
        const particles = [];
        function spawnParticles(x, y, n, power) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.25 + Math.random() * 0.45,
                    t: 0,
                    r: 2 + Math.random() * 3,
                });
            }
        }
        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        // layout
        const pad = 18;
        const size = Math.min(W, H) - pad * 2;
        const gridX = Math.floor((W - size) / 2);
        const gridY = Math.floor((H - size) / 2);
        const gap = Math.max(10, Math.floor(size * 0.03));
        const cell = Math.floor((size - gap * (N + 1)) / N);
        const boardW = gap * (N + 1) + cell * N;

        function cellPos(r, c0) {
            return {
                x: gridX + gap + c0 * (cell + gap),
                y: gridY + gap + r * (cell + gap),
            };
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

        function emptyCells() {
            const out = [];
            for (let r = 0; r < N; r++) for (let c0 = 0; c0 < N; c0++) if (!board[r][c0]) out.push([r, c0]);
            return out;
        }

        function spawnTile() {
            const e = emptyCells();
            if (!e.length) return false;
            const [r, c0] = e[Math.floor(Math.random() * e.length)];
            board[r][c0] = Math.random() < 0.9 ? 2 : 4;
            const p = cellPos(r, c0);
            spawnParticles(p.x + cell / 2, p.y + cell / 2, 10, 380);
            return true;
        }


        function canMove() {
            if (emptyCells().length) return true;
            for (let r = 0; r < N; r++) {
                for (let c0 = 0; c0 < N; c0++) {
                    const v = board[r][c0];
                    if (r + 1 < N && board[r + 1][c0] === v) return true;
                    if (c0 + 1 < N && board[r][c0 + 1] === v) return true;
                }
            }
            return false;
        }

        function reset() {
            for (let r = 0; r < N; r++) for (let c0 = 0; c0 < N; c0++) board[r][c0] = 0;
            animating = false;
            animPieces = [];
            score = 0;
            ctx.callbacks?.onScore?.(0);
            spawnTile();
            spawnTile();
        }

        // ---- Move Logic (no guessing, like real 2048) ----
        function applyMove(dir) {
            if (!running || animating) return;

            const before = board.map(row => row.slice());
            animPieces = [];
            let gained = 0;

            function getRC(line, i) {
                if (dir === "left") return [line, i];
                if (dir === "right") return [line, N - 1 - i];
                if (dir === "up") return [i, line];
                return [N - 1 - i, line]; // down
            }

            // Build new board
            const newBoard = Array.from({ length: N }, () => Array(N).fill(0));

            for (let line = 0; line < N; line++) {
                const vals = [];
                const froms = [];
                for (let i = 0; i < N; i++) {
                    const [r, c0] = getRC(line, i);
                    const v = before[r][c0];
                    if (v) {
                        vals.push(v);
                        froms.push([r, c0]);
                    }
                }

                let write = 0;
                let idx = 0;
                while (idx < vals.length) {
                    const v = vals[idx];
                    const from = froms[idx];

                    // merge
                    if (idx + 1 < vals.length && vals[idx + 1] === v) {
                        const merged = v * 2;
                        const [toR, toC] = getRC(line, write);
                        newBoard[toR][toC] = merged;
                        gained += merged;

                        animPieces.push({ fromR: from[0], fromC: from[1], toR, toC, v, mergeTo: merged, pop: 1 });
                        // second tile slides into same spot (visual)
                        const from2 = froms[idx + 1];
                        animPieces.push({ fromR: from2[0], fromC: from2[1], toR, toC, v, mergeTo: merged, pop: 0 });

                        idx += 2;
                        write += 1;
                    } else {
                        const [toR, toC] = getRC(line, write);
                        newBoard[toR][toC] = v;

                        animPieces.push({ fromR: from[0], fromC: from[1], toR, toC, v, mergeTo: v, pop: 0 });

                        idx += 1;
                        write += 1;
                    }
                }
            }

            // detect if anything changed
            let moved = false;
            for (let r = 0; r < N; r++) {
                for (let c0 = 0; c0 < N; c0++) {
                    if (newBoard[r][c0] !== before[r][c0]) { moved = true; break; }
                }
                if (moved) break;
            }
            if (!moved) return;

            // commit new board after animation ends
            board._next = newBoard;
            score += gained;
            ctx.callbacks?.onScore?.(score);

            // particles for merges
            if (gained > 0) {
                for (const p of animPieces) {
                    if (p.pop) {
                        const pos = cellPos(p.toR, p.toC);
                        spawnParticles(pos.x + cell / 2, pos.y + cell / 2, 14, 520);
                    }
                }
            }

            animating = true;
            animT = 0;
        }

        // ---- Input (always) ----
        function onKeyDown(e) {
            const k = e.code;
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(k)) e.preventDefault();

            if (k === "ArrowLeft" || k === "KeyA") applyMove("left");
            else if (k === "ArrowRight" || k === "KeyD") applyMove("right");
            else if (k === "ArrowUp" || k === "KeyW") applyMove("up");
            else if (k === "ArrowDown" || k === "KeyS") applyMove("down");
            else if (k === "Space") reset(); // quality of life: space = restart
        }

        let swipeStart = null;
        function onPointerDown(e) {
            swipeStart = { x: e.clientX, y: e.clientY };
        }
        function onPointerUp(e) {
            if (!swipeStart) return;
            const dx = e.clientX - swipeStart.x;
            const dy = e.clientY - swipeStart.y;
            swipeStart = null;

            if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;

            if (Math.abs(dx) > Math.abs(dy)) applyMove(dx > 0 ? "right" : "left");
            else applyMove(dy > 0 ? "down" : "up");
        }

        // ---- Drawing ----
        function tileColor(v) {
            if (v <= 4) return "rgba(140,180,255,0.22)";
            if (v <= 16) return "rgba(80,220,255,0.22)";
            if (v <= 64) return "rgba(120,255,200,0.22)";
            if (v <= 256) return "rgba(255,220,120,0.22)";
            return "rgba(255,120,180,0.22)";
        }

        function drawBoard() {
            c.save();
            c.shadowColor = "rgba(0,0,0,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(0,0,0,0.18)";
            roundedRect(gridX, gridY, boardW, boardW, 18);
            c.fill();
            c.restore();

            c.fillStyle = "rgba(255,255,255,0.04)";
            for (let r = 0; r < N; r++) {
                for (let c0 = 0; c0 < N; c0++) {
                    const p = cellPos(r, c0);
                    roundedRect(p.x, p.y, cell, cell, 14);
                    c.fill();
                }
            }
        }

        function drawTileAt(x, y, v, pop = 0) {
            const scale = 1 + pop * 0.10;
            const w = cell * scale;
            const h = cell * scale;
            const ox = x + (cell - w) / 2;
            const oy = y + (cell - h) / 2;

            c.save();
            c.shadowColor = "rgba(80,220,255,0.25)";
            c.shadowBlur = 16;

            c.fillStyle = tileColor(v);
            roundedRect(ox, oy, w, h, 16);
            c.fill();

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.08)";
            roundedRect(ox + 8, oy + 10, Math.max(10, w * 0.18), h - 20, 14);
            c.fill();

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = `900 ${Math.floor(18 + Math.log2(v) * 2)}px system-ui, Arial`;
            c.textAlign = "center";
            c.textBaseline = "middle";
            c.fillText(String(v), ox + w / 2, oy + h / 2);

            c.restore();
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
                c.fillStyle = `rgba(160,220,255,${0.28 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();

                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function drawStaticTiles() {
            for (let r = 0; r < N; r++) {
                for (let c0 = 0; c0 < N; c0++) {
                    const v = board[r][c0];
                    if (!v) continue;
                    const p = cellPos(r, c0);
                    drawTileAt(p.x, p.y, v, 0);
                }
            }
        }

        function drawAnimTiles(t01) {
            // draw from BEFORE positions to AFTER positions
            for (const p of animPieces) {
                const a = cellPos(p.fromR, p.fromC);
                const b = cellPos(p.toR, p.toC);
                const x = a.x + (b.x - a.x) * t01;
                const y = a.y + (b.y - a.y) * t01;
                const pop = p.pop ? (1 - t01) : 0;
                drawTileAt(x, y, p.v, pop);
            }
        }

        function loop(now) {
            if (!running) return;
            const dt = Math.min(0.033, (now - lastTime) / 1000);
            lastTime = now;

            // background
            c.clearRect(0, 0, W, H);
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.20)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            drawBoard();

            if (animating) {
                animT += dt / animDur;
                const t01 = clamp(animT, 0, 1);

                // draw board "before" by using anim pieces only
                drawAnimTiles(t01);

                if (t01 >= 1) {
                    animating = false;

                    // commit next board
                    for (let r = 0; r < N; r++) for (let c0 = 0; c0 < N; c0++) board[r][c0] = board._next[r][c0];
                    board._next = null;

                    const spawned = spawnTile();

                    // Game Over: Board voll UND keine Züge möglich
                    // (wenn spawned=false ist das Feld voll)
                    if (!spawned && !canMove()) {
                        running = false;
                        ctx.callbacks?.onGameOver?.({ score, reason: "Game Over – keine Züge mehr!" });
                        return;
                    }

                }
            } else {
                drawStaticTiles();
            }

            drawParticles(dt);

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
                window.addEventListener("pointerup", onPointerUp);

                raf = requestAnimationFrame(loop);
            },

            stop() {
                running = false;
                cancelAnimationFrame(raf);
                window.removeEventListener("keydown", onKeyDown);
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
