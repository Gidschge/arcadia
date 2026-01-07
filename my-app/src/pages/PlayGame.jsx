import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameById } from "../games/registry";

export default function PlayGame() {
    const { gameId } = useParams();
    const navigate = useNavigate();

    const containerRef = useRef(null);
    const instanceRef = useRef(null);

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
    }, [game]);

    if (!game) {
        return (
            <div className="panel">
                <div className="panelTitle">Game nicht gefunden</div>
                <button className="chipBtn" onClick={() => navigate("/")}>Zurück</button>
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
                <span className="chip">{game.name}</span>
                {game.controls && <span className="chip">{game.controls}</span>}
                <span className="chip">Score: {score}</span>

                <div className="chipRight">
                    <button className="chipBtn" onClick={restart}>Restart</button>
                    <button className="chipBtn" onClick={() => navigate("/")}>Zurück</button>
                </div>
            </div>

            {/* Stage wrapper damit wir ein Overlay oben drauflegen können */}
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
                                <button className="secondaryBtn" onClick={() => navigate("/")}>Zur Arcade</button>
                            </div>

                            <div className="tinyHint">Tipp: SPACE oder Klick funktioniert überall.</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
