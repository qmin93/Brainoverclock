"use client";

import React, { useEffect, useState } from 'react';
import { useChimpStore } from '@/store/useChimpStore';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ResultModal } from './ResultModal';

export default function ChimpGame() {
    const {
        level,
        strikes,
        status,
        blocks,
        clickBlock,
        resetGame,
        startGame
    } = useChimpStore();

    const controls = useAnimation();
    const prevStrikes = React.useRef(strikes);
    const [percentile, setPercentile] = useState<number | undefined>(undefined);

    useEffect(() => {
        resetGame();
    }, [resetGame]);

    useEffect(() => {
        if (strikes < prevStrikes.current && status !== 'result') {
            // Trigger Shake
            controls.start({
                x: [-10, 10, -10, 10, 0],
                borderColor: ["#ef4444", "rgba(255,255,255,0.05)"],
                transition: { duration: 0.4 }
            });
        }
        prevStrikes.current = strikes;
    }, [strikes, status, controls]);

    const handleBlockClick = (id: number) => {
        if (status === 'result') return;
        clickBlock(id);
    };

    const handleRetry = () => {
        resetGame();
    };

    // Auto-save score on Result status
    // Auto-save score on Result status
    useEffect(() => {
        if (status === 'result') {
            const saveScore = async () => {
                // Save to LocalStorage for Dashboard
                const savedMax = localStorage.getItem('chimp_test_score');
                if (!savedMax || level > parseInt(savedMax)) {
                    localStorage.setItem('chimp_test_score', level.toString());
                }

                try {
                    const res = await fetch('/api/score/chimp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: level })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPercentile(data.percentile);
                    }
                } catch (err) {
                    console.error("Failed to save score:", err);
                }
            };
            saveScore();
        } else {
            setPercentile(undefined);
        }
    }, [status, level]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">

            {/* Header Info */}
            <div className="flex justify-between w-full max-w-2xl mb-6 text-xl font-bold text-white/80 px-4">
                <div className="flex gap-2">
                    <span className="text-white/50">Level</span>
                    <span className="text-white text-2xl">{level}</span>
                </div>
                <div className="flex gap-2">
                    <span className="text-white/50">Strikes</span>
                    <div className="flex gap-1 text-2xl">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={i < (3 - strikes) ? "text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "text-white/10"}>
                                ✖
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Game Board */}
            <div className="relative w-full max-w-2xl aspect-[8/5]">
                {/* Result Modal - using existing component */}
                <ResultModal
                    isOpen={status === 'result'}
                    score={level}
                    unit="Levels"
                    gameType="Chimp Test"
                    onRetry={handleRetry}
                    percentile={percentile}
                />

                {/* Grid */}
                <motion.div
                    animate={controls}
                    className="grid grid-cols-8 grid-rows-5 gap-2 w-full h-full p-2 bg-slate-800/50 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm"
                >
                    {blocks.map((block) => {
                        const style = {
                            gridColumnStart: block.x + 1,
                            gridRowStart: block.y + 1,
                        };

                        // Logic for what to render?
                        if (block.state === 'solved') {
                            // Keep space but empty
                            return <div key={block.id} style={style} className="pointer-events-none" />;
                        }

                        const isHidden = block.state === 'hidden';

                        return (
                            <motion.div
                                key={block.id}
                                layoutId={`block-${block.id}`}
                                style={style}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative flex items-center justify-center rounded-xl cursor-pointer
                                    border-[3px] select-none text-3xl font-black transition-all duration-300
                                    shadow-lg
                                    ${isHidden
                                        ? "bg-white border-white text-transparent hover:bg-gray-100 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        : "bg-transparent border-white/40 text-white hover:border-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                    }
                                `}
                                onClick={() => handleBlockClick(block.id)}
                            >
                                <span className={isHidden ? "opacity-0" : "opacity-100"}>
                                    {block.id}
                                </span>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Instructions */}
            <div className="mt-8 text-center text-white/50 max-w-lg space-y-2">
                <p className="text-lg">Click the numbers in numerical order starting from 1.</p>
                <p className="text-sm bg-white/5 inline-block px-4 py-2 rounded-lg">
                    <span className="text-sky-400 font-bold">Tip:</span> Memorize the positions before clicking '1'.
                </p>
            </div>
        </div>
    );
}
