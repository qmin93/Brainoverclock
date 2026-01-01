"use client";

import { useState, useEffect, useRef } from "react";
import { Hash, Play } from "lucide-react";
import { motion } from "framer-motion";
import { ResultModal } from "./ResultModal";

type GameState = "IDLE" | "SHOWING" | "INPUT" | "FEEDBACK" | "GAME_OVER";

// Default behavior is now mixed mode, so we can ignore the difficulty prop or repurpose it
// But to keep it simple and follow request, we will make "hard" (which is default) do the random switching.
interface NumberGameProps {
    difficulty?: "normal" | "hard";
}

export default function NumberGame({ difficulty = "hard" }: NumberGameProps) {
    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [level, setLevel] = useState(1);
    const [currentNumber, setCurrentNumber] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isReverseRound, setIsReverseRound] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // Using hard score key since this is the "hard/Brain Overclock" version
    const storageKey = "number_memory_hard_score";
    const gameTypeKey = "number_memory_hard";
    const gameTitle = "Number Memory (Mixed)";

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setHighScore(parseInt(saved));
    }, [storageKey]);

    useEffect(() => {
        if (gameState === "INPUT" && inputRef.current) {
            inputRef.current.focus();
        }
    }, [gameState]);

    const generateNumber = (length: number) => {
        let num = "";
        for (let i = 0; i < length; i++) {
            num += Math.floor(Math.random() * 10).toString();
        }
        return num;
    };

    const startGame = () => {
        setLevel(1);
        startTurn(1);
    };

    const startTurn = (lvl: number) => {
        const num = generateNumber(lvl);
        setCurrentNumber(num);
        setInputValue("");

        // Randomly decide mode for this turn
        const reverse = Math.random() > 0.5;
        setIsReverseRound(reverse);

        setGameState("SHOWING");

        const duration = 1000 + (lvl * 500);
        setTimeLeft(duration);

        setTimeout(() => {
            setGameState("INPUT");
        }, duration);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        let correctAnswer = currentNumber;
        if (isReverseRound) {
            correctAnswer = currentNumber.split("").reverse().join("");
        }

        if (inputValue === correctAnswer) {
            setGameState("FEEDBACK");
            setTimeout(() => {
                setLevel((l) => l + 1);
                startTurn(level + 1);
            }, 1000);
        } else {
            finishGame();
        }
    };

    const finishGame = () => {
        setGameState("GAME_OVER");
        const score = level - 1;

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem(storageKey, score.toString());
        }

        fetch("/api/cognitive/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ game_type: gameTypeKey, score: score }),
        }).catch(console.error);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4">
            <div className="absolute top-8 text-center">
                <h1 className="text-3xl font-bold flex items-center gap-3 justify-center mb-2">
                    <Hash className="w-8 h-8 text-yellow-400" />
                    {gameTitle}
                </h1>
                <p className="text-white/60">
                    Pay attention! Mode switches randomly between Forward and Reverse.
                </p>
                <p className="mt-4 text-sm font-bold uppercase tracking-widest opacity-40">
                    Best: {highScore} Digits
                </p>
            </div>

            <div className="relative w-full aspect-video flex flex-col items-center justify-center bg-slate-900/50 rounded-3xl border border-white/5 p-8 overflow-hidden shadow-2xl">
                {gameState === "IDLE" && (
                    <div className="text-center">
                        <div className="mb-8 flex flex-col gap-2">
                            <h2 className="text-9xl font-black text-white/5 select-none">123</h2>
                            <span className="text-sm font-bold uppercase tracking-widest opacity-30">or</span>
                            <h2 className="text-9xl font-black text-white/5 select-none">321</h2>
                        </div>
                        <button
                            onClick={startGame}
                            className="flex items-center gap-2 bg-yellow-500 text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-400 transition-transform hover:scale-105 mx-auto"
                        >
                            <Play className="w-5 h-5" /> Start
                        </button>
                    </div>
                )}

                {gameState === "SHOWING" && (
                    <div className="flex flex-col items-center w-full">
                        <h2 className="text-6xl md:text-8xl font-black tracking-widest mb-12">
                            {currentNumber}
                        </h2>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden max-w-sm">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: timeLeft / 1000, ease: "linear" }}
                                className="h-full bg-yellow-500"
                            />
                        </div>
                    </div>
                )}

                {gameState === "INPUT" && (
                    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full gap-8">
                        <div>
                            {isReverseRound ? (
                                <h2 className="text-3xl font-black text-red-500 animate-pulse text-center drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    ⏪ REVERSE ⏪
                                </h2>
                            ) : (
                                <h2 className="text-3xl font-black text-emerald-500 animate-bounce text-center drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                                    ⏩ FORWARD ⏩
                                </h2>
                            )}
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ""))}
                            className={`bg-transparent text-center text-5xl md:text-6xl font-black tracking-widest border-b-2 outline-none w-full max-w-lg py-4 placeholder:opacity-10 transition-colors duration-300 ${isReverseRound
                                ? "border-red-500/50 focus:border-red-500 text-red-100"
                                : "border-emerald-500/50 focus:border-emerald-500 text-emerald-100"
                                }`}
                            placeholder={level > 1 ? (isReverseRound ? "Type Backwards" : "Type Forward") : "#"}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-white/10 hover:bg-white/20 text-white px-8 py-2 rounded-lg font-bold transition-colors"
                        >
                            Submit
                        </button>
                    </form>
                )}

                {gameState === "FEEDBACK" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4">
                            <span className="text-4xl text-black">✓</span>
                        </div>
                        <h2 className="text-4xl font-bold">Level {level}</h2>
                        <p className="opacity-60">Get ready for next number...</p>
                    </motion.div>
                )}

                {gameState === "GAME_OVER" && (
                    <ResultModal
                        isOpen={gameState === "GAME_OVER"}
                        score={level - 1}
                        unit="Digits"
                        gameType={gameTitle}
                        onRetry={startGame}
                    />
                )}
            </div>
        </div>
    );
}
