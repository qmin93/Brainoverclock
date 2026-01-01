"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAimHardStore } from '@/store/useAimHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Target as TargetIcon, ShieldAlert, Zap, Skull } from 'lucide-react';
import { ResultModal } from './ResultModal';

type TargetType = 'ENEMY' | 'FRIEND';

interface TargetEntity {
    id: number;
    x: number; // 0-100 %
    y: number; // 0-100 %
    vx: number;
    vy: number;
    size: number; // 1.0 down to 0
    type: TargetType;
    createdAt: number;
}

export default function AimGameHard() {
    const {
        score,
        lives,
        level,
        isPlaying,
        isGameOver,
        startGame,
        stopGame,
        setGameOver,
        addScore,
        loseLife
    } = useAimHardStore();

    const [targets, setTargets] = useState<TargetEntity[]>([]);
    const [shake, setShake] = useState(false);
    const [clickEffect, setClickEffect] = useState<{ x: number, y: number, id: number } | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<number>(0);
    const targetsRef = useRef<TargetEntity[]>([]);
    const nextIdRef = useRef(0);
    const lastTimeRef = useRef(0);

    // Difficulty Settings based on Level
    const getMaxTargets = () => Math.min(5, 3 + Math.floor((level - 1) / 3)); // 3 to 5
    const getSpeedBase = () => 0.15 + (level * 0.03); // increasing speed
    const getShrinkRate = () => 0.003 + (level * 0.0005); // increasing shrink speed

    const spawnTarget = useCallback(() => {
        const id = nextIdRef.current++;
        const type: TargetType = Math.random() < 0.3 ? 'FRIEND' : 'ENEMY'; // 30% chance of hostage

        // Random Position (10% to 90% to avoid edges)
        const x = 10 + Math.random() * 80;
        const y = 10 + Math.random() * 80;

        // Random Velocity vector
        const angle = Math.random() * Math.PI * 2;
        const speed = getSpeedBase() * (0.8 + Math.random() * 0.4); // Variance
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const newTarget: TargetEntity = {
            id,
            x,
            y,
            vx,
            vy,
            size: 1.0,
            type,
            createdAt: performance.now()
        };

        targetsRef.current.push(newTarget);
    }, [level]);

    const gameLoop = useCallback((time: number) => {
        if (!isPlaying || isGameOver) return;

        const deltaTime = time - lastTimeRef.current;
        lastTimeRef.current = time;

        const currentTargets = targetsRef.current;
        const maxTargets = getMaxTargets();
        const shrink = getShrinkRate(); // Shrink per frame (assuming 60fps nominal, better use deltaTime but keep simple for now)

        // 1. Spawn needed?
        if (currentTargets.length < maxTargets) {
            // Chance to spawn per frame to stagger them naturally
            if (Math.random() < 0.05) {
                spawnTarget();
            }
        }

        // 2. Physics & Logic
        // We iterate backwards to allow removal
        for (let i = currentTargets.length - 1; i >= 0; i--) {
            const t = currentTargets[i];

            // Move
            t.x += t.vx * (deltaTime / 16); // Normalize to ~60fps
            t.y += t.vy * (deltaTime / 16);

            // Bounce
            if (t.x <= 5 || t.x >= 95) t.vx *= -1;
            if (t.y <= 5 || t.y >= 95) t.vy *= -1;

            // Shrink
            t.size -= shrink * (deltaTime / 16);

            // Check Life
            if (t.size <= 0) {
                // Remove
                currentTargets.splice(i, 1);

                // Penalty if ENEMY missed
                if (t.type === 'ENEMY') {
                    loseLife(1); // Combo breaker
                }
                // Friend disappearing is fine/good.
            }
        }

        // Update State for Render
        setTargets([...currentTargets]);

        requestRef.current = requestAnimationFrame(gameLoop);
    }, [isPlaying, isGameOver, level, loseLife, spawnTarget]);

    useEffect(() => {
        if (isPlaying) {
            targetsRef.current = [];
            lastTimeRef.current = performance.now();
            spawnTarget(); // Initial spawn
            requestRef.current = requestAnimationFrame(gameLoop);
        } else {
            cancelAnimationFrame(requestRef.current);
        }
        return () => cancelAnimationFrame(requestRef.current);
    }, [isPlaying, gameLoop, spawnTarget]);

    // Handle Click
    const handleTargetClick = (targetId: number, e: React.MouseEvent) => {
        e.stopPropagation();

        // Find in ref to be accurate
        const index = targetsRef.current.findIndex(t => t.id === targetId);
        if (index === -1) return;

        const target = targetsRef.current[index];

        // Remove immediately
        targetsRef.current.splice(index, 1);
        setTargets([...targetsRef.current]); // Force render update

        // Logic
        if (target.type === 'ENEMY') {
            // Success
            // Bonus for small size? PRD option.
            const sizeBonus = target.size < 0.5 ? 50 : 0;
            addScore(100 + sizeBonus);

            // Effect
            setClickEffect({ x: e.clientX, y: e.clientY, id: Date.now() });

            // Immediate respawn logic handled by loop
        } else {
            // FRIENLY FIRE!
            addScore(-500);
            loseLife(2);
            triggerShake();
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
    };

    // Save Score
    useEffect(() => {
        if (isGameOver) {
            const save = async () => {
                try {
                    const savedMax = localStorage.getItem('aim_hard_score');
                    if (!savedMax || score > parseInt(savedMax)) {
                        localStorage.setItem('aim_hard_score', score.toString());
                    }
                    // Submit to API if needed (omitted for brevity standard logic)
                } catch (e) { }
            };
            save();
        }
    }, [isGameOver, score]);

    return (
        <div className={`relative w-full h-full flex flex-col bg-slate-950 overflow-hidden select-none ${shake ? "animate-shake bg-red-950/20" : ""}`}
            onMouseDown={(e) => e.preventDefault()}>

            {/* Shake Animation Style */}
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px) rotate(-2deg); }
                    75% { transform: translateX(10px) rotate(2deg); }
                }
                .animate-shake {
                    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
                }
            `}</style>

            {/* HUD */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-30 pointer-events-none">
                <div className="flex flex-col gap-1">
                    <span className="text-rose-500 font-black text-4xl drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                        {score.toLocaleString()}
                    </span>
                    <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Chaos Hunter</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-white/30 font-mono font-bold text-xl">LEVEL {level}</span>
                </div>

                <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`transition-all duration-300 ${i < lives ? "scale-100 opacity-100" : "scale-50 opacity-20 grayscale"}`}>
                            <ShieldAlert
                                className={`w-8 h-8 ${i < lives ? "text-emerald-400 fill-emerald-400/20" : "text-slate-700"}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Game Area */}
            <div ref={containerRef} className="relative flex-1 w-full h-full">

                {/* Menu / Game Over */}
                {!isPlaying && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                        {isGameOver ? (
                            <ResultModal
                                isOpen={isGameOver}
                                score={score}
                                unit="Pts"
                                gameType="Chaos Hunter"
                                onRetry={startGame}
                            />
                        ) : (
                            <div className="text-center animate-in fade-in zoom-in duration-300">
                                <h1 className="text-6xl font-black text-white mb-2 tracking-tighter">CHAOS HUNTER</h1>
                                <p className="text-rose-400 font-bold mb-8 uppercase tracking-widest">Dynamic Aim Training</p>

                                <div className="grid grid-cols-2 gap-8 mb-12 max-w-md mx-auto">
                                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-rose-500/30 flex flex-col items-center">
                                        <TargetIcon className="w-12 h-12 text-rose-500 mb-2" />
                                        <span className="text-rose-200 font-bold">SHOOT</span>
                                        <span className="text-white/40 text-xs mt-1">Red Targets</span>
                                    </div>
                                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-500/30 flex flex-col items-center">
                                        <ShieldAlert className="w-12 h-12 text-emerald-500 mb-2" />
                                        <span className="text-emerald-200 font-bold">SAVE</span>
                                        <span className="text-white/40 text-xs mt-1">Green Hostages</span>
                                    </div>
                                </div>

                                <button
                                    onClick={startGame}
                                    className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xl py-4 px-16 rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(225,29,72,0.4)]"
                                >
                                    DEPLOY
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Targets Render */}
                <AnimatePresence>
                    {targets.map(target => (
                        <div
                            key={target.id}
                            onMouseDown={(e) => handleTargetClick(target.id, e)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair touch-manipulation group"
                            style={{
                                left: `${target.x}%`,
                                top: `${target.y}%`,
                                width: '100px', // Hitbox size
                                height: '100px',
                                zIndex: 10
                            }}
                        >
                            {/* Inner Visual - shrinking */}
                            <div
                                className={`
                                    absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center
                                    transition-colors
                                    ${target.type === 'ENEMY'
                                        ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)] border-2 border-rose-300'
                                        : 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)] border-2 border-emerald-300'
                                    }
                                `}
                                style={{
                                    width: `${target.size * 80}px`, // Max visual size 80px
                                    height: `${target.size * 80}px`,
                                    opacity: 0.8 + (target.size * 0.2)
                                }}
                            >
                                {target.type === 'ENEMY' ? (
                                    <TargetIcon size={target.size * 40} className="text-rose-950" strokeWidth={3} />
                                ) : (
                                    <ShieldAlert size={target.size * 40} className="text-emerald-950" strokeWidth={3} />
                                )}
                            </div>

                            {/* Ring Indicator (Life) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50 rotate-90" viewBox="0 0 100 100">
                                <circle
                                    cx="50" cy="50" r="46"
                                    fill="none"
                                    stroke={target.type === 'ENEMY' ? '#fda4af' : '#6ee7b7'}
                                    strokeWidth="2"
                                    strokeDasharray="289"
                                    strokeDashoffset={289 * (1 - target.size)}
                                // Make it shrink visually matching life
                                />
                            </svg>
                        </div>
                    ))}
                </AnimatePresence>

                {/* Click Particles (Simple) */}
                {clickEffect && (
                    <div
                        key={clickEffect.id}
                        className="absolute w-4 h-4 rounded-full bg-white pointer-events-none animate-ping"
                        style={{ left: clickEffect.x, top: clickEffect.y }}
                    />
                )}
            </div>
        </div>
    );
}
