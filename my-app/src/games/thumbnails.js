// src/games/thumbnails.js
const enc = (s) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`;

// Kleine Helfer
const esc = (t = "") =>
  String(t)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

// deterministische "random" Zahl aus String (für Partikel-Positionen pro Game)
function hash01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1
  return ((h >>> 0) % 10000) / 10000;
}

function particles(seedStr, count = 22) {
  const r0 = hash01(seedStr + "_a");
  const r1 = hash01(seedStr + "_b");
  const r2 = hash01(seedStr + "_c");
  const pts = [];
  for (let i = 0; i < count; i++) {
    // pseudo-random aber deterministisch
    const x = Math.floor(((r0 + i * 0.137) % 1) * 512);
    const y = Math.floor(((r1 + i * 0.231) % 1) * 288);
    const rr = 0.7 + ((r2 + i * 0.073) % 1) * 2.2;
    const op = 0.10 + (((r0 + r1 + i * 0.111) % 1) * 0.35);
    pts.push(`<circle cx="${x}" cy="${y}" r="${rr.toFixed(2)}" fill="rgba(210,235,255,${op.toFixed(2)})"/>`);
  }
  return pts.join("\n");
}

/**
 * 512x288 (16:9) "Arcadia Premium Cover"
 * accent: z.B. "#77b9ff"
 */
function base({ id, title, subtitle, icon, accent = "#77b9ff", badge }) {
  const t = esc(title);
  const sub = esc(subtitle);
  const bdg = badge ? esc(badge) : "";

  return enc(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="288" viewBox="0 0 512 288">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07122d"/>
      <stop offset="0.55" stop-color="#0a1f4a"/>
      <stop offset="1" stop-color="#060b1d"/>
    </linearGradient>

    <radialGradient id="glow" cx="35%" cy="35%" r="70%">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>

    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0.05)"/>
    </linearGradient>

    <filter id="shadow" x="-30%" y="-40%" width="170%" height="200%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000" flood-opacity="0.55"/>
    </filter>

    <filter id="neon" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${accent}" flood-opacity="0.55"/>
      <feDropShadow dx="0" dy="0" stdDeviation="16" flood-color="${accent}" flood-opacity="0.22"/>
    </filter>

    <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="rgba(255,255,255,0.00)"/>
      <stop offset="0.55" stop-color="rgba(255,255,255,0.06)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0.00)"/>
    </linearGradient>

    <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="rgba(255,255,255,0.04)"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="512" height="288" fill="url(#bg)"/>
  <rect width="512" height="288" fill="url(#glow)"/>

  <!-- Diagonal energy shapes -->
  <g opacity="0.9">
    <path d="M-40 250 L210 20 L270 20 L20 250 Z" fill="rgba(255,255,255,0.04)"/>
    <path d="M260 288 L500 40 L560 40 L320 288 Z" fill="rgba(255,255,255,0.03)"/>
    <path d="M120 310 L360 80" stroke="rgba(255,255,255,0.06)" stroke-width="10" stroke-linecap="round"/>
    <path d="M80 310 L320 80" stroke="rgba(255,255,255,0.04)" stroke-width="6" stroke-linecap="round"/>
  </g>

  <!-- Particles -->
  <g opacity="0.9">
    ${particles(id, 26)}
  </g>

  <!-- Outer frame -->
  <g filter="url(#shadow)">
    <rect x="14" y="14" width="484" height="260" rx="26" fill="rgba(255,255,255,0.05)" stroke="url(#edge)"/>
    <rect x="14" y="14" width="484" height="260" rx="26" fill="none" stroke="rgba(255,255,255,0.06)"/>
  </g>

  <!-- Accent border glow -->
  <rect x="18" y="18" width="476" height="252" rx="24" fill="none" stroke="rgba(255,255,255,0.08)"/>
  <rect x="18" y="18" width="476" height="252" rx="24" fill="none" stroke="${accent}" opacity="0.22"/>

  <!-- Top glass bar -->
  <rect x="28" y="28" width="456" height="74" rx="18" fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.10)"/>



  <!-- Badge -->
  ${badge ? `
    <g transform="translate(372,40)">
      <rect x="0" y="0" width="92" height="26" rx="13" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.14)"/>
      <rect x="0" y="0" width="92" height="26" rx="13" fill="${accent}" opacity="0.12"/>
      <text x="46" y="18" text-anchor="middle"
        font-family="system-ui, -apple-system, Segoe UI, Arial"
        font-size="12" font-weight="900"
        fill="rgba(255,255,255,0.85)">${bdg}</text>
    </g>
  ` : ""}

  <!-- Icon plate -->
  <g filter="url(#neon)">
    <rect x="44" y="118" width="210" height="140" rx="22"
      fill="rgba(0,0,0,0.26)" stroke="rgba(255,255,255,0.10)"/>
    <rect x="44" y="118" width="210" height="140" rx="22"
      fill="url(#scan)" opacity="0.65"/>
    <rect x="44" y="118" width="210" height="140" rx="22"
      fill="url(#scanlines)" opacity="0.20"/>
  </g>

  <!-- Icon (scaled up + centered) -->
  <g transform="translate(0,0) scale(1.20)">
    <g transform="translate(22, -8)">
      ${icon}
    </g>
  </g>

  <!-- Right-side accent line -->
  <path d="M292 128 C360 96, 420 106, 480 84"
    fill="none" stroke="${accent}" stroke-width="6" opacity="0.25" stroke-linecap="round"/>
  <path d="M292 150 C360 118, 420 126, 480 108"
    fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="3" opacity="0.22" stroke-linecap="round"/>

</svg>
  `);
}

