"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useAimHardStore, TargetType, Target } from '@/store/useAimHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Target as TargetIcon, ShieldAlert, Skull, Crosshair } from 'lucide-react';
import { ResultModal } from './ResultModal';

export default function AimGameHard() {
    const {
        score,
        lives,
        level,
        targets,
        isPlaying,
        isGameOver,
        startGame,
        stopGame,
        spawnTarget,
        handleClick,
        gameLoopTick
    } = useAimHardStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const lastSpawnRef = useRef<number>(0);

    // Game Loop
    const animate = (time: number) => {
        if (!isPlaying) return;

        // Check expiries
        gameLoopTick(time);

        // Spawn logic
        const store = useAimHardStore.getState();
        if (time - lastSpawnRef.current > store.spawnInterval) {
            spawnTarget();
            lastSpawnRef.current = time;
        }

        requestRef.current = requestAnimationFrame(animate);
    };

    useEffect(() => {
        if (isPlaying) {
            lastSpawnRef.current = performance.now();
            requestRef.current = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopGame();
    }, []);

    // Result submission
    useEffect(() => {
        if (isGameOver) {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('aim_hard_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('aim_hard_score', score.toString());
                }

                try {
                    const res = await fetch('/api/score/aim-hard', {
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
    }, [isGameOver, score]);

    const handleContainerClick = (e: React.MouseEvent) => {
        // Punish misses?
        // Not in PRD explicitly, but good for anti-spam.
        // PRD: "인질 클릭... Life -2". 
        // Let's implement background click as harmless or accuracy penalty later.
        // For now, ignore background clicks to stick to PRD "Don't click Hostage" focus.
    };

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden cursor-crosshair select-none"
            onMouseDown={(e) => e.preventDefault()} // Prevent text selection
        >
            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
                <div className="flex flex-col gap-1">
                    <span className="text-rose-500 font-black text-4xl drop-shadow-md">{score.toLocaleString()}</span>
                    <span className="text-rose-500/50 text-sm font-bold uppercase tracking-widest">Score</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-white/30 font-mono text-sm">LEVEL {level}</span>
                    {isGameOver && <span className="text-red-500 font-bold animate-pulse">MISSION FAILED</span>}
                </div>

                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-8 h-8 flex items-center justify-center transition-all ${i < lives ? "text-emerald-400" : "text-slate-800"}`}>
                            <ShieldAlert fill={i < lives ? "currentColor" : "none"} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Game Area */}
            <div
                ref={containerRef}
                className="relative flex-1 w-full h-full"
                onMouseDown={handleContainerClick}
            >
                {/* Main Menu / Result */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
                        {isGameOver ? (
                            <ResultModal
                                isOpen={isGameOver}
                                score={score}
                                unit="Pts"
                                gameType="Hostage Rescue"
                                onRetry={startGame}
                                percentile={percentile}
                            />
                        ) : (
                            <div className="text-center">
                                <h1 className="text-6xl font-black text-rose-500 mb-4 tracking-tighter">HOSTAGE<br />PROTOCOL</h1>
                                <div className="flex items-center justify-center gap-8 mb-8 text-white/70">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(244,63,94,0.5)]">
                                            <TargetIcon size={32} />
                                        </div>
                                        <span className="font-bold">SHOOT</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                            <ShieldAlert size={32} />
                                        </div>
                                        <span className="font-bold">SAVE</span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); startGame(); }}
                                    className="bg-white text-black font-black text-xl py-4 px-12 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 mx-auto"
                                >
                                    <Crosshair /> DEPLOY
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Targets */}
                <AnimatePresence>
                    {targets.map(target => (
                        <GameTarget
                            key={target.id}
                            target={target}
                            onClick={() => handleClick(target.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

function GameTarget({ target, onClick }: { target: Target; onClick: () => void }) {
    const isEnemy = target.type === 'enemy';

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer touch-manipulation"
            style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                zIndex: 10
            }}
            onMouseDown={(e) => {
                e.stopPropagation(); // Prevent container click
                onClick();
            }}
        >
            <div className={`
                relative flex items-center justify-center rounded-full shadow-2xl transition-transform active:scale-90
                ${isEnemy
                    ? "w-24 h-24 bg-rose-500 hover:bg-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-pulse-fast border-4 border-rose-300"
                    : "w-20 h-20 bg-blue-500 hover:bg-blue-400 border-4 border-blue-300"
                }
            `}>
                {isEnemy ? (
                    <TargetIcon className="text-white w-12 h-12" />
                ) : (
                    <ShieldAlert className="text-white w-10 h-10" />
                )}
            </div>
        </motion.div>
    );
}
