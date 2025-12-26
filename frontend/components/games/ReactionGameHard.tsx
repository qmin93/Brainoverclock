"use client";

import { useState, useRef, useEffect } from "react";
import { Zap, RefreshCcw, AlertTriangle, MousePointer2, AlertOctagon } from "lucide-react";
import { motion } from "framer-motion";
import { ResultModal } from "@/components/games/ResultModal";

type GameState = "idle" | "waiting" | "now" | "tooEarly" | "distraction" | "failed" | "result";

export default function ReactionGameHard() {
    const [state, setState] = useState<GameState>("idle");
    const [result, setResult] = useState<number>(0);
    const [highScore, setHighScore] = useState<number | null>(null);
    const [distractionColor, setDistractionColor] = useState<"blue" | "orange">("blue");

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const distractionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        const saved = localStorage.getItem("reaction_time_hard_score");
        if (saved) setHighScore(parseFloat(saved));
        return () => clearAllTimers();
    }, []);

    useEffect(() => {
        if (state === "now") {
            startTimeRef.current = performance.now();
        }
    }, [state]);

    const clearAllTimers = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (distractionTimerRef.current) clearTimeout(distractionTimerRef.current);
    };

    const startGame = () => {
        setState("waiting");
        startTurn();
    };

    const startTurn = () => {
        const randomDelay = Math.floor(Math.random() * 2000) + 1500; // 1.5s - 3.5s wait

        timerRef.current = setTimeout(() => {
            // Decision: 50% Real (Green), 50% Distraction (Blue/Orange)
            const isDistraction = Math.random() < 0.5;

            if (isDistraction) {
                triggerDistraction();
            } else {
                setState("now");
            }
        }, randomDelay);
    };

    const triggerDistraction = () => {
        const color = Math.random() < 0.5 ? "blue" : "orange";
        setDistractionColor(color);
        setState("distraction");

        // If user survives 0.6s - 1.2s without clicking, go back to waiting (Red)
        const duration = Math.random() * 600 + 600;
        distractionTimerRef.current = setTimeout(() => {
            setState("waiting");
            startTurn(); // Roll again
        }, duration);
    };

    const handleClick = () => {
        if (state === "idle" || state === "result" || state === "failed" || state === "tooEarly") {
            startGame();
            return;
        }

        if (state === "waiting") {
            clearAllTimers();
            setState("tooEarly");
        } else if (state === "distraction") {
            clearAllTimers();
            setState("failed");
        } else if (state === "now") {
            const endTime = performance.now();
            const time = Math.round(endTime - startTimeRef.current);
            setResult(time);
            setState("result");

            if (highScore === null || time < highScore) {
                setHighScore(time);
                localStorage.setItem("reaction_time_hard_score", time.toString());
            }

            fetch('/api/cognitive/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ game_type: 'reaction_time_hard', score: time })
            }).catch(console.error);
        }
    };

    const getBackgroundColor = () => {
        switch (state) {
            case "idle": return "bg-slate-900";
            case "waiting": return "bg-rose-600";
            case "now": return "bg-emerald-500";
            case "distraction": return distractionColor === "blue" ? "bg-blue-500" : "bg-orange-500";
            case "failed":
            case "tooEarly": return "bg-slate-800";
            case "result": return "bg-slate-900";
            default: return "bg-slate-900";
        }
    };

    return (
        <div
            className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 select-none ${getBackgroundColor()}`}
            onMouseDown={handleClick}
        >
            <div className="text-white text-center max-w-2xl px-4 pointer-events-none">
                {state === "idle" && (
                    <div className="flex flex-col items-center gap-6">
                        <Zap className="w-24 h-24 text-rose-500" />
                        <h1 className="text-5xl font-bold">Reaction Time (Hard)</h1>
                        <p className="text-2xl opacity-80 max-w-md">
                            Click on <span className="text-emerald-400 font-bold">GREEN</span> only.<br />
                            Ignore <span className="text-blue-400 font-bold">BLUE</span> and <span className="text-orange-400 font-bold">ORANGE</span>.
                        </p>
                        <p className="text-xl font-medium mt-4 bg-white/10 px-6 py-3 rounded-full">Click to start</p>
                    </div>
                )}

                {state === "waiting" && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse" />
                        <h1 className="text-6xl font-bold">Wait for Green...</h1>
                    </div>
                )}

                {state === "distraction" && (
                    <div className="flex flex-col items-center gap-6">
                        <AlertOctagon className="w-24 h-24 text-white" />
                        <h1 className="text-6xl font-bold">DON'T CLICK!</h1>
                    </div>
                )}

                {state === "now" && (
                    <div className="flex flex-col items-center gap-6">
                        <MousePointer2 className="w-24 h-24" />
                        <h1 className="text-7xl font-bold">CLICK!</h1>
                    </div>
                )}

                {state === "failed" && (
                    <div className="flex flex-col items-center gap-6">
                        <AlertTriangle className="w-24 h-24 text-orange-500" />
                        <h1 className="text-5xl font-bold">Distracted!</h1>
                        <p className="text-2xl opacity-80">You clicked on the wrong color.</p>
                        <div className="flex items-center gap-2 mt-8 opacity-60">
                            <RefreshCcw className="w-6 h-6" />
                            <span className="text-xl">Click to try again</span>
                        </div>
                    </div>
                )}

                {state === "tooEarly" && (
                    <div className="flex flex-col items-center gap-6">
                        <AlertTriangle className="w-24 h-24 text-rose-500" />
                        <h1 className="text-5xl font-bold">Too Early!</h1>
                        <p className="text-2xl opacity-80">Wait for the Green screen.</p>
                        <div className="flex items-center gap-2 mt-8 opacity-60">
                            <span className="text-xl">Click to try again</span>
                        </div>
                    </div>
                )}

                {state === "result" && (
                    <ResultModal
                        isOpen={state === "result"}
                        score={result}
                        unit="ms"
                        gameType="Reaction Time (Hard)"
                        onRetry={startGame}
                    />
                )}
            </div>
        </div>
    );
}
