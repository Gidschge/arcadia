export const runner = {
  id: "runner",
  name: "Runaway Runner",
  controls: "A/D oder ←/→ = Lane | SHIFT/SPACE = Dash",

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

    // Lanes
    const lanes = 3;
    const laneCenterX = (i) => {
      const pad = W * 0.18;
      const usable = W - pad * 2;
      return pad + (usable * (i + 0.5)) / lanes;
    };

    const roadTop = H * 0.12;
    const roadBot = H * 0.92;

    // Player
    const player = {
      lane: 1,
      laneTarget: 1,
      x: laneCenterX(1),
      y: H * 0.8,
      w: 40,
      h: 40,
      dashT: 0,
      dashCd: 0,
      tilt: 0,
    };

    // Obstacles (move downward)
    const obstacles = [];
    let spawnT = 0.6;
    let speed = 360;
    let score = 0;
    let timeAlive = 0;

    // Particles
    const particles = [];
    function spawnParticles(x, y, n, power, good = true) {
      for (let i = 0; i < n; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() * 2 - 1) * power,
          vy: (Math.random() * 2 - 1) * power,
          life: 0.4 + Math.random() * 0.6,
          t: 0,
          r: 2 + Math.random() * 3,
          good,
        });
      }
    }

    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v));
    }

    function reset() {
      score = 0;
      timeAlive = 0;
      speed = 360;
      spawnT = 0.75;

      player.lane = 1;
      player.laneTarget = 1;
      player.x = laneCenterX(1);
      player.dashT = 0;
      player.dashCd = 0;
      player.tilt = 0;

      obstacles.length = 0;
      particles.length = 0;

      ctx.callbacks?.onScore?.(0);
    }

    function laneLeft() {
      player.laneTarget = clamp(player.laneTarget - 1, 0, lanes - 1);
    }
    function laneRight() {
      player.laneTarget = clamp(player.laneTarget + 1, 0, lanes - 1);
    }

    function dash() {
      if (!running || !started) return;
      if (player.dashCd > 0) return;
      player.dashT = 0.16;
      player.dashCd = 0.65;
      spawnParticles(player.x, player.y, 16, 520, true);
    }

    function onKeyDown(e) {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        if (!started) {
          started = true;
          return;
        }
        laneLeft();
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        if (!started) {
          started = true;
          return;
        }
        laneRight();
      }
      if (
        e.code === "ShiftLeft" ||
        e.code === "ShiftRight" ||
        e.code === "Space"
      ) {
        e.preventDefault();
        if (!started) {
          started = true;
          return;
        }
        dash();
      }
    }

    function onPointerDown(ev) {
      if (!started) {
        started = true;
        return;
      }
      // click left/right half -> lane move, middle -> dash
      const x = ev.offsetX ?? ev.clientX - canvas.getBoundingClientRect().left;
      if (x < W * 0.4) laneLeft();
      else if (x > W * 0.6) laneRight();
      else dash();
    }

    function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function spawnObstacle() {
      // spawn in random lane with a bit of variation
      const lane = Math.floor(Math.random() * lanes);
      const x = laneCenterX(lane);
      const size = 34 + Math.random() * 18;
      obstacles.push({
        lane,
        x,
        y: roadTop - 80,
        w: size,
        h: size,
        vy: speed + Math.random() * 90,
        hue: 10 + Math.random() * 25, // warm red/orange
        rot: (Math.random() * 2 - 1) * 1.2,
        a: Math.random() * Math.PI * 2,
        passed: false,
      });
    }

    // --------- Drawing helpers ----------
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
      // inner gradient
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0.00)");
      g.addColorStop(1, "rgba(0,0,0,0.22)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);

      // lane glow lines
      c.save();
      c.strokeStyle = "rgba(80,220,255,0.10)";
      c.lineWidth = 3;

      for (let i = 1; i < lanes; i++) {
        const x =
          laneCenterX(i - 1) + (laneCenterX(i) - laneCenterX(i - 1)) / 2;
        c.beginPath();
        c.moveTo(x, roadTop);
        c.lineTo(x, roadBot);
        c.stroke();
      }

      // road edges
      c.strokeStyle = "rgba(255,255,255,0.10)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(W * 0.18, roadTop);
      c.lineTo(W * 0.18, roadBot);
      c.moveTo(W * 0.82, roadTop);
      c.lineTo(W * 0.82, roadBot);
      c.stroke();

      // moving dashes
      const off = (t * speed * 0.02) % 80;
      c.strokeStyle = "rgba(255,255,255,0.08)";
      c.lineWidth = 2;
      for (let i = 0; i < lanes; i++) {
        const x = laneCenterX(i);
        for (let y = roadTop - 80; y < roadBot + 80; y += 80) {
          c.beginPath();
          c.moveTo(x, y + off);
          c.lineTo(x, y + off + 26);
          c.stroke();
        }
      }
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
        c.fillStyle = p.good
          ? `rgba(160,220,255,${0.35 * a})`
          : `rgba(255,120,120,${0.35 * a})`;

        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        c.fill();

        if (p.t >= p.life) particles.splice(i, 1);
      }
    }

    function drawPlayer() {
      const px = player.x - player.w / 2;
      const py = player.y - player.h / 2;

      // shadow
      c.fillStyle = "rgba(0,0,0,0.30)";
      c.beginPath();
      c.ellipse(player.x, player.y + 30, 18, 6, 0, 0, Math.PI * 2);
      c.fill();

      // trail during dash
      if (player.dashT > 0) {
        c.save();
        c.fillStyle = "rgba(80,220,255,0.10)";
        roundedRect(px - 26, py + 8, 22, player.h - 16, 10);
        c.fill();
        c.restore();
      }

      c.save();
      c.translate(player.x, player.y);
      c.rotate(player.tilt);
      c.translate(-player.x, -player.y);

      c.shadowColor = "rgba(120,180,255,0.55)";
      c.shadowBlur = player.dashT > 0 ? 28 : 18;

      const g = c.createLinearGradient(px, py, px + player.w, py + player.h);
      g.addColorStop(0, "rgba(140,180,255,0.95)");
      g.addColorStop(1, "rgba(60,120,255,0.75)");
      c.fillStyle = g;

      roundedRect(px, py, player.w, player.h, 12);
      c.fill();
      c.restore();

      // eyes
      c.fillStyle = "rgba(255,255,255,0.55)";
      roundedRect(px + 10, py + 12, 6, 6, 3);
      c.fill();
      roundedRect(px + 24, py + 12, 6, 6, 3);
      c.fill();
    }

    function drawObstacles() {
      for (const o of obstacles) {
        const x = o.x - o.w / 2;
        const y = o.y - o.h / 2;

        c.save();
        c.translate(o.x, o.y);
        c.rotate(o.a);
        c.translate(-o.x, -o.y);

        c.shadowColor = `hsla(${o.hue}, 90%, 60%, 0.45)`;
        c.shadowBlur = 18;

        const gg = c.createLinearGradient(x, y, x + o.w, y + o.h);
        gg.addColorStop(0, `rgba(255,140,120,0.92)`);
        gg.addColorStop(1, `rgba(255,70,70,0.70)`);
        c.fillStyle = gg;

        roundedRect(x, y, o.w, o.h, 12);
        c.fill();

        c.shadowBlur = 0;
        c.fillStyle = "rgba(255,255,255,0.16)";
        roundedRect(x + 5, y + 6, Math.max(6, o.w * 0.22), o.h - 12, 10);
        c.fill();

        c.restore();
      }
    }

    function drawStartOverlay() {
      if (started) return;

      c.save();
      c.fillStyle = "rgba(0,0,0,0.35)";
      c.fillRect(0, 0, W, H);

      c.fillStyle = "rgba(255,255,255,0.92)";
      c.font = "900 22px system-ui, Arial";
      c.fillText("Runaway Runner", 28, 46);

      c.fillStyle = "rgba(255,255,255,0.78)";
      c.font = "500 16px system-ui, Arial";
      c.fillText("Klicke oder drücke eine Taste zum Starten", 28, 78);
      c.fillText("Lane: A/D oder ←/→   |   Dash: SHIFT/SPACE", 28, 102);

      c.restore();
    }

    // ---------- Loop ----------
    function loop(t) {
      if (!running) return;
      const dt = Math.min(0.033, (t - lastTime) / 1000);
      lastTime = t;

      if (started) {
        timeAlive += dt;
        speed = Math.min(860, 360 + timeAlive * 28);

        // lane smooth move
        const targetX = laneCenterX(player.laneTarget);
        player.x += (targetX - player.x) * (1 - Math.pow(0.0002, dt));
        // tilt based on movement
        const dx = targetX - player.x;
        player.tilt = clamp(dx / 280, -0.25, 0.25);

        // dash timers
        if (player.dashT > 0) player.dashT -= dt;
        if (player.dashCd > 0) player.dashCd -= dt;

        // spawns
        spawnT -= dt;
        const rate = Math.max(0.2, 0.7 - timeAlive * 0.03);
        if (spawnT <= 0) {
          spawnObstacle();
          spawnT = rate;
        }

        // update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.vy = speed + 60 + Math.random() * 60;
          o.y += o.vy * dt;
          o.a += o.rot * dt;

          // passed score
          if (!o.passed && o.y > player.y + 40) {
            o.passed = true;
            score += 140;
            ctx.callbacks?.onScore?.(score);
          }

          if (o.y > roadBot + 120) obstacles.splice(i, 1);
        }

        // collision (unless dash active)
        if (player.dashT <= 0) {
          const px = player.x - player.w / 2;
          const py = player.y - player.h / 2;
          for (const o of obstacles) {
            const ox = o.x - o.w / 2;
            const oy = o.y - o.h / 2;
            if (rectOverlap(px, py, player.w, player.h, ox, oy, o.w, o.h)) {
              spawnParticles(player.x, player.y, 48, 640, false);
              running = false;
              ctx.callbacks?.onGameOver?.({ score, reason: "Crash!" });
              return;
            }
          }
        } else {
          // small bonus while dashing
          score += Math.floor(30 * dt);
          ctx.callbacks?.onScore?.(score);
        }

        // time score
        score += Math.floor(45 * dt);
        ctx.callbacks?.onScore?.(score);
      }

      // draw
      c.clearRect(0, 0, W, H);
      drawBackground(t);
      drawParticles(dt);
      drawObstacles();
      drawPlayer();
      drawStartOverlay();

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
