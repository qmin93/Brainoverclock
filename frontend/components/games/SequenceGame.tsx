"use client";

import { useState, useEffect } from "react";
import { Tile } from "../ui/Tile";
import { Play } from "lucide-react";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "SHOWING" | "INPUT" | "GAME_OVER";

export default function SequenceGame() {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    // Current distraction tiles shown during flash
    const [distractionTiles, setDistractionTiles] = useState<number[]>([]);

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
            setDistractionTiles([]);
        };
    }, []);

    const playSequence = async (seq: number[]) => {
        setGameState("SHOWING");
        await new Promise((r) => setTimeout(r, 500));

        for (let i = 0; i < seq.length; i++) {
            const targetTile = seq[i];

            // Generate Random Dummies for THIS flash
            // "모든 단계에서 랜덤한 숫자로 반짝이게" -> Random count (e.g., 1~4)
            // Available tiles exclude the target
            const available = Array.from({ length: 9 }, (_, k) => k).filter(k => k !== targetTile);

            // Randomly shuffle available tiles
            for (let k = available.length - 1; k > 0; k--) {
                const j = Math.floor(Math.random() * (k + 1));
                [available[k], available[j]] = [available[j], available[k]];
            }

            // Pick random count (1 to 4)
            const count = Math.floor(Math.random() * 4) + 1;
            const currentDummies = available.slice(0, count);

            // Activate Target + Distractions
            setActiveTile(targetTile);
            setDistractionTiles(currentDummies);

            await new Promise((r) => setTimeout(r, 600));

            // Deactivate
            setActiveTile(null);
            setDistractionTiles([]);

            await new Promise((r) => setTimeout(r, 200));
        }

        setGameState("INPUT");
    };

    const startGame = () => {
        setSequence([]);
        setUserSequence([]);
        setLevel(1);
        setDistractionTiles([]);

        const first = Math.floor(Math.random() * 9);
        const initialSeq = [first];
        setSequence(initialSeq);

        // No pre-generated dummies needed anymore

        setTimeout(() => playSequence(initialSeq), 500);
    };

    const handleNextLevel = () => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setUserSequence([]);

        const next = Math.floor(Math.random() * 9);
        const newSeq = [...sequence, next];
        setSequence(newSeq);

        setTimeout(() => playSequence(newSeq), 1000);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "INPUT") return;

        // Note: Since dummies are purely visual distractions during SHOWING phase and change every flash,
        // there are no "dummy" tiles during INPUT phase to avoid. 
        // We only check sequence correctness.

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
                        isDummy={false}
                        isDummyActive={distractionTiles.includes(i)} // Flash random dummies
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
                        {gameState === "SHOWING" ? "Watch the white sequence..." : "Repeat the sequence"}
                    </div>
                )}
            </div>
        </div>
    );
}
