"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, RefreshCcw, AlertCircle, MousePointer2 } from "lucide-react";
import { motion } from "framer-motion";
import { ResultModal } from "@/components/games/ResultModal";

type GameState = "idle" | "waiting" | "now" | "tooEarly" | "result";

export default function ReactionTimePage() {
    const [state, setState] = useState<GameState>("idle");
    const [result, setResult] = useState<number>(0);
    const [highScore, setHighScore] = useState<number | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        const saved = localStorage.getItem("reaction_time_score");
        if (saved) setHighScore(parseFloat(saved));
    }, []);

    const startGame = () => {
        setState("waiting");
        const randomDelay = Math.floor(Math.random() * 3000) + 2000; // 2000-5000ms
        timerRef.current = setTimeout(() => {
            setState("now");
            startTimeRef.current = Date.now();
        }, randomDelay);
    };

    const handleClick = () => {
        if (state === "idle") {
            startGame();
        } else if (state === "waiting") {
            if (timerRef.current) clearTimeout(timerRef.current);
            setState("tooEarly");
        } else if (state === "now") {
            const endTime = Date.now();
            const time = endTime - startTimeRef.current;
            setResult(time);
            setState("result");

            // Save High Score (Lower is Better)
            if (highScore === null || time < highScore) {
                setHighScore(time);
                localStorage.setItem("reaction_time_score", time.toString());
            }

            // Send Stats
            fetch('/api/cognitive/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_type: 'reaction_time', score: time })
            }).catch(console.error);

        } else if (state === "result" || state === "tooEarly") {
            startGame();
        }
    };

    const getBackgroundColor = () => {
        switch (state) {
            case "idle":
            case "result":
            case "tooEarly":
                return "bg-slate-900";
            case "waiting":
                return "bg-rose-500";
            case "now":
                return "bg-emerald-500";
            default:
                return "bg-slate-900";
        }
    };

    return (
        <div
            className={`min-h-screen w-full flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 select-none ${getBackgroundColor()}`}
            onMouseDown={handleClick} // onMouseDown for faster reaction feel than onClick
        >
            <div className="text-white text-center max-w-md px-4">
                {state === "idle" && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <Zap className="w-24 h-24 text-yellow-400" />
                        <h1 className="text-5xl font-bold">Reaction Time</h1>
                        <p className="text-2xl opacity-80">When the red box turns green, click as quickly as you can.</p>
                        <p className="text-xl font-medium mt-4 bg-white/10 px-6 py-3 rounded-full">Click anywhere to start</p>
                    </motion.div>
                )}

                {state === "waiting" && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse" />
                        <h1 className="text-6xl font-bold">Wait for Green...</h1>
                    </div>
                )}

                {state === "now" && (
                    <div className="flex flex-col items-center gap-6">
                        <MousePointer2 className="w-24 h-24" />
                        <h1 className="text-7xl font-bold">CLICK!</h1>
                    </div>
                )}

                {state === "result" && (
                    <ResultModal
                        isOpen={state === "result"}
                        score={result}
                        unit="ms"
                        gameType="Reaction Time"
                        onRetry={startGame}
                    />
                )}

                {state === "tooEarly" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center gap-6"
                    >
                        <AlertCircle className="w-24 h-24 text-rose-500" />
                        <h1 className="text-5xl font-bold">Too Early!</h1>
                        <p className="text-2xl opacity-80">Please wait for the green color.</p>
                        <div className="flex items-center gap-2 mt-8 opacity-60 hover:opacity-100 transition-opacity">
                            <RefreshCcw className="w-6 h-6" />
                            <span className="text-xl">Click to try again</span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
