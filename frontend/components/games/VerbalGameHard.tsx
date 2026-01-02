"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useVerbalHardStore } from '@/store/useVerbalHardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { MessageSquareWarning, Heart, HeartCrack, BrainCircuit } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function VerbalGameHard() {
    const {
        score,
        lives,
        status,
        currentWord,
        feedback,
        startGame,
        makeGuess,
        resetGame
    } = useVerbalHardStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const [visualStyle, setVisualStyle] = useState({ color: 'text-slate-800', font: 'font-sans', rotate: 0, scale: 1 });
    const [shake, setShake] = useState(false);

    const searchParams = useSearchParams();
    const [sharedResult, setSharedResult] = useState<{ score: number, game: string, tier: string } | null>(null);

    // Check for shared challenge
    useEffect(() => {
        const isShare = searchParams.get('share') === 'true';
        if (isShare) {
            const s = parseInt(searchParams.get('score') || '0');
            const g = searchParams.get('game') || '';
            const t = searchParams.get('tier') || '';
            setSharedResult({ score: s, game: g, tier: t });
        }
    }, [searchParams]);

    const handleRetry = () => {
        setSharedResult(null);
        startGame();
    };

    // Initial load
    useEffect(() => {
        resetGame();
    }, []);

    // Visual Noise Effect on Word Change
    useEffect(() => {
        if (!currentWord) return;

        const colors = [
            'text-slate-800', 'text-indigo-900', 'text-rose-900', 'text-emerald-900',
            'text-blue-900', 'text-violet-900', 'text-amber-900'
        ];
        const fonts = ['font-sans', 'font-serif', 'font-mono'];

        setVisualStyle({
            color: colors[Math.floor(Math.random() * colors.length)],
            font: fonts[Math.floor(Math.random() * fonts.length)],
            rotate: (Math.random() * 10) - 5, // -5 to 5 deg
            scale: 0.9 + Math.random() * 0.2 // 0.9 to 1.1
        });
    }, [currentWord]);

    // Feedback Shake
    useEffect(() => {
        if (feedback) {
            setShake(true);
            const t = setTimeout(() => setShake(false), 500);
            return () => clearTimeout(t);
        }
    }, [feedback]);

    // Save Score
    useEffect(() => {
        if (status === 'result') {
            const saveScore = async () => {
                const savedMax = localStorage.getItem('verbal_hard_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('verbal_hard_score', score.toString());
                }

                try {
                    const username = localStorage.getItem('brain_username') || 'Anonymous';
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';
                    const res = await fetch(`${apiUrl}/api/score/verbal-hard`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: score, username: username })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPercentile(data.percentile);
                    }
                } catch (e) { }
            };
            saveScore();
        } else {
            setPercentile(undefined);
        }
    }, [status, score]);

    return (
        <div className={`flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[500px] transition-colors duration-500 ${lives === 1 ? 'bg-rose-50/50' : ''}`}>

            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 text-indigo-600">
                    <BrainCircuit className="w-10 h-10" />
                    <h1 className="text-4xl font-black font-sans tracking-tighter">THE LIAR'S DICTIONARY</h1>
                </div>
                <p className="text-slate-500 font-medium">Verbal Trap Mode</p>
            </div>

            {/* Lives / Score */}
            <div className="flex items-center justify-between w-full max-w-lg mb-4 px-4">
                <div className="flex flex-col items-start">
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Score</span>
                    <span className="text-3xl font-black text-slate-700">{score}</span>
                </div>

                <div className="flex items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 1 }}
                            animate={{ scale: i < lives ? 1 : 0.8, opacity: i < lives ? 1 : 0.2 }}
                        >
                            {i < lives ? (
                                <Heart className="w-8 h-8 text-rose-500 fill-rose-500 drop-shadow-sm" />
                            ) : (
                                <HeartCrack className="w-8 h-8 text-slate-300" />
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="relative w-full max-w-lg aspect-[4/3] bg-white rounded-[2rem] shadow-2xl shadow-indigo-200/40 flex flex-col items-center justify-center p-8 border-4 border-white ring-1 ring-slate-100">

                <ResultModal
                    isOpen={status === 'result' || sharedResult !== null}
                    score={sharedResult ? sharedResult.score : score}
                    unit="Words"
                    gameType={sharedResult ? sharedResult.game : "The Liar's Dictionary"}
                    onRetry={handleRetry}
                    percentile={percentile}
                >
                    {sharedResult && (
                        <div className="mt-4 px-6 py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                            <p className="text-indigo-400 font-bold text-sm">
                                🥊 CHALLENGE RECEIVED! 🥊
                            </p>
                            <p className="text-slate-400 text-xs mt-1">
                                Someone challenged you to beat their score of {sharedResult.score}.
                            </p>
                        </div>
                    )}
                </ResultModal>

                {/* Feedback Overlay */}
                <AnimatePresence>
                    {feedback && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-6 px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-bold shadow-sm z-10"
                        >
                            {feedback}
                        </motion.div>
                    )}
                </AnimatePresence>

                {status === 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center z-10"
                    >
                        <div className="bg-indigo-50 p-6 rounded-2xl mb-8 border border-indigo-100">
                            <h3 className="text-indigo-900 font-bold mb-4 text-lg">The 3 Traps</h3>
                            <ul className="text-left text-indigo-800/80 space-y-2 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-xl">🎭</span>
                                    <span><strong>Synonym Trap:</strong> Similar meaning words may appear. They are NEW unless exact match.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-xl">🎨</span>
                                    <span><strong>Visual Noise:</strong> Colors and fonts will change. Ignore them.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-xl">❤️</span>
                                    <span><strong>Life System:</strong> Traps deal double damage.</span>
                                </li>
                            </ul>
                        </div>
                        <button
                            onClick={startGame}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 px-12 rounded-2xl shadow-xl shadow-indigo-200 transition-all text-xl hover:scale-105 active:scale-95"
                        >
                            START CHALLENGE
                        </button>
                    </motion.div>
                )}

                {status === 'playing' && (
                    <div className="flex flex-col items-center w-full h-full justify-between">
                        <div className="flex-1 flex items-center justify-center w-full">
                            <motion.h2
                                key={currentWord}
                                initial={{ scale: 0.5, opacity: 0, filter: 'blur(10px)' }}
                                animate={{
                                    scale: visualStyle.scale,
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    rotate: visualStyle.rotate,
                                    x: shake ? [0, -10, 10, -10, 10, 0] : 0
                                }}
                                transition={{ type: 'spring', bounce: 0.5 }}
                                className={`text-5xl md:text-6xl font-black tracking-tight ${visualStyle.color} ${visualStyle.font}`}
                            >
                                {currentWord}
                            </motion.h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <button
                                onClick={() => makeGuess('SEEN')}
                                className="group relative bg-amber-100 hover:bg-amber-200 text-amber-900 font-black py-6 rounded-2xl text-2xl transition-all active:scale-95 overflow-hidden"
                            >
                                <span className="relative z-10">SEEN</span>
                                <div className="absolute inset-0 bg-amber-300/0 group-hover:bg-amber-300/20 transition-colors" />
                            </button>
                            <button
                                onClick={() => makeGuess('NEW')}
                                className="group relative bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black py-6 rounded-2xl text-2xl transition-all active:scale-95 overflow-hidden"
                            >
                                <span className="relative z-10">NEW</span>
                                <div className="absolute inset-0 bg-emerald-300/0 group-hover:bg-emerald-300/20 transition-colors" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
