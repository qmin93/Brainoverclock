"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useMathFallStore, FallingBlock, MathFallMode } from '@/store/useMathFallStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { Calculator, Type, TriangleAlert, Zap, Layers } from 'lucide-react';

export default function MathFallGame() {
    const {
        mode,
        blocks,
        score,
        lavaLevel,
        status,
        setMode,
        startGame,
        spawnBlock,
        submitAnswer,
        handleBlockFloor,
        resetGame
    } = useMathFallStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const [input, setInput] = useState('');
    const [shakeInput, setShakeInput] = useState(false);
    const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus input
    useEffect(() => {
        if (status === 'playing') {
            inputRef.current?.focus();
        }
    }, [status]);

    // Spawning Loop
    useEffect(() => {
        if (status === 'playing') {
            const spawn = () => {
                spawnBlock();
                const { level, gameSpeed } = useMathFallStore.getState();
                const delay = Math.max(500, (2000 / gameSpeed) - (level * 50));
                spawnTimerRef.current = setTimeout(spawn, delay);
            };
            spawn();
        } else {
            if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
        }
        return () => {
            if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
        };
    }, [status, spawnBlock]);

    useEffect(() => {
        if (status === 'result') {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('math_fall_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('math_fall_score', score.toString());
                }

                try {
                    const res = await fetch('/api/score/math-fall', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: score })
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
            setInput('');
        }
    }, [status, score]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = submitAnswer(input);
        if (success) {
            setInput('');
        } else {
            setShakeInput(true);
            setTimeout(() => setShakeInput(false), 200);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto h-[80vh] min-h-[600px] select-none p-4 relative font-sans">

            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-4 z-20">
                <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Live Score</span>
                    <span className="text-3xl font-black text-slate-800">{score.toLocaleString()}</span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Temp / Heat</span>
                    <div className="w-48 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <motion.div
                            animate={{ width: `${lavaLevel}%` }}
                            className="h-full bg-gradient-to-r from-orange-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                        />
                    </div>
                </div>
            </div>

            {/* Mode Selection */}
            {status === 'idle' && (
                <div className="flex gap-2 mb-8 bg-slate-100 p-1.5 rounded-2xl z-20">
                    {(['normal', 'disappearing', 'dual'] as MathFallMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${mode === m ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            )}

            {/* Game Canvas */}
            <div className="relative w-full flex-1 bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-slate-800">

                <ResultModal
                    isOpen={status === 'result'}
                    score={score}
                    unit="Pts"
                    gameType={`Arithmetic Defense (${mode})`}
                    onRetry={startGame}
                    percentile={percentile}
                />

                {status === 'idle' ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/20">
                        <div className="flex gap-4 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                                <Calculator size={32} />
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg">
                                <Zap size={32} />
                            </div>
                        </div>
                        <h1 className="text-4xl font-black text-white mb-4 tracking-tighter italic uppercase">LAVA ESCAPE</h1>
                        <p className="text-slate-400 text-sm mb-12 max-w-xs mx-auto leading-relaxed">
                            Numbers are falling into the <span className="text-orange-500 font-bold">Lava</span>!<br />
                            Every failed block <span className="text-red-500 font-bold underline">raises the level</span>. Don't drown.
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-white text-slate-900 font-black py-5 px-16 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-white/10 shadow-xl text-xl uppercase italic tracking-widest"
                        >
                            START DEFENSE
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Lanes for Dual Mode */}
                        {mode === 'dual' && (
                            <div className="absolute inset-0 flex">
                                <div className="flex-1 border-r border-white/5 bg-indigo-500/5">
                                </div>
                                <div className="flex-1 bg-rose-500/5">
                                </div>
                            </div>
                        )}

                        {/* Dead Line / Danger Zone */}
                        <div className="absolute top-[20%] left-0 right-0 h-px bg-rose-500/20 border-b border-dashed border-rose-500/50 z-10" />

                        {/* Lava Effect - RISING */}
                        <motion.div
                            animate={{
                                height: `${lavaLevel}%`,
                            }}
                            transition={{ type: "spring", stiffness: 50, damping: 20 }}
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-700 via-red-600 to-orange-500/80 z-30 pointer-events-none shadow-[0_-20px_50px_rgba(234,88,12,0.6)]"
                        >
                            {/* Realistic Surface Waves */}
                            <motion.div
                                animate={{ x: ["-10%", "0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-4 w-[120%] h-8 opacity-60 mix-blend-screen bg-repeat-x"
                                style={{ backgroundImage: "radial-gradient(ellipse at 50% 100%, #fdba74 0%, transparent 60%)", backgroundSize: "20% 100%" }}
                            />
                            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 blur-sm" />

                            <div className="absolute inset-0 flex items-center justify-center">
                                {lavaLevel > 40 && (
                                    <span className="text-white/20 text-4xl font-black italic tracking-[1em] uppercase animate-pulse">Heat Warning</span>
                                )}
                            </div>
                        </motion.div>

                        {/* Blocks */}
                        <AnimatePresence>
                            {blocks.map((block) => (
                                <FallingBlockElement
                                    key={block.id}
                                    block={block}
                                    mode={mode}
                                />
                            ))}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Input Area */}
            {status === 'playing' && (
                <form onSubmit={handleSubmit} className="w-full max-w-lg mt-6 relative">
                    <motion.div
                        animate={shakeInput ? { x: [-10, 10, -10, 10, 0] } : { x: 0 }}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="TYPE & ENTER"
                            className={`
                                w-full bg-slate-900 text-white text-center py-6 rounded-2xl border-2 transition-all text-2xl font-black placeholder:text-slate-700
                                ${shakeInput ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'border-slate-800'}
                            `}
                        />
                    </motion.div>
                </form>
            )}

        </div>
    );
}

function FallingBlockElement({ block, mode }: { block: any, mode: MathFallMode }) {
    const handleBlockFloor = useMathFallStore(s => s.handleBlockFloor);
    const lavaLevel = useMathFallStore(s => s.lavaLevel);

    // The surface of the lava is at (100 - lavaLevel)% from the top
    const lavaSurfaceY = 100 - lavaLevel;

    return (
        <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{
                y: `${lavaSurfaceY + 5}%`, // Fall slightly into the surface
                opacity: mode === 'disappearing' ? [1, 1, 0] : 1,
                scale: 1
            }}
            style={{
                left: `${block.x}%`,
                zIndex: 20
            }}
            transition={{
                duration: block.duration / 1000,
                ease: "linear",
                opacity: { times: [0, 0.5, 0.7], duration: block.duration / 1000 },
                scale: { duration: 0.3 }
            }}
            onUpdate={(latest) => {
                const yVal = typeof latest.y === 'string' ? parseFloat(latest.y) : latest.y;
                // If the block touches the rising lava surface
                if (yVal >= lavaSurfaceY) {
                    handleBlockFloor(block.id);
                }
            }}
            className="absolute -translate-x-1/2"
        >
            <div className={`
                px-8 py-4 rounded-[1.5rem] border-b-[6px] flex items-center justify-center whitespace-nowrap shadow-2xl transition-all
                ${block.type === 'math'
                    ? "bg-indigo-600 border-indigo-900 text-white"
                    : "bg-rose-600 border-rose-900 text-white"
                }
            `}>
                <span className="text-2xl md:text-4xl font-black tracking-tighter drop-shadow-md">
                    {block.expression}
                </span>
            </div>
        </motion.div>
    );
}
