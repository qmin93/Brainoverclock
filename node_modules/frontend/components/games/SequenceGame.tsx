"use client";

import { useState, useEffect, useRef } from "react";
import { Tile } from "../ui/Tile";
import { Play, RotateCcw } from "lucide-react";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "SHOWING" | "INPUT" | "GAME_OVER";

export default function SequenceGame() {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem("sequence_memory_score");
        if (saved) setHighScore(parseInt(saved));
    }, []);

    const addToSequence = () => {
        const next = Math.floor(Math.random() * 9);
        setSequence((prev) => [...prev, next]);
    };

    const playSequence = async (seq: number[]) => {
        setGameState("SHOWING");
        await new Promise((r) => setTimeout(r, 500)); // Initial delay

        for (let i = 0; i < seq.length; i++) {
            setActiveTile(seq[i]);
            await new Promise((r) => setTimeout(r, 600)); // Flash duration
            setActiveTile(null);
            await new Promise((r) => setTimeout(r, 200)); // Gap
        }

        setGameState("INPUT");
    };

    const startGame = () => {
        setSequence([]);
        setUserSequence([]);
        setLevel(1);
        const first = Math.floor(Math.random() * 9);
        setSequence([first]);
        // Effect will trigger playSequence when sequence changes?
        // Better to handle explicitly to avoid double triggers.
        // However, since state update is async, we can useEffect on sequence change
        // BUT only if game is running.
        // Let's call playSequence manually after a delay or use effect.
        // Using simple approach: just setSequence, and let an Effect handle 'if (sequence matches level and state is showing?)'
        // Actually, explicit is better.
        setTimeout(() => playSequence([first]), 500);
    };

    const handleNextLevel = () => {
        setLevel((l) => l + 1);
        setUserSequence([]);
        const next = Math.floor(Math.random() * 9);
        const newSeq = [...sequence, next];
        setSequence(newSeq);
        setTimeout(() => playSequence(newSeq), 1000);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "INPUT") return;

        // Visual feedback for click
        setActiveTile(index);
        setTimeout(() => setActiveTile(null), 200);

        const newUserSeq = [...userSequence, index];
        setUserSequence(newUserSeq);

        // Validate
        const checkIndex = newUserSeq.length - 1;
        if (newUserSeq[checkIndex] !== sequence[checkIndex]) {
            // Game Over
            setGameState("GAME_OVER");
            if ((level - 1) > highScore) {
                setHighScore(level - 1);
                localStorage.setItem("sequence_memory_score", (level - 1).toString());
            }
            // Send stats (Non-blocking)
            fetch('/api/cognitive/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_type: 'sequence_memory', score: level - 1 })
            }).catch(console.error);
        } else if (newUserSeq.length === sequence.length) {
            // Level Complete
            handleNextLevel();
        }
    };

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-2">
                <h2 className="text-3xl font-bold">Level {level}</h2>
                <p className="opacity-60">High Score: {highScore}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                    <Tile
                        key={i}
                        isActive={activeTile === i}
                        onClick={() => handleTileClick(i)}
                        disabled={gameState !== "INPUT"}
                    />
                ))}
            </div>

            <div className="h-16 flex items-center justify-center">
                {gameState === "IDLE" && (
                    <button
                        onClick={startGame}
                        className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                    >
                        <Play className="w-5 h-5" /> Start Game
                    </button>
                )}
                {gameState === "GAME_OVER" && (
                    <ResultModal
                        isOpen={gameState === "GAME_OVER"}
                        score={level - 1} // Score is completed levels
                        unit="Level"
                        gameType="Sequence Memory"
                        onRetry={startGame}
                    />
                )}
                {(gameState === "SHOWING" || gameState === "INPUT") && (
                    <div className="text-white/50 text-sm">
                        {gameState === "SHOWING" ? "Watch the sequence..." : "Repeat the sequence"}
                    </div>
                )}
            </div>
        </div>
    );
}
