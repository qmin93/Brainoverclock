"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSchulteStore, SchulteMode } from '@/store/useSchulteStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { Hash, Zap, Shuffle as ShuffleIcon, Timer } from 'lucide-react';

export default function SchulteGame() {
    const {
        mode,
        grid,
        sequence,
        currentIndex,
        status,
        finalTime,
        setMode,
        startGame,
        clickItem,
        resetGame
    } = useSchulteStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const [currentTime, setCurrentTime] = useState(0);
    const [shake, setShake] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        if (status === 'playing') {
            startTimeRef.current = performance.now();
            timerRef.current = setInterval(() => {
                setCurrentTime(performance.now() - startTimeRef.current);
            }, 10);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [status]);

    useEffect(() => {
        if (status === 'finished') {
            const saveScore = async () => {
                const storageKey = `schulte_${mode}_score`;
                const savedMax = localStorage.getItem(storageKey);
                if (!savedMax || finalTime < parseInt(savedMax)) {
                    localStorage.setItem(storageKey, finalTime.toString());
                }

                try {
                    const res = await fetch('/api/score/schulte', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: finalTime, mode: mode })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPercentile(data.percentile);
                    }
                } catch (e) { console.error(e); }
            };
            saveScore();
        } else {
            setPercentile(undefined);
            setCurrentTime(0);
        }
    }, [status, finalTime, mode]);

    const handleItemClick = (id: string, value: string) => {
        const expected = sequence[currentIndex];
        if (value === expected) {
            clickItem(id);
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 300);
        }
    };

    const nextTarget = sequence[currentIndex];

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[600px] select-none p-4">

            {/* HUD / Settings */}
            <div className="w-full max-w-lg mb-8 space-y-4">
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Next Target</span>
                        <span className="text-5xl font-black text-slate-800 drop-shadow-sm">
                            {status === 'playing' ? nextTarget : "--"}
                        </span>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Timer className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Timer</span>
                        </div>
                        <span className="text-3xl font-mono font-bold text-slate-600">
                            {(currentTime / 1000).toFixed(2)}s
                        </span>
                    </div>
                </div>

                {status === 'idle' && (
                    <div className="grid grid-cols-3 gap-3">
                        {(['normal', 'dynamic', 'mixed'] as SchulteMode[]).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`
                                    py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-2
                                    ${mode === m
                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                        : "bg-white border-slate-200 text-slate-400 hover:border-slate-400"
                                    }
                                `}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Grid Area */}
            <div className="relative w-full max-w-lg aspect-square bg-white rounded-[2rem] shadow-2xl p-4 border border-slate-100 overflow-hidden">

                <ResultModal
                    isOpen={status === 'finished'}
                    score={Number((finalTime / 1000).toFixed(2))}
                    unit="s"
                    gameType={`Schulte (${mode})`}
                    onRetry={startGame}
                    percentile={percentile}
                />

                {status === 'idle' ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        {mode === 'normal' && <Hash className="w-16 h-16 text-slate-300 mb-4" />}
                        {mode === 'dynamic' && <ShuffleIcon className="w-16 h-16 text-indigo-400 mb-4" />}
                        {mode === 'mixed' && <Zap className="w-16 h-16 text-amber-400 mb-4" />}

                        <h1 className="text-3xl font-black mb-4 uppercase">Schulte Table</h1>
                        <p className="text-slate-500 text-sm mb-12 leading-relaxed">
                            {mode === 'normal' && "Click 1 to 25 as fast as possible. Keep your eyes centered."}
                            {mode === 'dynamic' && "Grid shuffles after every correct click. Pure visual search."}
                            {mode === 'mixed' && "Follow the pattern: 1 ➔ A ➔ 2 ➔ B ➔ ... ➔ 13."}
                        </p>

                        <button
                            onClick={startGame}
                            className="bg-slate-900 text-white font-black py-5 px-16 rounded-2xl hover:scale-102 active:scale-95 transition-all shadow-xl text-xl w-full"
                        >
                            START MISSION
                        </button>
                    </div>
                ) : (
                    <motion.div
                        animate={shake ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
                        className="grid grid-cols-5 grid-rows-5 gap-2 w-full h-full relative"
                    >
                        {/* Fixation Dot */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-200 rounded-full z-0 pointer-events-none opacity-50" />

                        <AnimatePresence>
                            {grid.map((item) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    onClick={() => handleItemClick(item.id, item.value)}
                                    className={`
                                        flex items-center justify-center rounded-xl cursor-pointer transition-all border-b-4
                                        ${item.cleared
                                            ? "bg-slate-50 border-slate-200 text-slate-200"
                                            : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 active:translate-y-1 active:border-b-0"
                                        }
                                    `}
                                >
                                    <span className="text-xl md:text-2xl font-black">{item.value}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <div className="mt-8 text-center text-slate-300 text-[10px] font-black tracking-[0.4em] uppercase">
                Peripheral Vision Protocol
            </div>
        </div>
    );
}
