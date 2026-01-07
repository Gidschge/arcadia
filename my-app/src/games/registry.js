import { oneButtonJumper } from "./OneButtonJumper/game";
import { stopRightTime } from "./StopRightTime/game";
import { fallingBlocksDodge } from "./FallingBlocksDodge/game";
import { knifeThrower } from "./KnifeThrower/game";
import { runner } from "./Runner/game";


export const gameById = {
    [oneButtonJumper.id]: oneButtonJumper,
    [stopRightTime.id]: stopRightTime,
    [fallingBlocksDodge.id]: fallingBlocksDodge,
    [knifeThrower.id]: knifeThrower,
    [runner.id]: runner,

};

export const GAMES = Object.values(gameById);
