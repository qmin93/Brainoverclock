"use client";

import React, { useEffect, useState } from 'react';
import { useVisualHardStore } from '@/store/useVisualHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { RotateCw, RotateCcw, ArrowUpDown } from 'lucide-react';

export default function VisualGameHard() {
    const {
        level,
        lives,
        status,
        gridSize,
        targetTiles,
        clickedTiles,
        rotation,
        score,
        startGame,
        clickTile,
        resetGame
    } = useVisualHardStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);

    useEffect(() => {
        resetGame();
    }, [resetGame]);

    useEffect(() => {
        if (status === 'result') {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('visual_hard_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('visual_hard_score', score.toString());
                }

                try {
                    const res = await fetch('/api/score/visual-hard', {
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

    // Grid Rendering
    const renderGrid = () => {
        const cells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                // Determine state
                let isActive = false;
                let isClicked = false;

                if (status === 'encode') {
                    // Show target tiles
                    isActive = targetTiles.some(t => t.r === r && t.c === c);
                } else if (status === 'transform') {
                    // Show clicked tiles
                    isClicked = clickedTiles.some(t => t.r === r && t.c === c);
                }

                cells.push(
                    <motion.div
                        key={`${r}-${c}`}
                        initial={{ scale: 0.9 }}
                        animate={{
                            scale: isActive || isClicked ? 1 : 0.95,
                            backgroundColor: isActive ? "#ffffff" : isClicked ? "#22d3ee" : "rgba(255,255,255,0.05)"
                        }}
                        transition={{ duration: 0.2 }}
                        className={`
                            rounded-lg cursor-pointer border-2 border-transparent transition-colors
                            ${!isActive && !isClicked ? "hover:border-white/20" : ""}
                        `}
                        onClick={() => clickTile(r, c)}
                    />
                );
            }
        }
        return cells;
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[600px]">

            {/* Header */}
            <div className="flex justify-between w-full max-w-lg mb-8 items-center px-4">
                <div className="flex flex-col">
                    <span className="text-white/50 text-xs uppercase tracking-widest">Level</span>
                    <span className="text-white text-3xl font-bold">{level}</span>
                </div>

                {/* Lives */}
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-700"}`} />
                    ))}
                </div>
            </div>

            {/* Instruction Area */}
            <div className="h-24 flex items-center justify-center mb-4">
                <AnimatePresence mode="wait">
                    {status === 'encode' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-slate-800/80 backdrop-blur px-8 py-4 rounded-2xl border border-white/10 flex items-center gap-4"
                        >
                            <span className="text-white/70 font-mono">REMEMBER PATTERN</span>
                        </motion.div>
                    )}
                    {status === 'transform' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={`
                                flex items-center gap-4 px-8 py-4 rounded-2xl border-2 shadow-xl
                                ${rotation === 90 ? "bg-amber-500/20 border-amber-500 text-amber-400" : ""}
                                ${rotation === -90 ? "bg-rose-500/20 border-rose-500 text-rose-400" : ""}
                                ${rotation === 180 ? "bg-purple-500/20 border-purple-500 text-purple-400" : ""}
                            `}
                        >
                            {rotation === 90 && <RotateCw className="w-8 h-8" />}
                            {rotation === -90 && <RotateCcw className="w-8 h-8" />}
                            {rotation === 180 && <ArrowUpDown className="w-8 h-8 rotate-45" />} {/* Visual proxy for 180 */}

                            <span className="text-2xl font-black">
                                {rotation === 90 && "90° Clockwise"}
                                {rotation === -90 && "90° Counter-Clockwise"}
                                {rotation === 180 && "180°"}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="relative w-full max-w-md aspect-square bg-slate-900 rounded-3xl p-4 shadow-2xl border border-white/5 flex items-center justify-center">
                <ResultModal
                    isOpen={status === 'result'}
                    score={score}
                    unit="Pts"
                    gameType="Rotating Matrix"
                    onRetry={startGame}
                    percentile={percentile}
                />

                {status === 'idle' ? (
                    <button
                        onClick={startGame}
                        className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-xl transition-all"
                    >
                        START ROTATION
                    </button>
                ) : (
                    <div
                        className="grid gap-2 w-full h-full"
                        style={{
                            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                            gridTemplateRows: `repeat(${gridSize}, 1fr)`
                        }}
                    >
                        {renderGrid()}
                    </div>
                )}
            </div>


        </div>
    );
}
