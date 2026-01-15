import { oneButtonJumper } from "./OneButtonJumper/game.js";
import { stopRightTime } from "./StopRightTime/game.js";
import { fallingBlocksDodge } from "./FallingBlocksDodge/game.js";
import { runner } from "./Runner/game.js";
import { mini2048 } from "./Mini2048/game.js";
import { simon } from "./Simon/game.js";
import { balloon } from "./Balloon/game.js";
import { asteroids } from "./Asteroids/game.js";
import { rhythm } from "./Rhythm/game.js";
import { gravity } from "./Gravity/game.js";
import { breakout } from "./NeonBreakout/game.js";
import { missiledefense } from "./MissileDefense/game.js";
import { nebula } from "./NebulaArena/game.js";
import { getThumbnail } from "./thumbnails.js";
import { snake } from "./Snake/game";
import { neonMines } from "./NeonMines/game";




/* -------------------------------------------------- */
/* 1. Alle Games an EINER Stelle sammeln              */
/* -------------------------------------------------- */

const RAW_GAMES = [
    oneButtonJumper,
    asteroids,
    stopRightTime,
    nebula,
    fallingBlocksDodge,
    breakout,
    runner,
    mini2048,
    simon,
    balloon,
    rhythm,
    gravity,
    missiledefense,
    snake,
    neonMines,
];

/* -------------------------------------------------- */
/* 2. Validieren + Thumbnail hinzufügen               */
/* -------------------------------------------------- */

export const GAMES = RAW_GAMES
    .filter((g) => {
        if (!g || !g.id) {
            console.warn("⚠️ Game ohne id ignoriert:", g);
            return false;
        }
        return true;
    })
    .map((g) => ({
        ...g,
        thumbnail: getThumbnail(g.id),
    }));

/* -------------------------------------------------- */
/* 3. Schneller Zugriff per ID                        */
/* -------------------------------------------------- */

export const gameById = Object.fromEntries(
    GAMES.map((g) => [g.id, g])
);
