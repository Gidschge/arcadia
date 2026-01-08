import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameById } from "../games/registry";
import { saveHighscore } from "../games/utils/highscore";

export default function PlayGame() {
    // 1. gameId kommt jetzt aus dem Pfad /app/play/:gameId
    const { gameId } = useParams();
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const instanceRef = useRef(null);

    // Spiel aus der Registry anhand der URL-ID finden
    const game = useMemo(() => (gameId ? gameById[gameId] ?? null : null), [gameId]);

    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(null);

    useEffect(() => {
        if (!game || !containerRef.current) return;

        containerRef.current.innerHTML = "";
        const rect = containerRef.current.getBoundingClientRect();

        const instance = game.create({
            root: containerRef.current,
            width: Math.floor(rect.width),
            height: Math.floor(rect.height),
            callbacks: {
                onScore: (s) => setScore(s),
                onGameOver: (payload) => {
                    setScore(payload.score);
                    setGameOver(payload);
                    instance.stop();

                    // 🔥 NEU: Highscore mit der ID aus der URL speichern
                    if (gameId) {
                        saveHighscore(gameId, payload.score);
                        console.log(`Highscore für ${gameId} gespeichert.`);
                    }
                },
            },
        });

        instanceRef.current = instance;
        setScore(0);
        setGameOver(null);
        instance.start();

        return () => {
            instanceRef.current?.stop?.();
            instanceRef.current?.destroy?.();
            instanceRef.current = null;
        };
    }, [game, gameId]); // Reagiert auf Spielwechsel via URL

    // Wenn Spiel-ID in der URL ungültig ist
    if (!game) {
        return (
            <div className="panel">
                <div className="panelTitle">Game nicht gefunden</div>
                <p>Die ID "{gameId}" existiert nicht in unserer Arcade.</p>
                <button className="chipBtn" onClick={() => navigate("/app")}>Zurück zur Übersicht</button>
            </div>
        );
    }

    const restart = () => {
        instanceRef.current?.stop?.();
        setScore(0);
        setGameOver(null);
        instanceRef.current?.start?.();
    };

    return (
        <div className="panel">
            <div className="chipsRow">
                <span className="chip">🎮 {game.name}</span>
                {game.controls && <span className="chip">⌨️ {game.controls}</span>}
                <span className="chip" style={{ color: "#4ade80", fontWeight: "bold" }}>Score: {score}</span>

                <div className="chipRight">
                    <button className="chipBtn" onClick={restart}>Restart</button>
                    {/* Navigation zurück zur neuen Home-Route /app */}
                    <button className="chipBtn" onClick={() => navigate("/app")}>Zur Arcade</button>
                </div>
            </div>

            <div className="stageWrap">
                <div ref={containerRef} className="gameStage" />

                {gameOver && (
                    <div className="gameOverOverlay">
                        <div className="gameOverCard">
                            <div className="gameOverTitle">Game Over</div>
                            <div className="gameOverScore">
                                <span className="muted">Dein Score</span>
                                <span className="bigScore">{gameOver.score}</span>
                            </div>

                            {gameOver.reason && (
                                <div className="gameOverReason">{gameOver.reason}</div>
                            )}

                            <div className="gameOverActions">
                                <button className="primaryBtn" onClick={restart}>Nochmal spielen</button>
                                <button className="secondaryBtn" onClick={() => navigate("/app")}>Andere Spiele</button>
                            </div>

                            <div className="tinyHint">Tipp: Highscore wurde automatisch für "{gameId}" gespeichert.</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}