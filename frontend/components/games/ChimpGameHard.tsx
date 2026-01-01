"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useChimpHardStore } from '@/store/useChimpHardStore';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { Zap, Bomb } from 'lucide-react';

export default function ChimpGameHard() {
    const {
        level,
        status,
        blocks,
        exposureTime,
        clickBlock,
        resetGame,
        startGame,
        startRecall
    } = useChimpHardStore();

    const controls = useAnimation();
    const [percentile, setPercentile] = useState<number | undefined>(undefined);

    // Timer Ref
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Start
    useEffect(() => {
        resetGame();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // Effect: Exposure Timer
    useEffect(() => {
        if (status === 'memorize') {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                startRecall();
            }, exposureTime);
        }
    }, [status, exposureTime, level, startRecall]); // Re-run when level/status changes

    // Effect: Shake on Game Over (Result)
    useEffect(() => {
        if (status === 'result') {
            controls.start({
                x: [-10, 10, -10, 10, 0],
                backgroundColor: ["rgba(239,68,68,0.2)", "rgba(0,0,0,0)"],
                transition: { duration: 0.5 }
            });

            // Save Score
            const saveScore = async () => {
                // Local Storage
                const savedMax = localStorage.getItem('chimp_hard_score');
                if (!savedMax || level > parseInt(savedMax)) {
                    localStorage.setItem('chimp_hard_score', level.toString());
                }

                try {
                    const res = await fetch('/api/score/chimp-hard', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: level })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPercentile(data.percentile);
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            saveScore();
        } else {
            setPercentile(undefined);
        }
    }, [status, level, controls]);

    const handleBlockClick = (id: number) => {
        if (status === 'result') return;
        clickBlock(id);
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto">

            <div className="flex justify-between w-full max-w-2xl mb-6 text-xl font-bold text-white/80 px-4 items-center">
                <div className="flex flex-col">
                    <span className="text-white/50 text-sm uppercase tracking-widest">Amount</span>
                    <span className="text-white text-3xl font-black text-shadow">{level}</span>
                </div>

                {status === 'memorize' && (
                    <div className="flex flex-col items-end">
                        <span className="text-rose-400 text-sm font-bold uppercase tracking-widest flex items-center gap-1">
                            <Zap size={14} fill="currentColor" /> Flash
                        </span>
                        <div className="w-32 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden relative">
                            <motion.div
                                key={level} // Restart animation per level
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: exposureTime / 1000, ease: "linear" }}
                                className="absolute top-0 left-0 h-full bg-rose-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="relative w-full max-w-2xl aspect-[8/5]">
                <ResultModal
                    isOpen={status === 'result'}
                    score={level}
                    unit="Items"
                    gameType="Flash Chimp"
                    onRetry={resetGame}
                    percentile={percentile}
                />

                <motion.div
                    animate={controls}
                    className="grid grid-cols-8 grid-rows-5 gap-2 w-full h-full p-2 bg-slate-900/80 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-md"
                >
                    {blocks.map((block) => {
                        const style = {
                            gridColumnStart: block.x + 1,
                            gridRowStart: block.y + 1,
                        };

                        if (block.state === 'solved') {
                            return <div key={block.id} style={style} className="pointer-events-none" />;
                        }

                        const isHidden = block.state === 'hidden';

                        return (
                            <motion.div
                                key={block.id}
                                layoutId={`block-${block.id}`}
                                style={style}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative flex items-center justify-center rounded-lg cursor-pointer
                                    border-[2px] select-none text-2xl font-bold transition-all duration-200
                                    ${isHidden
                                        ? "bg-white border-white text-transparent hover:bg-gray-200"
                                        : "bg-rose-500/20 border-rose-500 text-rose-100 hover:bg-rose-500/40"
                                    }
                                `}
                                onClick={() => handleBlockClick(block.id)}
                            >
                                <span className={isHidden ? "opacity-0" : "opacity-100"}>
                                    {block.isDummy ? <Bomb className="w-8 h-8 opacity-80" /> : block.id}
                                </span>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            <div className="mt-8 text-center text-white/50 max-w-lg">
                <p className="font-medium text-rose-400 mb-2">HARD MODE: SUDDEN DEATH</p>
                <p className="text-sm">Memorize the positions instantly. They disappear automatically.</p>
            </div>
        </div>
    );
}
