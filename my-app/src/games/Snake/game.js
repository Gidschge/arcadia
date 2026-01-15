// src/games/Snake/game.js
export const snake = {
    id: "snake",
    name: "Snake",
    controls: "WASD/Arrows • SPACE = Pause • R = Restart",

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
        let paused = false;
        let last = 0;

        // ===== Grid sizing (responsive) =====
        const cell = Math.max(18, Math.min(28, Math.floor(Math.min(W, H) / 22)));
        const cols = Math.floor((W - 40) / cell);
        const rows = Math.floor((H - 110) / cell);
        const gridW = cols * cell;
        const gridH = rows * cell;
        const gridX = Math.floor((W - gridW) / 2);
        const gridY = 78;

        const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
        const rnd = (a, b) => a + Math.random() * (b - a);

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

        // ===== Game state =====
        let score = 0;
        let best = 0;
        let stepTimer = 0;
        let baseStep = 0.12; // seconds per move (will speed up)
        let step = baseStep;

        let dir = { x: 1, y: 0 };
        let nextDir = { x: 1, y: 0 };

        /** segments: head at index 0 */
        let snakeBody = [];
        let grow = 0;

        let food = { x: 10, y: 8, pulse: 0 };
        let danger = false; // hit moment flash

        // particles
        const particles = [];
        function spawnParticles(x, y, n = 18) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: rnd(-1, 1) * rnd(90, 260),
                    vy: rnd(-1, 1) * rnd(90, 260),
                    t: 0,
                    life: rnd(0.25, 0.55),
                    r: rnd(1.6, 3.4),
                });
            }
        }

        function gridToPx(gx, gy) {
            return {
                x: gridX + gx * cell,
                y: gridY + gy * cell,
            };
        }

        function randFreeCell() {
            // try a few random picks, then fallback scan
            for (let tries = 0; tries < 120; tries++) {
                const x = Math.floor(Math.random() * cols);
                const y = Math.floor(Math.random() * rows);
                if (!snakeBody.some(s => s.x === x && s.y === y)) return { x, y };
            }
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    if (!snakeBody.some(s => s.x === x && s.y === y)) return { x, y };
                }
            }
            return { x: 0, y: 0 };
        }

        function reset() {
            started = false;
            paused = false;
            danger = false;

            score = 0;
            stepTimer = 0;
            step = baseStep;

            dir = { x: 1, y: 0 };
            nextDir = { x: 1, y: 0 };

            const sx = Math.floor(cols / 2);
            const sy = Math.floor(rows / 2);

            snakeBody = [
                { x: sx, y: sy },
                { x: sx - 1, y: sy },
                { x: sx - 2, y: sy },
            ];
            grow = 0;

            food = { ...randFreeCell(), pulse: 0 };
            particles.length = 0;

            ctx.callbacks?.onScore?.(0);
        }

        function gameOver(reason = "Game Over") {
            running = false;
            ctx.callbacks?.onGameOver?.({ score, reason });
        }

        function tryTurn(nx, ny) {
            // prevent reversing
            if (nx === -dir.x && ny === -dir.y) return;
            nextDir = { x: nx, y: ny };
        }

        // ===== Input =====
        function onKeyDown(e) {
            const k = e.code;

            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(k)) e.preventDefault();

            if (k === "Space") {
                if (!started) { started = true; return; }
                paused = !paused;
                return;
            }
            if (k === "KeyR") {
                reset();
                started = true;
                return;
            }

            if (!started) started = true;

            if (k === "ArrowLeft" || k === "KeyA") tryTurn(-1, 0);
            if (k === "ArrowRight" || k === "KeyD") tryTurn(1, 0);
            if (k === "ArrowUp" || k === "KeyW") tryTurn(0, -1);
            if (k === "ArrowDown" || k === "KeyS") tryTurn(0, 1);
        }

        // optional swipe-ish on pointer: drag to set direction
        let lastPointer = null;
        function onPointerDown(e) {
            const r = canvas.getBoundingClientRect();
            lastPointer = { x: e.clientX - r.left, y: e.clientY - r.top };
            if (!started) started = true;
        }
        function onPointerMove(e) {
            if (!lastPointer) return;
            const r = canvas.getBoundingClientRect();
            const x = e.clientX - r.left;
            const y = e.clientY - r.top;
            const dx = x - lastPointer.x;
            const dy = y - lastPointer.y;
            if (Math.abs(dx) + Math.abs(dy) < 18) return;

            if (Math.abs(dx) > Math.abs(dy)) tryTurn(dx > 0 ? 1 : -1, 0);
            else tryTurn(0, dy > 0 ? 1 : -1);

            lastPointer = { x, y };
        }
        function onPointerUp() {
            lastPointer = null;
        }

        // ===== Step logic =====
        function stepOnce() {
            dir = nextDir;

            const head = snakeBody[0];
            let nx = head.x + dir.x;
            let ny = head.y + dir.y;

            // wrap around edges (feels more arcade)
            if (nx < 0) nx = cols - 1;
            if (nx >= cols) nx = 0;
            if (ny < 0) ny = rows - 1;
            if (ny >= rows) ny = 0;

            // collision with self
            if (snakeBody.some((s, i) => i !== snakeBody.length - 1 && s.x === nx && s.y === ny)) {
                danger = true;
                const p = gridToPx(nx, ny);
                spawnParticles(p.x + cell / 2, p.y + cell / 2, 38);
                gameOver("Kollision!");
                return;
            }

            // add new head
            snakeBody.unshift({ x: nx, y: ny });

            // eat?
            if (nx === food.x && ny === food.y) {
                score += 120;
                ctx.callbacks?.onScore?.(score);
                best = Math.max(best, score);

                grow += 2;
                const p = gridToPx(nx, ny);
                spawnParticles(p.x + cell / 2, p.y + cell / 2, 26);

                // speed up slightly, but clamp
                step = Math.max(0.06, baseStep - snakeBody.length * 0.002);

                food = { ...randFreeCell(), pulse: 0 };
            }

            // tail handling
            if (grow > 0) {
                grow--;
            } else {
                snakeBody.pop();
            }
        }

        // ===== Drawing =====
        function drawBackground(t) {
            // subtle gradient
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // faint star grid dots
            const off = (t * 0.06) % 36;
            c.fillStyle = "rgba(255,255,255,0.045)";
            for (let y = gridY - 10; y < gridY + gridH + 10; y += 36) {
                for (let x = gridX - 10; x < gridX + gridW + 10; x += 56) {
                    c.fillRect(x + off * 0.3, y, 2, 2);
                }
            }
        }

        function drawFrame() {
            // glass frame
            c.save();
            c.shadowColor = "rgba(0,0,0,0.45)";
            c.shadowBlur = 28;
            c.fillStyle = "rgba(255,255,255,0.05)";
            c.strokeStyle = "rgba(255,255,255,0.10)";
            c.lineWidth = 2;
            roundedRect(gridX - 14, gridY - 14, gridW + 28, gridH + 28, 22);
            c.fill();
            c.stroke();
            c.restore();

            // inner grid
            c.save();
            c.strokeStyle = "rgba(255,255,255,0.06)";
            c.lineWidth = 1;
            for (let i = 0; i <= cols; i++) {
                const x = gridX + i * cell;
                c.beginPath();
                c.moveTo(x, gridY);
                c.lineTo(x, gridY + gridH);
                c.stroke();
            }
            for (let i = 0; i <= rows; i++) {
                const y = gridY + i * cell;
                c.beginPath();
                c.moveTo(gridX, y);
                c.lineTo(gridX + gridW, y);
                c.stroke();
            }
            c.restore();
        }

        function drawHUD() {
            c.save();
            // top pill bar
            c.fillStyle = "rgba(0,0,0,0.18)";
            roundedRect(16, 14, Math.min(620, W - 32), 46, 16);
            c.fill();

            c.shadowColor = "rgba(160,220,255,0.55)";
            c.shadowBlur = 16;
            c.fillStyle = "rgba(255,255,255,0.95)";
            c.font = "900 16px system-ui, Arial";
            c.fillText("Snake", 32, 34);

            c.shadowBlur = 0;
            c.fillStyle = "rgba(255,255,255,0.78)";
            c.font = "600 13px system-ui, Arial";
            const status = !started ? "SPACE Start" : (paused ? "PAUSE (SPACE)" : "SPACE Pause");
            c.fillText(`Score: ${score} • Best: ${best} • ${status} • R Restart`, 32, 52);

            c.restore();
        }

        function drawFood(t, dt) {
            food.pulse += dt * 3.5;
            const p = gridToPx(food.x, food.y);
            const cx = p.x + cell / 2;
            const cy = p.y + cell / 2;

            const pulse = 0.5 + 0.5 * Math.sin(food.pulse);
            const rr = cell * (0.24 + pulse * 0.08);

            c.save();
            c.shadowColor = "rgba(80,220,255,0.55)";
            c.shadowBlur = 18;

            c.fillStyle = "rgba(160,220,255,0.25)";
            c.beginPath();
            c.arc(cx, cy, rr * 1.45, 0, Math.PI * 2);
            c.fill();

            c.fillStyle = "rgba(255,255,255,0.85)";
            c.beginPath();
            c.arc(cx, cy, rr, 0, Math.PI * 2);
            c.fill();

            c.restore();
        }

        function drawSnake(t) {
            // body
            for (let i = snakeBody.length - 1; i >= 0; i--) {
                const s = snakeBody[i];
                const p = gridToPx(s.x, s.y);
                const isHead = i === 0;

                const inset = 3;
                const x = p.x + inset;
                const y = p.y + inset;
                const w = cell - inset * 2;
                const h = cell - inset * 2;

                c.save();

                c.shadowColor = isHead ? "rgba(160,220,255,0.65)" : "rgba(120,180,255,0.35)";
                c.shadowBlur = isHead ? 20 : 12;

                const g = c.createLinearGradient(x, y, x + w, y + h);
                if (isHead) {
                    g.addColorStop(0, "rgba(180,230,255,0.95)");
                    g.addColorStop(1, "rgba(80,160,255,0.78)");
                } else {
                    g.addColorStop(0, "rgba(120,190,255,0.55)");
                    g.addColorStop(1, "rgba(60,120,255,0.30)");
                }
                c.fillStyle = g;

                roundedRect(x, y, w, h, 10);
                c.fill();

                // head eyes
                if (isHead) {
                    const cx = x + w / 2;
                    const cy = y + h / 2;
                    const eyeR = Math.max(2.2, w * 0.10);
                    const eyeDX = w * 0.20;

                    // orient eyes in direction
                    const lookX = dir.x * w * 0.08;
                    const lookY = dir.y * h * 0.08;

                    c.shadowBlur = 0;
                    c.fillStyle = "rgba(10,20,40,0.65)";
                    c.beginPath();
                    c.arc(cx - eyeDX + lookX, cy - h * 0.08 + lookY, eyeR, 0, Math.PI * 2);
                    c.arc(cx + eyeDX + lookX, cy - h * 0.08 + lookY, eyeR, 0, Math.PI * 2);
                    c.fill();

                    c.fillStyle = "rgba(255,255,255,0.45)";
                    c.beginPath();
                    c.arc(cx - eyeDX - eyeR * 0.25 + lookX, cy - h * 0.10 - eyeR * 0.25 + lookY, eyeR * 0.35, 0, Math.PI * 2);
                    c.arc(cx + eyeDX - eyeR * 0.25 + lookX, cy - h * 0.10 - eyeR * 0.25 + lookY, eyeR * 0.35, 0, Math.PI * 2);
                    c.fill();
                }

                c.restore();
            }
        }

        function drawParticles(dt) {
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.t += dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= Math.pow(0.03, dt);
                p.vy *= Math.pow(0.03, dt);

                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = `rgba(160,220,255,${0.28 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();

                if (p.t >= p.life) particles.splice(i, 1);
            }
        }

        function drawOverlay() {
            if (started && !paused) return;

            c.save();
            c.fillStyle = "rgba(0,0,0,0.32)";
            c.fillRect(0, 0, W, H);

            c.fillStyle = "rgba(255,255,255,0.92)";
            c.font = "900 22px system-ui, Arial";
            c.fillText(!started ? "SPACE oder Klick zum Starten" : "PAUSE", gridX, gridY + gridH + 54);

            c.fillStyle = "rgba(255,255,255,0.72)";
            c.font = "600 14px system-ui, Arial";
            c.fillText("WASD/Arrows bewegen • SPACE Pause • R Restart", gridX, gridY + gridH + 78);

            c.restore();
        }

        // ===== Loop =====
        function update(dt) {
            if (!started || paused) return;

            stepTimer += dt;
            while (stepTimer >= step) {
                stepTimer -= step;
                stepOnce();
                if (!running) return; // gameOver ended
            }
        }

        function draw(t, dt) {
            c.clearRect(0, 0, W, H);
            drawBackground(t);
            drawFrame();
            drawHUD();
            drawFood(t, dt);
            drawSnake(t);
            drawParticles(dt);
            drawOverlay();
        }

        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - last) / 1000);
            last = t;

            update(dt);
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
                canvas.addEventListener("pointerdown", onPointerDown);
                canvas.addEventListener("pointermove", onPointerMove);
                window.addEventListener("pointerup", onPointerUp);

                raf = requestAnimationFrame(loop);
            },
            stop() {
                running = false;
                cancelAnimationFrame(raf);

                window.removeEventListener("keydown", onKeyDown);
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
