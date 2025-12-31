"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNBackStore } from '@/store/useNBackStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ResultModal } from './ResultModal';
import { Volume2, Eye, BrainCircuit } from 'lucide-react';

export default function NBackGame() {
    const {
        n,
        currentIndex,
        totalTrials,
        status,
        currentStep,
        hasRespondedPos,
        hasRespondedSound,
        posStats,
        soundStats,
        startGame,
        nextStep,
        checkInput,
        resetGame
    } = useNBackStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // TTS Function
    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.2;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }, []);

    // Game Loop
    useEffect(() => {
        if (status === 'playing') {
            // First step immediately
            if (currentStep) {
                speak(currentStep.sound);
            }

            intervalRef.current = setInterval(() => {
                nextStep();
            }, 3000); // 3 seconds per trial
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [status, nextStep, speak, currentStep]);

    // Speak on every step update
    useEffect(() => {
        if (status === 'playing' && currentStep) {
            speak(currentStep.sound);
        }
    }, [currentStep, status, speak]);

    // Keyboard Inputs
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (status !== 'playing') return;
            if (e.key.toLowerCase() === 'a') checkInput('sound');
            if (e.key.toLowerCase() === 'l') checkInput('position');
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, [status, checkInput]);

    // Finish logic
    useEffect(() => {
        if (status === 'round_end') {
            const saveScore = async () => {
                // Score for N-Back is the Level N
                const score = n;
                const savedMax = localStorage.getItem('n_back_score');
                if (!savedMax || score > parseInt(savedMax)) {
                    localStorage.setItem('n_back_score', score.toString());
                }

                try {
                    const res = await fetch('/api/score/n-back', {
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
        }
    }, [status, n]);

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[600px] select-none p-4">

            {/* Header Info */}
            <div className="w-full max-w-md flex justify-between items-end mb-8 px-2">
                <div className="flex flex-col">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Training Level</span>
                    <span className="text-4xl font-black text-slate-800">{n}-Back</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Progress</span>
                    <span className="text-xl font-mono font-bold text-slate-600">{currentIndex} / {totalTrials}</span>
                </div>
            </div>

            {/* Main Game Area */}
            <div className="relative w-full max-w-sm aspect-square bg-white rounded-[2rem] shadow-2xl p-6 border border-slate-100 flex items-center justify-center">

                <ResultModal
                    isOpen={status === 'round_end'}
                    score={n}
                    unit="Back"
                    gameType="Dual N-Back"
                    onRetry={startGame}
                    percentile={percentile}
                />

                {status === 'idle' ? (
                    <div className="text-center p-4">
                        <BrainCircuit className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                        <h1 className="text-2xl font-black mb-4 tracking-tight">DUAL N-BACK TRAINING</h1>

                        <div className="space-y-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
                            <div>
                                <h3 className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">The Goal</h3>
                                <p className="text-slate-600 text-sm leading-snug">
                                    Simultaneously track <strong>Visual Position</strong> and <strong>Audio Letter</strong>.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-indigo-600 font-black text-xs uppercase tracking-widest mb-1">What is {n}-Back?</h3>
                                <p className="text-slate-600 text-sm leading-snug">
                                    Press the button if the current stimulus matches the one shown <strong>exactly {n} steps ago</strong>.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Eye className="w-4 h-4 text-blue-500" />
                                        <span className="font-bold text-xs">Position</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">Match? Press <kbd className="bg-slate-100 px-1 rounded border font-sans">L</kbd></p>
                                </div>
                                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Volume2 className="w-4 h-4 text-indigo-500" />
                                        <span className="font-bold text-xs">Sound</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium">Match? Press <kbd className="bg-slate-100 px-1 rounded border font-sans">A</kbd></p>
                                </div>
                            </div>

                            <p className="text-[10px] text-slate-400 italic text-center leading-tight">
                                20 trials per session. Level increases if accuracy is high, and decreases if low.
                            </p>
                        </div>

                        <button
                            onClick={startGame}
                            className="w-full bg-slate-900 text-white font-black py-4 px-12 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-lg"
                        >
                            I'M READY
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full">
                        {[...Array(9)].map((_, i) => (
                            <div key={i} className="relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                                {currentStep?.position === i && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Controls */}
            {status === 'playing' && (
                <div className="grid grid-cols-2 gap-6 mt-12 w-full max-w-sm">
                    <button
                        onMouseDown={() => checkInput('sound')}
                        className={`
                            group flex flex-col items-center justify-center p-6 rounded-3xl border-b-4 transition-all active:scale-95
                            ${hasRespondedSound ? 'bg-indigo-600 border-indigo-800' : 'bg-indigo-500 border-indigo-700 hover:bg-indigo-400'}
                        `}
                    >
                        <Volume2 className="text-white w-8 h-8 mb-2" />
                        <span className="text-white font-black">SOUND (A)</span>
                    </button>

                    <button
                        onMouseDown={() => checkInput('position')}
                        className={`
                            group flex flex-col items-center justify-center p-6 rounded-3xl border-b-4 transition-all active:scale-95
                            ${hasRespondedPos ? 'bg-blue-600 border-blue-800' : 'bg-blue-500 border-blue-700 hover:bg-blue-400'}
                        `}
                    >
                        <Eye className="text-white w-8 h-8 mb-2" />
                        <span className="text-white font-black">POSITION (L)</span>
                    </button>
                </div>
            )}

            <div className="mt-12 text-center text-slate-300 text-xs font-bold tracking-widest flex flex-col gap-2">
                <span>FLUID INTELLIGENCE PROTOCOL</span>
                <div className="flex gap-4 justify-center">
                    <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-2 py-0.5 rounded border">A</kbd> Sound</span>
                    <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-2 py-0.5 rounded border">L</kbd> Position</span>
                </div>
            </div>
        </div>
    );
}
