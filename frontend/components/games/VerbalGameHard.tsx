"use client";

import React, { useEffect, useState } from 'react';
import { useVerbalHardStore } from '@/store/useVerbalHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { MessageSquareWarning } from 'lucide-react'; // Icon for Verbal Trap

export default function VerbalGameHard() {
    const {
        score,
        lives,
        status,
        currentWord,
        startGame,
        makeGuess,
        resetGame
    } = useVerbalHardStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);

    // Initial load
    useEffect(() => {
        resetGame(); // Ensure idle
    }, [resetGame]);

    // Game Over Logic
    useEffect(() => {
        if (status === 'result') {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('verbal_hard_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('verbal_hard_score', score.toString());
                }

                try {
                    const res = await fetch('/api/score/verbal-hard', {
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

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[500px]">

            <div className="mb-12 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 text-indigo-500">
                    <MessageSquareWarning className="w-8 h-8" />
                    <h1 className="text-3xl font-bold font-sans tracking-tight">VERBAL TRAP</h1>
                </div>
                <p className="text-slate-400 font-medium">Is it NEW? or a SEEN trap?</p>
            </div>

            {/* Lives / Score */}
            <div className="flex items-center gap-8 mb-8 text-xl font-bold text-slate-700">
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Score</span>
                    <span className="text-3xl">{score}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase tracking-widest text-slate-400">Lives</span>
                    <span className={lives === 0 ? "text-rose-500" : "text-emerald-500"}>
                        {lives}/1
                    </span>
                </div>
            </div>

            <div className="relative w-full max-w-lg aspect-square md:aspect-[4/3] bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 flex flex-col items-center justify-center p-8 border border-indigo-50">

                <ResultModal
                    isOpen={status === 'result'}
                    score={score}
                    unit="Words"
                    gameType="Verbal Trap"
                    onRetry={startGame}
                    percentile={percentile}
                />

                {status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <p className="text-slate-500 mb-8 leading-relaxed">
                            A word will appear.<br />
                            If you've seen it before, click <strong>SEEN</strong>.<br />
                            If it's new, click <strong>NEW</strong>.<br />
                            <span className="text-rose-500 font-bold">Beware of similar meanings.</span>
                        </p>
                        <button
                            onClick={startGame}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 px-12 rounded-2xl shadow-lg transition-all text-xl"
                        >
                            Start Test
                        </button>
                    </motion.div>
                )}

                {status === 'playing' && (
                    <div className="flex flex-col items-center w-full h-full justify-between">
                        <div className="flex-1 flex items-center justify-center">
                            <motion.h2
                                key={currentWord} // Trigger animation on word change
                                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                className="text-5xl md:text-6xl font-black text-slate-800 tracking-tight"
                            >
                                {currentWord}
                            </motion.h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => makeGuess('SEEN')}
                                className="bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold py-6 rounded-2xl text-2xl shadow-lg transition-transform active:scale-95 border-b-4 border-amber-600 active:border-b-0 active:translate-y-1"
                            >
                                SEEN
                            </button>
                            <button
                                onClick={() => makeGuess('NEW')}
                                className="bg-emerald-400 hover:bg-emerald-300 text-emerald-900 font-bold py-6 rounded-2xl text-2xl shadow-lg transition-transform active:scale-95 border-b-4 border-emerald-600 active:border-b-0 active:translate-y-1"
                            >
                                NEW
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
