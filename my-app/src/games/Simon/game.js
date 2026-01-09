export const simon = {
    id: "simon",
    name: "Simon Says",
    controls: "1-4 oder Klick = Pad drücken",

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

        // Game state
        let score = 0;
        let round = 0;
        const seq = [];
        let inputIndex = 0;

        // modes: "idle" | "show" | "input" | "fail"
        let mode = "idle";

        // timing
        let showIndex = 0;
        let showTimer = 0;
        let flashTimer = 0;
        let flashPad = -1;

        // difficulty
        let baseBeat = 0.55; // seconds, gets smaller over time

        // UI layout
        const panel = {
            size: Math.min(W, H) * 0.62,
        };
        panel.x = Math.floor((W - panel.size) / 2);
        panel.y = Math.floor((H - panel.size) / 2) + 10;

        const gap = Math.max(14, Math.floor(panel.size * 0.03));
        const cell = Math.floor((panel.size - gap * 3) / 2);

        function padRect(i) {
            // 0=tl,1=tr,2=bl,3=br
            const row = i >= 2 ? 1 : 0;
            const col = i % 2;
            const x = panel.x + gap + col * (cell + gap);
            const y = panel.y + gap + row * (cell + gap);
            return { x, y, w: cell, h: cell };
        }

        // particles
        const particles = [];
        function spawnParticles(x, y, n, power, good = true) {
            for (let i = 0; i < n; i++) {
                particles.push({
                    x, y,
                    vx: (Math.random() * 2 - 1) * power,
                    vy: (Math.random() * 2 - 1) * power,
                    life: 0.30 + Math.random() * 0.55,
                    t: 0,
                    r: 2 + Math.random() * 3,
                    good,
                });
            }
        }

        function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

        // ---------- Sound (WebAudio) ----------
        let audio = null;
        function ensureAudio() {
            if (audio) return;
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            audio = new AC();
        }

        const freqs = [392, 494, 587, 784]; // nice chord-ish
        function beep(pad, ok = true) {
            ensureAudio();
            if (!audio) return;

            const t0 = audio.currentTime;
            const osc = audio.createOscillator();
            const gain = audio.createGain();

            osc.type = "sine";
            osc.frequency.value = freqs[pad] || 440;

            const base = ok ? 0.08 : 0.06;
            gain.gain.setValueAtTime(0.0001, t0);
            gain.gain.exponentialRampToValueAtTime(base, t0 + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (ok ? 0.14 : 0.10));

            osc.connect(gain).connect(audio.destination);
            osc.start(t0);
            osc.stop(t0 + (ok ? 0.16 : 0.12));
        }

        // ---------- Game flow ----------
        function reset() {
            score = 0;
            round = 0;
            seq.length = 0;
            inputIndex = 0;
            mode = "idle";

            showIndex = 0;
            showTimer = 0;
            flashTimer = 0;
            flashPad = -1;

            baseBeat = 0.55;
            ctx.callbacks?.onScore?.(0);
        }

        function nextRound() {
            round += 1;
            inputIndex = 0;

            // difficulty ramp
            baseBeat = clamp(0.55 - round * 0.02, 0.22, 0.55);

            // add step
            seq.push(Math.floor(Math.random() * 4));

            // show sequence
            mode = "show";
            showIndex = 0;
            showTimer = 0.15;
            flashTimer = 0;
            flashPad = -1;
        }

        function startGame() {
            reset();
            nextRound();
        }

        function triggerFlash(pad, good = true) {
            flashPad = pad;
            flashTimer = good ? 0.18 : 0.22;

            const r = padRect(pad);
            spawnParticles(r.x + r.w / 2, r.y + r.h / 2, good ? 18 : 28, good ? 520 : 680, good);
            beep(pad, good);
        }

        function pressPad(pad) {
            if (!running) return;

            if (mode === "idle") {
                // first interaction starts game
                startGame();
                return;
            }

            if (mode !== "input") return;

            triggerFlash(pad, true);

            const expected = seq[inputIndex];
            if (pad !== expected) {
                // fail
                mode = "fail";
                // error beep
                try { beep(expected, false); } catch { }
                ctx.callbacks?.onGameOver?.({ score, reason: `Falsch! Runde ${round}` });
                running = false;
                return;
            }

            // correct
            score += 120 + round * 15;
            ctx.callbacks?.onScore?.(score);

            inputIndex += 1;
            if (inputIndex >= seq.length) {
                // round cleared
                score += 250 + round * 35;
                ctx.callbacks?.onScore?.(score);

                // small pause then next round
                mode = "show";
                showIndex = 0;
                showTimer = 0.40;
                // add next step after pause
                // We'll add in update when showTimer elapses and showIndex==0 and inputIndex==seq.length.
            }
        }

        function update(dt) {
            // flash decay
            if (flashTimer > 0) {
                flashTimer -= dt;
                if (flashTimer <= 0) flashPad = -1;
            }

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

            if (mode === "show") {
                showTimer -= dt;
                if (showTimer <= 0) {
                    // If we just cleared a round, add next element once before showing
                    if (inputIndex >= seq.length) {
                        inputIndex = 0;
                        nextRound();
                        return;
                    }

                    const pad = seq[showIndex];
                    triggerFlash(pad, true);

                    showIndex += 1;

                    if (showIndex >= seq.length) {
                        // end showing -> input mode
                        mode = "input";
                        showIndex = 0;
                        showTimer = 0;
                    } else {
                        // next beat (gap + flash)
                        showTimer = baseBeat;
                    }
                }
            }
        }

        // ---------- Input ----------
        function onKeyDown(e) {
            const map = {
                Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
                Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3,
            };
            const pad = map[e.code];
            if (pad !== undefined) {
                e.preventDefault();
                pressPad(pad);
            }
            if (e.code === "Space" && mode === "idle") {
                e.preventDefault();
                startGame();
            }
        }

        function onPointerDown(e) {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left);
            const y = (e.clientY - rect.top);

            for (let i = 0; i < 4; i++) {
                const r = padRect(i);
                if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                    pressPad(i);
                    return;
                }
            }

            // click outside pads: if idle, start
            if (mode === "idle") startGame();
        }

        // ---------- Drawing ----------
        function drawBackground(t) {
            const g = c.createLinearGradient(0, 0, 0, H);
            g.addColorStop(0, "rgba(0,0,0,0.00)");
            g.addColorStop(1, "rgba(0,0,0,0.22)");
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);

            // subtle scanlines
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

        const baseCols = [
            { bg: "rgba(120,180,255,0.22)", glow: "rgba(120,180,255,0.55)" }, // tl
            { bg: "rgba(80,220,255,0.22)", glow: "rgba(80,220,255,0.55)" }, // tr
            { bg: "rgba(140,255,200,0.22)", glow: "rgba(140,255,200,0.55)" }, // bl
            { bg: "rgba(255,220,120,0.22)", glow: "rgba(255,220,120,0.55)" }, // br
        ];

        function drawPanel() {
            // outer panel
            c.save();
            c.shadowColor = "rgba(0,0,0,0.55)";
            c.shadowBlur = 18;
            c.fillStyle = "rgba(0,0,0,0.18)";
            roundedRect(panel.x, panel.y, panel.size, panel.size, 22);
            c.fill();
            c.restore();
        }

        function drawPads() {
            for (let i = 0; i < 4; i++) {
                const r = padRect(i);
                const col = baseCols[i];

                const active = (i === flashPad && flashTimer > 0);
                const k = active ? (flashTimer / 0.18) : 0;

                c.save();
                c.shadowColor = active ? col.glow : "rgba(0,0,0,0.0)";
                c.shadowBlur = active ? 28 : 0;

                c.fillStyle = col.bg;
                roundedRect(r.x, r.y, r.w, r.h, 18);
                c.fill();

                // inner highlight
                c.shadowBlur = 0;
                c.fillStyle = "rgba(255,255,255,0.08)";
                roundedRect(r.x + 10, r.y + 12, Math.max(12, r.w * 0.22), r.h - 24, 16);
                c.fill();

                // active overlay
                if (active) {
                    c.fillStyle = `rgba(255,255,255,${0.12 * k})`;
                    roundedRect(r.x, r.y, r.w, r.h, 18);
                    c.fill();
                }

                // label
                c.fillStyle = "rgba(255,255,255,0.62)";
                c.font = "900 18px system-ui, Arial";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.fillText(String(i + 1), r.x + r.w / 2, r.y + r.h / 2);

                c.restore();
            }
        }

        function drawParticles() {
            for (const p of particles) {
                const a = Math.max(0, 1 - p.t / p.life);
                c.fillStyle = p.good
                    ? `rgba(160,220,255,${0.30 * a})`
                    : `rgba(255,120,120,${0.30 * a})`;
                c.beginPath();
                c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                c.fill();
            }
        }

        function drawTopText() {
            c.save();
            c.fillStyle = "rgba(255,255,255,0.86)";
            c.font = "900 20px system-ui, Arial";
            c.fillText("SIMON SAYS", 22, 38);

            c.fillStyle = "rgba(255,255,255,0.70)";
            c.font = "600 14px system-ui, Arial";
            const status =
                mode === "idle" ? "Klick oder 1-4 zum Starten" :
                    mode === "show" ? "Merken…" :
                        "Dein Zug!";
            c.fillText(`Runde: ${round}  •  ${status}`, 22, 62);

            c.restore();
        }

        function drawCenterHint() {
            if (mode !== "idle") return;
            c.save();
            c.fillStyle = "rgba(255,255,255,0.70)";
            c.font = "600 16px system-ui, Arial";
            c.textAlign = "center";
            c.fillText("Drücke 1-4 oder klicke ein Pad", W / 2, panel.y - 18);
            c.restore();
        }

        function loop(t) {
            if (!running) return;
            const dt = Math.min(0.033, (t - lastTime) / 1000);
            lastTime = t;

            update(dt);

            c.clearRect(0, 0, W, H);
            drawBackground(t);
            drawTopText();
            drawCenterHint();
            drawPanel();
            drawPads();
            drawParticles();

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
