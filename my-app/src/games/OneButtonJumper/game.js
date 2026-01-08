export const oneButtonJumper = {
  id: "jumper",
  name: "One-Button Jumper",
  controls: "SPACE / Klick = Springen",

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

    let raf = 0;
    let running = false;
    let started = false; // <- Startscreen
    let lastTime = 0;

    // World sizes
    const W = ctx.width;
    const H = ctx.height;

    const groundY = Math.floor(H * 0.86);
    const gravity = 1900;

    let score = 0;
    let speed = 340;

    const player = {
      x: Math.floor(W * 0.18),
      y: groundY,
      w: 34,
      h: 34,
      vy: 0,
      onGround: true,
      tilt: 0,
    };

    const obstacles = [];
    let nextSpawn = 0;

    // Simple particles
    const particles = [];
    function spawnParticles(x, y, n, power) {
      for (let i = 0; i < n; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() * 2 - 1) * power,
          vy: Math.random() * -1.2 * power,
          life: 0.5 + Math.random() * 0.5,
          t: 0,
          r: 2 + Math.random() * 3,
        });
      }
    }

    function reset() {
      score = 0;
      speed = 340;
      player.y = groundY;
      player.vy = 0;
      player.onGround = true;
      player.tilt = 0;
      obstacles.length = 0;
      particles.length = 0;
      nextSpawn = 0.6;
      ctx.callbacks?.onScore?.(0);
    }

    function jump() {
      if (!running) return;

      if (!started) {
        started = true;
        return;
      }

      if (player.onGround) {
        player.vy = -720;
        player.onGround = false;
        spawnParticles(player.x + player.w * 0.5, player.y, 14, 260);
      }
    }

    function onKeyDown(e) {
      if (e.code === "Space") {
        e.preventDefault();
        jump();
      }
    }
    function onPointerDown() {
      jump();
    }

    function spawnObstacle() {
      const tall = 60 + Math.random() * 70;
      const wide = 22 + Math.random() * 14;
      obstacles.push({
        x: W + 40,
        w: wide,
        h: tall,
        y: groundY,
        passed: false,
      });
    }

    function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    // ---------- Rendering helpers ----------
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
      // soft gradient bg inside stage
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0.00)");
      g.addColorStop(1, "rgba(0,0,0,0.22)");
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);

      // subtle moving grid
      const gridOffset = (time * 0.06) % 40;
      c.strokeStyle = "rgba(255,255,255,0.05)";
      c.lineWidth = 1;

      for (let x = -40; x < W + 40; x += 40) {
        c.beginPath();
        c.moveTo(x - gridOffset, 0);
        c.lineTo(x - gridOffset, H);
        c.stroke();
      }

      for (let y = 0; y < H; y += 40) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
    }

    function drawGround(time) {
      // ground glow line
      c.save();
      c.strokeStyle = "rgba(0,255,255,0.18)";
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(0, groundY + 22);
      c.lineTo(W, groundY + 22);
      c.stroke();

      c.strokeStyle = "rgba(255,255,255,0.10)";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(0, groundY + 22);
      c.lineTo(W, groundY + 22);
      c.stroke();

      // lane streaks
      const off = (time * speed * 0.02) % 90;
      c.strokeStyle = "rgba(255,255,255,0.08)";
      c.lineWidth = 2;
      for (let x = -120; x < W + 120; x += 90) {
        c.beginPath();
        c.moveTo(x - off, groundY + 38);
        c.lineTo(x - off + 50, groundY + 38);
        c.stroke();
      }

      c.restore();
    }

    function drawPlayer() {
      const px = player.x;
      const py = player.y - player.h;

      // shadow
      c.save();
      c.fillStyle = "rgba(0,0,0,0.30)";
      c.beginPath();
      c.ellipse(px + player.w / 2, groundY + 26, 18, 6, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();

      // tilt effect
      c.save();
      c.translate(px + player.w / 2, py + player.h / 2);
      c.rotate(player.tilt);
      c.translate(-(px + player.w / 2), -(py + player.h / 2));

      // glow
      c.save();
      c.shadowColor = "rgba(120,180,255,0.55)";
      c.shadowBlur = 18;

      const g = c.createLinearGradient(px, py, px + player.w, py + player.h);
      g.addColorStop(0, "rgba(140,180,255,0.95)");
      g.addColorStop(1, "rgba(60,120,255,0.75)");
      c.fillStyle = g;

      roundedRect(px, py, player.w, player.h, 10);
      c.fill();
      c.restore();

      // face detail
      c.fillStyle = "rgba(255,255,255,0.65)";
      roundedRect(px + 8, py + 10, 6, 6, 3);
      c.fill();
      roundedRect(px + 20, py + 10, 6, 6, 3);
      c.fill();

      c.restore();
    }

    function drawObstacles() {
      for (const o of obstacles) {
        const x = o.x;
        const y = o.y - o.h;

        // neon pillar
        c.save();
        c.shadowColor = "rgba(255,90,90,0.45)";
        c.shadowBlur = 16;

        const g = c.createLinearGradient(x, y, x + o.w, y + o.h);
        g.addColorStop(0, "rgba(255,130,130,0.95)");
        g.addColorStop(1, "rgba(255,60,60,0.70)");
        c.fillStyle = g;

        roundedRect(x, y, o.w, o.h, 10);
        c.fill();
        c.restore();

        // small highlight
        c.fillStyle = "rgba(255,255,255,0.18)";
        roundedRect(x + 4, y + 6, Math.max(4, o.w * 0.25), o.h - 12, 6);
        c.fill();
      }
    }

    function drawParticles(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 1200 * dt;

        const a = Math.max(0, 1 - p.t / p.life);
        c.fillStyle = `rgba(180,220,255,${0.35 * a})`;
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
      c.font = "700 22px system-ui, Arial";
      c.fillText("One-Button Jumper", 28, 44);

      c.fillStyle = "rgba(255,255,255,0.78)";
      c.font = "500 16px system-ui, Arial";
      c.fillText("Drücke SPACE oder klicke zum Starten", 28, 72);
      c.fillText(
        "Springe über die Hindernisse – je länger, desto schneller!",
        28,
        96
      );

      c.restore();
    }

    // ---------- Loop ----------
    function loop(time) {
      if (!running) return;

      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      // Update only after start
      if (started) {
        // Speed ramps
        speed = Math.min(720, speed + 16 * dt);

        // player physics
        player.vy += gravity * dt;
        player.y += player.vy * dt;

        // tilt (more tilt when in air)
        player.tilt = Math.max(-0.35, Math.min(0.35, -player.vy / 1700));

        if (player.y >= groundY) {
          player.y = groundY;
          player.vy = 0;
          player.onGround = true;
          player.tilt *= 0.75;
        }

        // spawn obstacles
        nextSpawn -= dt;
        if (nextSpawn <= 0) {
          spawnObstacle();
          nextSpawn = 0.9 + Math.random() * 0.8 - Math.min(0.35, score / 4000);
        }

        // move obstacles + scoring
        for (let i = obstacles.length - 1; i >= 0; i--) {
          const o = obstacles[i];
          o.x -= speed * dt;

          // passed = score
          if (!o.passed && o.x + o.w < player.x) {
            o.passed = true;
            score += 120;
            ctx.callbacks?.onScore?.(score);
          }

          // remove
          if (o.x < -100) obstacles.splice(i, 1);
        }

        // collision
        const px = player.x;
        const py = player.y - player.h;
        for (const o of obstacles) {
          const ox = o.x;
          const oy = o.y - o.h;
          if (rectOverlap(px, py, player.w, player.h, ox, oy, o.w, o.h)) {
            running = false;
            spawnParticles(px + player.w / 2, py + player.h / 2, 40, 420);
            ctx.callbacks?.onGameOver?.({ score, reason: "Kollision" });
            return;
          }
        }

        // time score
        score += Math.floor(55 * dt);
        ctx.callbacks?.onScore?.(score);
      }

      // draw
      c.clearRect(0, 0, W, H);
      drawBackground(time);
      drawGround(time);
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
