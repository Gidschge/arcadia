import { fallingBlocksDodge } from "./FallingBlockDodge/game.js";
import { knifeThrower } from "./KnifeThrower/game.js";
import { oneButtonJumper } from "./OneButtonJumper/game.js";
import { stopRightTime } from "./StopRightTime/game.js";
import { runner } from "./Runner/game.js";

export const gameById = {
  // Die Keys müssen exakt mit der gameId in der URL übereinstimmen
  dodge: {
    ...fallingBlocksDodge,
    id: "dodge", // Sicherstellen, dass die ID im Objekt steckt
  },
  knives: {
    // Geändert von 'knife' zu 'knives', passend zum Link
    ...knifeThrower,
    id: "knives",
  },
  jumper: {
    ...oneButtonJumper,
    id: "jumper",
  },
  stop: {
    ...stopRightTime,
    id: "stop",
  },
  runner: {
    ...runner,
    id: "runner",
  },
};

// GAMES Array für die Startseite und das Leaderboard-Dropdown
export const GAMES = Object.values(gameById);
