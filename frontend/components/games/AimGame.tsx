"use client";

import { useState, useRef, useEffect } from "react";
import { Target } from "../ui/Target";
import { Crosshair, RotateCcw } from "lucide-react";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "PLAYING" | "FINISHED";

interface AimGameProps {
    difficulty?: "normal" | "hard";
}

export default function AimGame({ difficulty = "hard" }: AimGameProps) {
    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [remaining, setRemaining] = useState(30);
    const [targetPos, setTargetPos] = useState({ top: 50, left: 50 });
    const [result, setResult] = useState(0);
    const [misses, setMisses] = useState(0);
    const [highScore, setHighScore] = useState<number | null>(null);
    const [showMissFlash, setShowMissFlash] = useState(false);

    const startTimeRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const storageKey = difficulty === "hard" ? "aim_trainer_hard_score" : "aim_trainer_score";
    const gameTypeKey = difficulty === "hard" ? "aim_trainer_hard" : "aim_trainer";
    const gameTitle = difficulty === "hard" ? "Aim Trainer (Hard)" : "Aim Trainer";
    const targetSize = difficulty === "hard" ? 32 : 96;

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setHighScore(parseFloat(saved));
    }, [storageKey]);

    const moveTarget = () => {
        const top = Math.random() * 80 + 10;
        const left = Math.random() * 80 + 10;
        setTargetPos({ top, left });
    };

    const startGame = () => {
        setRemaining(30);
        setMisses(0);
        setGameState("PLAYING");
        moveTarget();
        startTimeRef.current = 0;
    };

    const handleBackgroundClick = () => {
        if (gameState !== "PLAYING") return;
        setMisses((m) => m + 1);
        setShowMissFlash(true);
        setTimeout(() => setShowMissFlash(false), 100);
    };

    const handleTargetClick = () => {
        if (gameState !== "PLAYING") return;

        const now = performance.now();

        if (remaining === 30) {
            startTimeRef.current = now;
            setRemaining((r) => r - 1);
            moveTarget();
            return;
        }

        const nextRemaining = remaining - 1;
        setRemaining(nextRemaining);

        if (nextRemaining === 0) {
            const rawTime = now - startTimeRef.current;
            const penaltyTime = difficulty === "hard" ? misses * 200 : 0;
            const finalTime = rawTime + penaltyTime;
            const avgTime = finalTime / 30;
            finishGame(avgTime);
        } else {
            moveTarget();
        }
    };

    const finishGame = (avgTime: number) => {
        setGameState("FINISHED");
        setResult(avgTime);

        if (highScore === null || avgTime < highScore) {
            setHighScore(avgTime);
            localStorage.setItem(storageKey, avgTime.toFixed(2));
        }

        fetch('/api/cognitive/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_type: gameTypeKey, score: avgTime })
        }).catch(console.error);
    };

    return (
        <div className="relative w-full h-full flex flex-col">
            {/* Header Overlay */}
            <div className="absolute top-8 left-0 right-0 z-30 flex flex-col items-center gap-2 pointer-events-none select-none">
                <h2 className="text-4xl font-bold drop-shadow-lg filter">
                    {gameState === "PLAYING" ? `Remaining: ${remaining}` : gameTitle}
                </h2>
                <div className="flex gap-4">
                    <p className="text-white/80 drop-shadow-md">
                        Best: {highScore ? `${highScore.toFixed(2)}ms` : "--"}
                    </p>
                    {gameState === "PLAYING" && difficulty === "hard" && misses > 0 && (
                        <p className="text-rose-500 font-bold drop-shadow-md">
                            Penalty: +{misses * 200}ms
                        </p>
                    )}
                </div>
            </div>

            <div
                ref={containerRef}
                className={`relative w-full h-full bg-slate-900 overflow-hidden transition-colors duration-100 ${showMissFlash ? "bg-rose-950" : "bg-slate-900"
                    }`}
                style={{ cursor: 'crosshair' }}
                onMouseDown={handleBackgroundClick}
            >
                <div className="absolute inset-0">
                    {gameState === "IDLE" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 transition-opacity hover:bg-black/30">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    startGame();
                                }}
                                className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform shadow-xl pointer-events-auto cursor-pointer"
                            >
                                <Crosshair className="w-5 h-5" /> Start
                            </button>
                        </div>
                    )}

                    {gameState === "FINISHED" && (
                        <ResultModal
                            isOpen={gameState === "FINISHED"}
                            score={Number(result.toFixed(2))}
                            unit="ms"
                            gameType={gameTitle}
                            onRetry={startGame}
                        />
                    )}

                    {gameState === "PLAYING" && (
                        <Target
                            top={targetPos.top}
                            left={targetPos.left}
                            onMouseDown={handleTargetClick}
                            size={targetSize}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
