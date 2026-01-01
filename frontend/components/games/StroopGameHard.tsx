"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useStroopHardStore, ColorType } from '@/store/useStroopHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { Shuffle } from 'lucide-react';

const COLOR_MAP: Record<ColorType, { name: string, hex: string }> = {
    red: { name: "RED", hex: "#ef4444" },
    blue: { name: "BLUE", hex: "#3b82f6" },
    green: { name: "GREEN", hex: "#22c55e" },
    yellow: { name: "YELLOW", hex: "#eab308" }
};

export default function StroopGameHard() {
    const {
        currentText,
        currentColor,
        currentRule,
        score,
        level,
        status,
        timeLeft,
        maxTime,
        startGame,
        handleAnswer,
        tick,
        resetGame
    } = useStroopHardStore();

    useEffect(() => {
        resetGame();
        return () => resetGame();
    }, [resetGame]);

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (status === 'playing') {
            timerRef.current = setInterval(() => {
                tick();
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status, tick]);

    useEffect(() => {
        if (status === 'result') {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('stroop_hard_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('stroop_hard_score', score.toString());
                }

                try {
                    const res = await fetch('/api/score/stroop-hard', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: score })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPercentile(data.percentile);
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            saveScore();
        } else {
            setPercentile(undefined);
        }
    }, [status, score]);

    const handleKey = (e: KeyboardEvent) => {
        if (status !== 'playing') return;
        const keyMap: Record<string, ColorType> = {
            'q': 'red', 'w': 'blue', 'e': 'green', 'r': 'yellow',
            'ArrowLeft': 'red', 'ArrowUp': 'blue', 'ArrowDown': 'green', 'ArrowRight': 'yellow'
        };
        const choice = keyMap[e.key];
        if (choice) handleAnswer(choice);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [status, handleAnswer]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[600px] select-none">
            {/* Rule Banner */}
            <div className="w-full max-w-lg mb-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentRule}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`w-full py-4 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-2xl border-4 ${currentRule === 'match_color'
                            ? 'bg-blue-600 border-blue-400 text-white'
                            : 'bg-orange-600 border-orange-400 text-white'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Shuffle className="w-6 h-6 animate-spin-slow" />
                            <span className="text-2xl font-black uppercase tracking-tighter">
                                {currentRule === 'match_color' ? "COLOR" : "WORD"}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold opacity-80 tracking-[0.3em]">MISSION UPDATE</span>
                            {status === 'playing' && (
                                <span className="bg-white/20 px-3 py-0.5 rounded-full text-[10px] font-black">LV. {level}</span>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Timer Bar */}
                <div className="w-full h-4 bg-slate-200 rounded-full mt-6 overflow-hidden shadow-inner border-2 border-slate-100">
                    <motion.div
                        animate={{ width: `${(timeLeft / maxTime) * 100}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                        className={`h-full shadow-[0_0_15px_rgba(34,197,94,0.5)] ${timeLeft < 0.5 ? 'bg-red-500' : 'bg-emerald-400'}`}
                    />
                </div>
            </div>

            {/* Game Canvas */}
            <div className="relative w-full max-w-lg aspect-square bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                <ResultModal
                    isOpen={status === 'result'}
                    score={score}
                    unit="Pts"
                    gameType="Chaos Stroop"
                    onRetry={startGame}
                    percentile={percentile}
                />

                {status === 'idle' ? (
                    <div className="text-center p-8">
                        <h1 className="text-4xl font-black text-slate-800 mb-6">CHAOS STROOP</h1>
                        <p className="text-slate-500 mb-8 leading-relaxed font-medium">
                            Rules switch between <span className="text-blue-500 font-bold underline">COLOR</span> and <span className="text-orange-500 font-bold underline">WORD</span>.<br />
                            Fast reaction is mandatory.<br />
                            One mistake = Sudden Death.
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-slate-900 text-white font-black py-4 px-12 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl text-xl"
                        >
                            START CHAOS
                        </button>
                    </div>
                ) : status === 'playing' ? (
                    <motion.div
                        key={score}
                        initial={{ scale: 0.5, opacity: 0, x: (Math.random() - 0.5) * 100, y: (Math.random() - 0.5) * 100 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            x: 0,
                            y: 0,
                            transition: { type: "spring", damping: 10 }
                        }}
                        style={{ color: COLOR_MAP[currentColor].hex }}
                        className="text-7xl md:text-8xl font-black italic drop-shadow-sm select-none"
                    >
                        {COLOR_MAP[currentText].name}
                    </motion.div>
                ) : null}
            </div>

            {/* Controls */}
            {status === 'playing' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full max-w-2xl px-4">
                    {(Object.keys(COLOR_MAP) as ColorType[]).map((col) => (
                        <button
                            key={col}
                            onClick={() => handleAnswer(col)}
                            className="h-20 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg border-b-4 border-black/20"
                            style={{ backgroundColor: COLOR_MAP[col].hex }}
                        >
                            <span className="text-white font-black text-2xl drop-shadow-md">
                                {COLOR_MAP[col].name[0]}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="mt-8 flex gap-8 items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                <div className="flex flex-col items-center">
                    <span>Score</span>
                    <span className="text-2xl text-slate-800">{score.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
