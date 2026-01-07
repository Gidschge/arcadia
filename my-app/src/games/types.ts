export type GameOverPayload = {
    score: number;
    reason?: string;
    meta?: Record<string, any>;
};

export type GameCallbacks = {
    onScore?: (score: number) => void;              // optional live score updates
    onGameOver: (payload: GameOverPayload) => void; // required
};

export type GameContext = {
    root: HTMLElement;   // Container (div) wo das Spiel reinrendert
    width: number;       // verfügbare Breite
    height: number;      // verfügbare Höhe
    callbacks: GameCallbacks;
};

export interface ArcadeGame {
    id: string;
    name: string;
    description?: string;
    controls?: string;       // z.B. "SPACE = Jump"
    requiresAuth?: boolean;  // falls du Login/Coins hast
    proCost?: number;        // falls Coins relevant sind

    create: (ctx: GameContext) => GameInstance;
}

export interface GameInstance {
    start: () => void;
    stop: () => void;
    destroy: () => void; // MUSS alles aufräumen (raf, intervals, listeners, dom)
}