// --- Deine ICONS bleiben: (ich hab sie NICHT geändert) ---
const ICONS = {
  jumper: `
    <g transform="translate(0,0)">
      <rect x="108" y="152" width="40" height="40" rx="10" fill="rgba(120,190,255,0.22)" stroke="rgba(255,255,255,0.18)"/>
      <path d="M128 120 L146 146 L110 146 Z" fill="rgba(255,255,255,0.75)"/>
      <rect x="92" y="198" width="72" height="6" rx="3" fill="rgba(255,255,255,0.16)"/>
    </g>
  `,
  asteroids: `
    <g>
      <circle cx="128" cy="158" r="22" fill="rgba(120,190,255,0.18)" stroke="rgba(255,255,255,0.18)"/>
      <path d="M128 126 l18 34 h-36 z" fill="rgba(255,255,255,0.78)"/>
      <circle cx="96" cy="136" r="4" fill="rgba(255,255,255,0.35)"/>
      <circle cx="166" cy="132" r="3" fill="rgba(255,255,255,0.25)"/>
      <circle cx="176" cy="178" r="5" fill="rgba(255,140,140,0.35)"/>
      <circle cx="86" cy="184" r="6" fill="rgba(255,220,140,0.25)"/>
    </g>
  `,
  stoprighttime: `
    <g>
      <circle cx="128" cy="158" r="34" fill="rgba(120,190,255,0.14)" stroke="rgba(255,255,255,0.16)"/>
      <path d="M128 124 a34 34 0 0 1 34 34" fill="none" stroke="rgba(255,120,120,0.45)" stroke-width="6" stroke-linecap="round"/>
      <line x1="128" y1="158" x2="156" y2="142" stroke="rgba(255,255,255,0.78)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="128" cy="158" r="5" fill="rgba(255,255,255,0.75)"/>
    </g>
  `,
  dodge: `
    <g>
      <rect x="96" y="126" width="64" height="72" rx="16" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <rect x="118" y="170" width="20" height="20" rx="6" fill="rgba(120,190,255,0.22)" stroke="rgba(255,255,255,0.18)"/>
      <rect x="106" y="136" width="12" height="12" rx="4" fill="rgba(255,120,120,0.22)"/>
      <rect x="144" y="148" width="12" height="12" rx="4" fill="rgba(255,220,140,0.22)"/>
    </g>
  `,
  breakout: `
    <g>
      <rect x="90" y="132" width="76" height="10" rx="5" fill="rgba(255,255,255,0.18)"/>
      <circle cx="128" cy="160" r="8" fill="rgba(120,190,255,0.26)" stroke="rgba(255,255,255,0.18)"/>
      <g opacity="0.9">
        <rect x="92" y="116" width="18" height="10" rx="4" fill="rgba(255,120,120,0.20)"/>
        <rect x="112" y="116" width="18" height="10" rx="4" fill="rgba(255,220,140,0.20)"/>
        <rect x="132" y="116" width="18" height="10" rx="4" fill="rgba(120,255,190,0.18)"/>
        <rect x="152" y="116" width="18" height="10" rx="4" fill="rgba(160,220,255,0.18)"/>
      </g>
    </g>
  `,
  runner: `
    <g>
      <path d="M116 150 q12 -22 28 0" fill="none" stroke="rgba(255,255,255,0.75)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="128" cy="146" r="8" fill="rgba(120,190,255,0.22)" stroke="rgba(255,255,255,0.18)"/>
      <path d="M110 176 l18 -16 l16 12" fill="none" stroke="rgba(120,190,255,0.35)" stroke-width="6" stroke-linecap="round"/>
      <rect x="92" y="198" width="72" height="6" rx="3" fill="rgba(255,255,255,0.16)"/>
    </g>
  `,
  mini2048: `
    <g>
      <rect x="96" y="126" width="64" height="64" rx="16" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <rect x="104" y="134" width="24" height="24" rx="8" fill="rgba(255,220,140,0.20)" stroke="rgba(255,255,255,0.12)"/>
      <rect x="132" y="134" width="24" height="24" rx="8" fill="rgba(120,255,190,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <rect x="104" y="162" width="24" height="24" rx="8" fill="rgba(160,220,255,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <rect x="132" y="162" width="24" height="24" rx="8" fill="rgba(255,120,120,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <text x="128" y="212" text-anchor="middle" font-family="system-ui, Arial" font-size="14" font-weight="900" fill="rgba(255,255,255,0.72)">2048</text>
    </g>
  `,
  simon: `
    <g>
      <circle cx="128" cy="160" r="34" fill="rgba(0,0,0,0.16)" stroke="rgba(255,255,255,0.12)"/>
      <path d="M128 126 a34 34 0 0 1 34 34" fill="rgba(255,120,120,0.18)"/>
      <path d="M128 126 a34 34 0 0 0 -34 34" fill="rgba(255,220,140,0.16)"/>
      <path d="M128 194 a34 34 0 0 0 34 -34" fill="rgba(120,255,190,0.14)"/>
      <path d="M128 194 a34 34 0 0 1 -34 -34" fill="rgba(160,220,255,0.14)"/>
      <circle cx="128" cy="160" r="7" fill="rgba(255,255,255,0.70)"/>
    </g>
  `,
  balloon: `
    <g>
      <circle cx="128" cy="152" r="20" fill="rgba(255,120,180,0.18)" stroke="rgba(255,255,255,0.14)"/>
      <path d="M128 172 C120 184, 134 188, 128 204" fill="none" stroke="rgba(255,255,255,0.50)" stroke-width="3" stroke-linecap="round"/>
      <circle cx="116" cy="144" r="4" fill="rgba(255,255,255,0.35)"/>
    </g>
  `,
  knives: `
    <g>
      <circle cx="128" cy="160" r="24" fill="rgba(255,220,140,0.12)" stroke="rgba(255,255,255,0.14)"/>
      <path d="M98 132 l18 18" stroke="rgba(160,220,255,0.70)" stroke-width="6" stroke-linecap="round"/>
      <path d="M158 132 l-18 18" stroke="rgba(160,220,255,0.70)" stroke-width="6" stroke-linecap="round"/>
      <path d="M128 116 l0 18" stroke="rgba(255,120,120,0.55)" stroke-width="6" stroke-linecap="round"/>
    </g>
  `,
  laser: `
    <g>
      <rect x="96" y="130" width="64" height="72" rx="18" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <line x1="104" y1="166" x2="168" y2="166" stroke="rgba(255,120,120,0.70)" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 150 l16 -16" stroke="rgba(160,220,255,0.70)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="164" cy="166" r="6" fill="rgba(255,120,120,0.35)"/>
    </g>
  `,
  rhythm: `
    <g>
      <rect x="92" y="152" width="72" height="14" rx="7" fill="rgba(255,255,255,0.14)"/>
      <rect x="124" y="152" width="8" height="14" rx="4" fill="rgba(255,255,255,0.65)"/>
      <circle cx="104" cy="159" r="6" fill="rgba(160,220,255,0.22)"/>
      <circle cx="152" cy="159" r="6" fill="rgba(255,120,120,0.18)"/>
      <text x="128" y="206" text-anchor="middle" font-family="system-ui, Arial" font-size="12" font-weight="900" fill="rgba(255,255,255,0.70)">TIMING</text>
    </g>
  `,
  gravity: `
    <g>
      <circle cx="128" cy="158" r="30" fill="rgba(160,220,255,0.16)" stroke="rgba(255,255,255,0.14)"/>
      <path d="M94 158 h68" stroke="rgba(255,255,255,0.22)" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 126 v64" stroke="rgba(255,255,255,0.14)" stroke-width="4" stroke-linecap="round"/>
      <path d="M128 158 m0 -26 q18 10 0 20 q-18 10 0 20 q18 10 0 20"
            fill="none" stroke="rgba(120,255,190,0.42)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="152" cy="140" r="6" fill="rgba(120,255,190,0.30)"/>
      <circle cx="104" cy="176" r="6" fill="rgba(255,120,180,0.26)"/>
    </g>
  `,

  missile: `
    <g>
      <path d="M128 118 C148 132, 158 154, 150 172 C142 190, 114 198, 98 182 C82 166, 90 134, 110 122 Z"
            fill="rgba(160,220,255,0.14)" stroke="rgba(255,255,255,0.14)"/>
      <path d="M140 132 L164 120 L150 144 Z" fill="rgba(255,120,120,0.18)"/>
      <circle cx="118" cy="148" r="6" fill="rgba(255,255,255,0.45)"/>
      <path d="M86 206 C110 190, 130 204, 164 188" fill="none"
            stroke="rgba(255,120,120,0.42)" stroke-width="6" stroke-linecap="round"/>
      <circle cx="86" cy="206" r="4" fill="rgba(255,120,120,0.30)"/>
      <circle cx="164" cy="188" r="4" fill="rgba(255,220,140,0.22)"/>
    </g>
  `,

  snake: `
    <g>
      <path d="M98 178 C98 150, 126 150, 126 168 C126 188, 156 188, 156 162"
            fill="none" stroke="rgba(120,255,190,0.40)" stroke-width="12" stroke-linecap="round"/>
      <path d="M98 178 C98 150, 126 150, 126 168 C126 188, 156 188, 156 162"
            fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="156" cy="162" r="10" fill="rgba(120,255,190,0.22)" stroke="rgba(255,255,255,0.14)"/>
      <circle cx="160" cy="160" r="2.6" fill="rgba(255,255,255,0.70)"/>
      <circle cx="152" cy="160" r="2.6" fill="rgba(255,255,255,0.70)"/>
      <circle cx="174" cy="190" r="7" fill="rgba(255,120,120,0.22)" stroke="rgba(255,255,255,0.12)"/>
    </g>
  `,

  mines: `
    <g>
      <rect x="92" y="130" width="72" height="72" rx="18"
            fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.12)"/>
      <circle cx="128" cy="166" r="16" fill="rgba(255,120,120,0.18)" stroke="rgba(255,255,255,0.14)"/>
      <path d="M128 144 v-10 M128 188 v10 M106 166 h-10 M160 166 h10
               M113 151 l-8 -8 M143 181 l8 8 M143 151 l8 -8 M113 181 l-8 8"
            stroke="rgba(255,220,140,0.35)" stroke-width="4" stroke-linecap="round"/>
      <path d="M100 206 L116 190" stroke="rgba(120,255,190,0.55)" stroke-width="6" stroke-linecap="round"/>
      <path d="M116 206 L100 190" stroke="rgba(120,255,190,0.55)" stroke-width="6" stroke-linecap="round"/>
    </g>
  `,

};

