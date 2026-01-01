"use client";

import { useState, useEffect, useCallback } from "react";
import { Tile } from "../ui/Tile";
import { Play } from "lucide-react";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "SHOWING" | "INPUT" | "GAME_OVER";

export default function SequenceGame() {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [dummies, setDummies] = useState<number[]>([]); // New: Red Decoy Tiles
    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(0);

    // Initial Load & Cleanup
    useEffect(() => {
        const saved = localStorage.getItem("sequence_memory_score");
        if (saved) setHighScore(parseInt(saved));

        // Cleanup reset on unmount
        return () => {
            setGameState("IDLE");
            setSequence([]);
            setUserSequence([]);
            setDummies([]);
        };
    }, []);

    const generateDummies = (currentSeq: number[], currentLevel: number) => {
        const occupied = new Set(currentSeq);
        const available = Array.from({ length: 9 }, (_, i) => i).filter(i => !occupied.has(i));

        // Dummy count increases with level, capped by available space
        // e.g. Level 1-2: 1 dummy, Level 3-4: 2 dummies, etc.
        const targetCount = Math.min(available.length, Math.floor((currentLevel + 1) / 2));

        // Shuffle available
        for (let i = available.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [available[i], available[j]] = [available[j], available[i]];
        }

        return available.slice(0, targetCount);
    };

    const playSequence = async (seq: number[]) => {
        setGameState("SHOWING");
        await new Promise((r) => setTimeout(r, 500));

        for (let i = 0; i < seq.length; i++) {
            setActiveTile(seq[i]);
            await new Promise((r) => setTimeout(r, 600));
            setActiveTile(null);
            await new Promise((r) => setTimeout(r, 200));
        }

        setGameState("INPUT");
    };

    const startGame = () => {
        setSequence([]);
        setUserSequence([]);
        setLevel(1);

        const first = Math.floor(Math.random() * 9);
        const initialSeq = [first];
        setSequence(initialSeq);

        // Generate dummies for Level 1
        const initialDummies = generateDummies(initialSeq, 1);
        setDummies(initialDummies);

        setTimeout(() => playSequence(initialSeq), 500);
    };

    const handleNextLevel = () => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setUserSequence([]);

        const next = Math.floor(Math.random() * 9);
        const newSeq = [...sequence, next];
        setSequence(newSeq);

        // Regenerate dummies for new level
        const newDummies = generateDummies(newSeq, nextLevel);
        setDummies(newDummies);

        setTimeout(() => playSequence(newSeq), 1000);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "INPUT") return;

        // Check if Dummy clicked
        if (dummies.includes(index)) {
            gameOver();
            return;
        }

        // Visual feedback
        setActiveTile(index);
        setTimeout(() => setActiveTile(null), 200);

        const newUserSeq = [...userSequence, index];
        setUserSequence(newUserSeq);

        // Validate
        const checkIndex = newUserSeq.length - 1;
        if (newUserSeq[checkIndex] !== sequence[checkIndex]) {
            gameOver();
        } else if (newUserSeq.length === sequence.length) {
            handleNextLevel();
        }
    };

    const gameOver = () => {
        setGameState("GAME_OVER");
        if ((level - 1) > highScore) {
            setHighScore(level - 1);
            localStorage.setItem("sequence_memory_score", (level - 1).toString());
        }
        // Send stats
        fetch('/api/cognitive/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_type: 'sequence_memory', score: level - 1 })
        }).catch(console.error);
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
                        isDummy={dummies.includes(i) && activeTile !== i}
                        // Show Dummies ONLY when NOT showing sequence? Or ALWAYS?
                        // "빨간색 더미들도 항상 출연시켜주고" -> Always appear.
                        // But if activeTile matches dummy (should not happen by logic), active takes precedence.
                        // Wait, if a tile is both in sequence and dummy? Logic prevents this.
                        // So simple: isDummy={dummies.includes(i)}
                        // BUT visual priority: if it flashes white (active), it should be white.
                        // Tile component handles: isActive ? white : isDummy ? red. 
                        // So we just pass isDummy.
                        // However, during "SHOWING", if a dummy is red, it might be distracting (which is the point).
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
