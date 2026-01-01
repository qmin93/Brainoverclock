"use client";

import React, { useEffect, useState } from 'react';
import { useChimpHardStore, Block } from '@/store/useChimpHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { ScanFace, RotateCw, ArrowLeftRight, Bomb } from 'lucide-react';

export default function ChimpGameHard() {
    const {
        level,
        score,
        lives,
        phase,
        blocks,
        gridSize,
        rotation,
        isReverse,
        startGame,
        startRound,
        startAction,
        clickBlock
    } = useChimpHardStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);

    // Initial Start
    useEffect(() => {
        // Reset purely on load
        useChimpHardStore.getState().resetGame();

        // Reset on cleanup (exit)
        return () => {
            useChimpHardStore.getState().resetGame();
        }
    }, []);

    // Phase Management
    useEffect(() => {
        if (phase === 'INSTRUCTION') {
            const timer = setTimeout(() => {
                useChimpHardStore.setState({ phase: 'MEMORIZE' });
            }, 2000); // 2s instruction
            return () => clearTimeout(timer);
        }
        if (phase === 'MEMORIZE') {
            // Memory time based on item count? (1s per item roughly?)
            // Or fixed + scaling.
            const count = blocks.filter(b => !b.isDummy).length;
            const duration = Math.max(2000, count * 800);

            const timer = setTimeout(() => {
                startAction();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [phase, blocks, startAction]);

    // Save Score
    useEffect(() => {
        if (phase === 'GAME_OVER') {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('chimp_hard_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('chimp_hard_score', score.toString());
                }

                // API Call
                try {
                    const username = localStorage.getItem('brain_username') || 'Anonymous';
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';
                    await fetch(`${apiUrl}/api/score/chimp-hard`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            score: score,
                            username: username
                        })
                    });
                } catch (err) {
                    console.error("Failed to save score:", err);
                }
            };
            saveScore();
        }
    }, [phase, score]);

    // Grid Calculation
    // We use % for positioning within the square container
    const cellSize = 100 / gridSize;

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[600px] select-none">

            <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-2 text-indigo-500 mb-2">
                    <ScanFace size={32} />
                    <h1 className="text-3xl font-black tracking-tight">SPATIAL CHAOS</h1>
                </div>
                <p className="text-slate-400 font-bold">Mental Rotation & Reverse Memory</p>
            </div>

            {/* HUD */}
            <div className="flex justify-between w-full max-w-lg mb-4 text-xl font-bold text-slate-700 px-4">
                <div>SCORE: <span className="text-indigo-600">{score}</span></div>
                <div>LEVEL: <span className="text-indigo-600">{level}</span></div>
            </div>

            {/* Game Board Container */}
            <div className="relative w-full max-w-[500px] aspect-square bg-slate-900 rounded-xl shadow-2xl overflow-hidden border-4 border-slate-800">

                {/* Result Modal */}
                <ResultModal
                    isOpen={phase === 'GAME_OVER'}
                    score={score}
                    unit="Pts"
                    gameType="Spatial Chaos"
                    onRetry={startGame}
                />

                {/* IDLE / START */}
                {phase === 'IDLE' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50 text-white">
                        <h2 className="text-4xl font-black text-indigo-400 mb-4">READY?</h2>
                        <ul className="text-left space-y-2 mb-8 text-sm text-slate-300">
                            <li>🧠 <strong>Memorize</strong> positions</li>
                            <li>🔄 <strong>Rotate</strong> map in your head</li>
                            <li>🔙 <strong>Reverse</strong> order if needed</li>
                            <li>💣 <strong>Avoid</strong> decoys</li>
                        </ul>
                        <button
                            onClick={startGame}
                            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105"
                        >
                            INITIATE
                        </button>
                    </div>
                )}

                {/* INSTRUCTION OVERLAY */}
                {phase === 'INSTRUCTION' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-40">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col gap-6 items-center"
                        >
                            {/* Rotation Info */}
                            {rotation > 0 ? (
                                <div className="flex items-center gap-4 text-rose-400">
                                    <RotateCw size={64} className="animate-spin-slow" />
                                    <span className="text-4xl font-black">{rotation}° ROTATION</span>
                                </div>
                            ) : (
                                <div className="text-emerald-400 text-2xl font-bold">NO ROTATION</div>
                            )}

                            {/* Reverse Info */}
                            {isReverse ? (
                                <div className="flex items-center gap-4 text-amber-400">
                                    <ArrowLeftRight size={64} />
                                    <span className="text-4xl font-black">REVERSE ORDER</span>
                                </div>
                            ) : (
                                <div className="text-emerald-400 text-2xl font-bold">NORMAL ORDER</div>
                            )}

                            {/* Decoy Info */}
                            <div className="flex items-center gap-2 text-slate-500 text-sm mt-4">
                                <Bomb size={16} />
                                <span>Watch out for decoys</span>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* BOARD CONTENT */}
                <div className="relative w-full h-full p-4">
                    <AnimatePresence>
                        {blocks.map((block) => {
                            if (!block.isVisible) return null;

                            // Visuals
                            const isRevealed = phase === 'MEMORIZE' || phase === 'GAME_OVER';
                            const isAction = phase === 'ACTION';

                            return (
                                <motion.div
                                    key={block.id}
                                    layout // We use layout animation for smooth transitions if needed, but we want instant logic
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    className={`absolute flex items-center justify-center rounded-lg shadow-md cursor-pointer transition-colors
                                        ${isAction
                                            ? "bg-white hover:bg-slate-200 border-2 border-slate-300" // Covered
                                            : block.isDummy
                                                ? "bg-white text-rose-500 border-2 border-rose-200" // Dummy revealed
                                                : "bg-indigo-500 text-white border-2 border-indigo-400" // Target revealed
                                        }
                                    `}
                                    style={{
                                        width: `${cellSize - 2}%`, // -2% for gap
                                        height: `${cellSize - 2}%`,
                                        left: `${block.x * cellSize + 1}%`,
                                        top: `${block.y * cellSize + 1}%`
                                    }}
                                    onClick={() => phase === 'ACTION' && clickBlock(block.id)}
                                >
                                    {isRevealed && (
                                        <span className="text-2xl font-black">
                                            {block.value}
                                        </span>
                                    )}
                                    {/* Subtle hint for dummy in Action phase? No, PRD says impossible to distinguish usually. 
                                        But PRD also said "미세하게 붉은색". Let's add subtle hint on hover or border.
                                        But wait, if it's covered, it should be hard.
                                        Let's keep it indistinguishable when covered for Hard Mode.
                                    */}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Glitch Effect during Transform */}
                    {phase === 'ACTION' && (
                        <motion.div
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-white pointer-events-none"
                        />
                    )}
                </div>

            </div>
        </div>
    );
}
