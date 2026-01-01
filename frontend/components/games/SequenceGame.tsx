"use client";

import { useState, useEffect } from "react";
import { Tile } from "../ui/Tile";
import { Play } from "lucide-react";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "SHOWING" | "INPUT" | "GAME_OVER";

export default function SequenceGame() {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [dummies, setDummies] = useState<number[]>([]);
    const [dummyFlash, setDummyFlash] = useState(false); // Controls simultaneous red flash
    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(0);

    // Initial Load & Cleanup
    useEffect(() => {
        const saved = localStorage.getItem("sequence_memory_score");
        if (saved) setHighScore(parseInt(saved));

        return () => {
            setGameState("IDLE");
            setSequence([]);
            setUserSequence([]);
            setDummies([]);
            setDummyFlash(false);
        };
    }, []);

    const addDummies = (currentSeq: number[], currentDummies: number[]) => {
        const occupied = new Set([...currentSeq, ...currentDummies]);
        const available = Array.from({ length: 9 }, (_, i) => i).filter(i => !occupied.has(i));

        if (available.length === 0) return currentDummies;

        // Add 1 new dummy per level, or keep filling until some limit?
        // "단계를 거듭될 수록 추가" -> Just adding 1 more is good progression.
        // But let's add 1-2 randomly to spice it up.

        const countToAdd = 1;
        const newDummies = [...currentDummies];

        for (let k = 0; k < countToAdd; k++) {
            if (available.length === 0) break;
            const randIdx = Math.floor(Math.random() * available.length);
            newDummies.push(available[randIdx]);
            available.splice(randIdx, 1);
        }

        return newDummies;
    };

    const playSequence = async (seq: number[]) => {
        setGameState("SHOWING");
        await new Promise((r) => setTimeout(r, 500));

        for (let i = 0; i < seq.length; i++) {
            setActiveTile(seq[i]);
            setDummyFlash(true); // Flash dummies simultaneously

            await new Promise((r) => setTimeout(r, 600));

            setActiveTile(null);
            setDummyFlash(false);

            await new Promise((r) => setTimeout(r, 200));
        }

        setGameState("INPUT");
    };

    const startGame = () => {
        setSequence([]);
        setUserSequence([]);
        setLevel(1);
        setDummies([]); // Reset dummies on new game

        const first = Math.floor(Math.random() * 9);
        const initialSeq = [first];
        setSequence(initialSeq);

        // Initial Dummy Generation (Start with 1 dummy)
        const initialDummies = addDummies(initialSeq, []);
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

        // Add more dummies to existing ones
        const updatedDummies = addDummies(newSeq, dummies);
        setDummies(updatedDummies);

        setTimeout(() => playSequence(newSeq), 1000);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "INPUT") return;

        // Check Dummy
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
                        isDummy={false} // Don't show dim red normally
                        isDummyActive={dummies.includes(i) && dummyFlash} // Only show bright red when flashing
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
                        score={level - 1}
                        unit="Level"
                        gameType="Sequence Memory"
                        onRetry={startGame}
                    />
                )}
                {(gameState === "SHOWING" || gameState === "INPUT") && (
                    <div className="text-white/50 text-sm">
                        {gameState === "SHOWING" ? "Watch the sequence (ignore red)..." : "Repeat the sequence"}
                    </div>
                )}
            </div>
        </div>
    );
}