export function getThumbnail(gameId) {
  switch (gameId) {
    case "jumper":
      return base({
        id: "jumper",
        title: "One-Button Jumper",
        subtitle: "SPACE/Klick = Springen",
        icon: ICONS.jumper,
        accent: "#6aa6ff",
      });

    case "asteroids":
    case "neonasteroids":
      return base({
        id: "asteroids",
        title: "Neon Asteroids",
        subtitle: "Drehen • Schub • Schießen",
        icon: ICONS.asteroids,
        accent: "#7dffcf",
      });

    case "stoprighttime":
    case "stopattherighttime":
      return base({
        id: "stoprighttime",
        title: "Stop at the Right Time",
        subtitle: "SPACE/Klick = Stop",
        icon: ICONS.stoprighttime,
        accent: "#ff7b7b",
      });

    case "dodge":
    case "fallingblocks":
    case "fallingblocksdodge":
      return base({
        id: "dodge",
        title: "Falling Blocks Dodge",
        subtitle: "Move • Dash",
        icon: ICONS.dodge,
        accent: "#ffd27a",
      });

    case "breakout":
    case "neonbreakout":
      return base({
        id: "breakout",
        title: "Neon Breakout PRO",
        subtitle: "Paddle & Ball",
        icon: ICONS.breakout,
        accent: "#7bb6ff",
      });

    case "runner":
    case "runaway":
    case "runawayrunner":
      return base({
        id: "runner",
        title: "Runaway Runner",
        subtitle: "Lane • Dash",
        icon: ICONS.runner,
        accent: "#ff8bd6",
      });

    case "mini2048":
    case "2048":
      return base({
        id: "mini2048",
        title: "Mini-2048",
        subtitle: "WASD/Arrows/Swipe",
        icon: ICONS.mini2048,
        accent: "#9cff7a",
      });

    case "simon":
    case "simonsays":
      return base({
        id: "simon",
        title: "Simon Says PRO",
        subtitle: "1–4 oder Klick",
        icon: ICONS.simon,
        accent: "#7ae3ff",
      });

    case "balloon":
      return base({
        id: "balloon",
        title: "Balloon PRO",
        subtitle: "Ziehen • Steuern",
        icon: ICONS.balloon,
        accent: "#ff79c8",
      });

    case "knives":
    case "knifethrower":
      return base({
        id: "knives",
        title: "Knife Thrower",
        subtitle: "SPACE/Klick = Werfen",
        icon: ICONS.knives,
        accent: "#ffcf6a",
      });

    case "laser":
    case "laserlogic":
      return base({
        id: "laser",
        title: "Laser Logic PRO",
        subtitle: "Klick = Spiegel drehen",
        icon: ICONS.laser,
        accent: "#ff6a6a",
      });

    case "rhythm":
      return base({
        id: "rhythm",
        title: "Rhythm Timing PRO",
        subtitle: "SPACE/Klick = Hit",
        icon: ICONS.rhythm,
        accent: "#b08bff",
      });
    case "gravity":
    case "gravityswitch":
      return base({
        id: "gravity",
        title: "Gravity Switch PRO",
        subtitle: "SPACE/Klick = Switch",
        icon: ICONS.gravity,
        accent: "#7ae3ff",
      });

    case "missile":
    case "missiledefense":
    case "missiledefensepro":
      return base({
        id: "missile",
        title: "Missile Defense PRO",
        subtitle: "Aim • Shoot • Survive",
        icon: ICONS.missile,
        accent: "#ff7b7b",
      });

    case "snake":
    case "neonsnake":
      return base({
        id: "snake",
        title: "Neon Snake PRO",
        subtitle: "Eat • Grow • Don’t crash",
        icon: ICONS.snake,
        accent: "#7dffcf",
      });

    case "mines":
    case "minesweeper":
    case "neonmines":
      return base({
        id: "mines",
        title: "Neon Mines PRO",
        subtitle: "Reveal • Flag • Clear",
        icon: ICONS.mines,
        accent: "#ffd27a",
      });

    default:
      return base({
        id: "fallback",
        title: "Arcadia Game",
        subtitle: "Play now",
        icon: `<g><circle cx="128" cy="160" r="24" fill="rgba(160,220,255,0.18)" stroke="rgba(255,255,255,0.14)"/></g>`,
        accent: "#77b9ff",
      });
  }

}
