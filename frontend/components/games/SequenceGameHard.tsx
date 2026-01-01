"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "SHOWING" | "INPUT" | "GAME_OVER";

export default function SequenceGameHard() {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [activeTile, setActiveTile] = useState<number | null>(null);
    const [distractorTile, setDistractorTile] = useState<number | null>(null);
    const [level, setLevel] = useState(1);
    const [highScore, setHighScore] = useState(0);
    const [percentile, setPercentile] = useState<number | undefined>(undefined);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem("sequence_memory_hard_score");
        if (saved) setHighScore(parseInt(saved));
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    const playSequence = async (seq: number[]) => {
        setGameState("SHOWING");
        await new Promise((r) => setTimeout(r, 800));

        for (let i = 0; i < seq.length; i++) {
            // Real Flash
            setActiveTile(seq[i]);

            // Randomly trigger a distractor during or just after the real flash
            const triggerDistractor = Math.random() < 0.7; // 70% chance of distractor per step
            if (triggerDistractor) {
                setTimeout(() => {
                    let dIndex;
                    do {
                        dIndex = Math.floor(Math.random() * 9);
                    } while (dIndex === seq[i]); // Don't distractor the real tile
                    setDistractorTile(dIndex);
                    setTimeout(() => setDistractorTile(null), 400);
                }, 100);
            }

            await new Promise((r) => setTimeout(r, 600)); // Real flash duration
            setActiveTile(null);
            await new Promise((r) => setTimeout(r, 200)); // Gap
        }

        setGameState("INPUT");
    };

    const startGame = () => {
        setSequence([]);
        setUserSequence([]);
        setLevel(1);
        setPercentile(undefined);
        const first = Math.floor(Math.random() * 9);
        setSequence([first]);
        playSequence([first]);
    };

    const handleNextLevel = () => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setUserSequence([]);
        const next = Math.floor(Math.random() * 9);
        const newSeq = [...sequence, next];
        setSequence(newSeq);
        setTimeout(() => playSequence(newSeq), 800);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== "INPUT") return;

        // Visual feedback
        setActiveTile(index);
        setTimeout(() => setActiveTile(null), 200);

        const newUserSeq = [...userSequence, index];
        setUserSequence(newUserSeq);

        const checkIndex = newUserSeq.length - 1;
        if (newUserSeq[checkIndex] !== sequence[checkIndex]) {
            handleGameOver();
        } else if (newUserSeq.length === sequence.length) {
            handleNextLevel();
        }
    };

    const handleGameOver = async () => {
        setGameState("GAME_OVER");
        const finalScore = level - 1;

        if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem("sequence_memory_hard_score", finalScore.toString());
        }

        // API Call for analysis & leaderboard
        try {
            const username = localStorage.getItem('brain_username') || 'Anonymous';
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';
            const res = await fetch(`${apiUrl}/api/score/sequence-hard`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: finalScore,
                    username: username
                })
            });
            if (res.ok) {
                const data = await res.json();
                setPercentile(data.percentile);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col items-center gap-12 w-full max-w-2xl">
            {/* Header Area */}
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-rose-400 text-xs font-black uppercase tracking-widest">Hard Mode (Spatial Distraction)</span>
                </div>
                <div>
                    <h2 className="text-5xl font-black text-white leading-none">LEVEL {level}</h2>
                    <p className="text-slate-500 mt-2 font-mono">BEST: {highScore}</p>
                </div>
            </div>

            {/* Grid Area */}
            <div className="relative p-6 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl">
                <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <motion.div
                            key={i}
                            whileHover={gameState === "INPUT" ? { scale: 1.05 } : {}}
                            whileTap={gameState === "INPUT" ? { scale: 0.95 } : {}}
                            onClick={() => handleTileClick(i)}
                            className={`
                                w-24 h-24 sm:w-32 sm:h-32 rounded-2xl cursor-pointer transition-all duration-150 border-4
                                ${activeTile === i
                                    ? "bg-white border-white scale-105 shadow-[0_0_40px_rgba(255,255,255,0.8)] z-10"
                                    : distractorTile === i
                                        ? "bg-rose-500 border-rose-400 scale-105 shadow-[0_0_40px_rgba(244,63,94,0.8)] z-10"
                                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600"
                                }
                                ${gameState !== "INPUT" ? "pointer-events-none" : ""}
                            `}
                        />
                    ))}
                </div>

                {/* Status Overlay */}
                <AnimatePresence>
                    {(gameState === "IDLE" || gameState === "GAME_OVER") && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-[2rem]"
                        >
                            {gameState === "IDLE" && (
                                <button
                                    onClick={startGame}
                                    className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95"
                                >
                                    <Play className="w-6 h-6 fill-current" />
                                    START CHALLENGE
                                </button>
                            )}
                            {gameState === "GAME_OVER" && (
                                <ResultModal
                                    isOpen={gameState === "GAME_OVER"}
                                    score={level - 1}
                                    unit="Level"
                                    gameType="Sequence Memory Hard"
                                    percentile={percentile}
                                    onRetry={startGame}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Instruction Logic */}
            <div className="h-20 flex flex-col items-center justify-center text-center px-4">
                {gameState === "SHOWING" && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="text-indigo-400 font-black animate-pulse uppercase tracking-[0.2em] text-sm">Watch closely</span>
                        <p className="text-slate-500 text-xs">Ignore the <span className="text-rose-500 font-bold underline">RED</span> distractors!</p>
                    </motion.div>
                )}
                {gameState === "INPUT" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        <span className="text-emerald-400 font-black uppercase tracking-[0.2em] text-sm">Your Turn</span>
                        <p className="text-slate-500 text-xs">Sequence: {userSequence.length} / {sequence.length}</p>
                    </motion.div>
                )}
                {gameState === "IDLE" && (
                    <p className="text-slate-400 text-sm max-w-xs">
                        A memory test under pressure. Tiles will flash white.
                        Ignore any <span className="text-rose-500 font-bold">RED</span> flashes.
                    </p>
                )}
            </div>
        </div>
    );
}
