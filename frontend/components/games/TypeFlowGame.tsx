"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTypeFlowStore, TypeFlowMode } from '@/store/useTypeFlowStore';
import { ResultModal } from '@/components/games/ResultModal';
import { Keyboard, Quote, Zap, EyeOff, CheckCircle2 } from 'lucide-react';

export default function TypeFlowGame() {
    const {
        currentQuote,
        userInput,
        status,
        mode,
        mistakes,
        wpm,
        accuracy,
        level,
        setMode,
        start,
        handleInput,
        reset
    } = useTypeFlowStore();

    const [percentile, setPercentile] = useState<number | undefined>(undefined);
    const [showBlindText, setShowBlindText] = useState(true);
    const [glitch, setGlitch] = useState(false);
    const [shake, setShake] = useState(false);
    const [isFocused, setIsFocused] = useState(true);
    const [lastMistakes, setLastMistakes] = useState(0);
    const [blindCountdown, setBlindCountdown] = useState(7);

    const inputRef = useRef<HTMLInputElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initial focus and sounds
    useEffect(() => {
        if (status === 'running') {
            inputRef.current?.focus();
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            if (mode === 'blind') {
                setShowBlindText(true);
                setBlindCountdown(7);
                const interval = setInterval(() => {
                    setBlindCountdown(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            setShowBlindText(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
                return () => clearInterval(interval);
            }
        } else {
            setShowBlindText(true);
            setBlindCountdown(7);
            setGlitch(false);
            setShake(false);
            setLastMistakes(0);
        }
    }, [status, mode]);

    // Handle Mistakes Feedback
    useEffect(() => {
        if (mistakes > lastMistakes) {
            setLastMistakes(mistakes);
            setShake(true);
            setTimeout(() => setShake(false), 300);
        }
    }, [mistakes, lastMistakes]);

    const playClick = () => {
        if (!audioContextRef.current) return;
        const osc = audioContextRef.current.createOscillator();
        const gain = audioContextRef.current.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioContextRef.current.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(audioContextRef.current.destination);
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.1);
    };

    useEffect(() => {
        if (status === 'finished') {
            if (mode === 'sudden-death' && userInput !== currentQuote.text) {
                setGlitch(true);
            }

            const saveScore = async () => {
                const savedMax = localStorage.getItem('type_flow_score');
                if (!savedMax || wpm > parseInt(savedMax)) {
                    localStorage.setItem('type_flow_score', wpm.toString());
                }

                try {
                    const res = await fetch('/api/score/type-flow', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ score: wpm })
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
    }, [status, wpm, mode, userInput, currentQuote.text]);

    // Global Keyboard Input Listener
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // 1. Check if game is playing
            if (status !== 'running') return;

            // 2. Ignore functional keys except Backspace
            if (e.key.length > 1 && e.key !== 'Backspace') {
                return;
            }

            e.preventDefault();
            playClick();

            // 3. Handle Backspace
            if (e.key === 'Backspace') {
                // In Sudden Death, Backspace might be blocked or allowed depending on rules.
                // Store logic handles input updates, but we can prevention here if needed.
                if (mode === 'sudden-death') return;

                handleInput(userInput.slice(0, -1));
                return;
            }

            // 4. Handle Character Input
            // Pass the constructed string to store's handleInput which validates and updates state
            handleInput(userInput + e.key);
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [status, mode, userInput, handleInput, currentQuote.text]);


    const renderText = () => {
        const chars = currentQuote.text.split('');
        return chars.map((char, i) => {
            let color = 'text-slate-400';

            if (i < userInput.length) {
                color = 'text-indigo-600 font-black';
            }

            const isCaret = i === userInput.length;
            const isBlind = mode === 'blind' && !showBlindText;
            const isError = isCaret && shake;

            return (
                <span key={i} className="relative inline-block">
                    <span
                        className={`transition-all duration-150 ${color} ${isError ? 'text-rose-500' : ''} rounded-sm px-[0.1ch]`}
                        style={{ opacity: isBlind && i >= userInput.length ? 0 : 1 }}
                    >
                        {char === ' ' ? '\u00A0' : char}
                    </span>
                    {isCaret && status === 'running' && (
                        <motion.div
                            layoutId="caret"
                            className={`absolute left-0 bottom-0 w-[2px] h-[1.2em] rounded-full ${isError ? 'bg-rose-500' : 'bg-indigo-600'}`}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    )}
                </span>
            );
        });
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto min-h-[600px] p-6 font-sans">

            <ResultModal
                isOpen={status === 'finished'}
                score={wpm}
                unit="WPM"
                gameType={`Type Flow (${mode}) - Level ${level - 1}`}
                onRetry={() => start(false)}
                percentile={percentile}
            >
                <div className="mt-4 flex flex-col gap-2 w-full">
                    <button
                        onClick={() => start(false)}
                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:scale-105 transition-all shadow-lg"
                    >
                        NEXT LEVEL
                    </button>
                    <button
                        onClick={reset}
                        className="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                    >
                        BACK TO MENU
                    </button>
                </div>
            </ResultModal>

            {/* Header / HUD - HIDDEN WHEN TYPING for Minimalism */}
            <AnimatePresence>
                {status !== 'running' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full flex justify-between items-center mb-12"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                                <Keyboard size={24} />
                            </div>
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase italic">Type Flow</h1>
                        </div>

                        <div className="bg-white border-2 border-slate-100 px-6 py-2 rounded-2xl shadow-sm flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Progression</span>
                            <span className="text-xl font-black text-indigo-600 italic">Lv.{level}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Blind Mode Countdown Banner - Positioned above for 100% visibility */}
            <AnimatePresence>
                {mode === 'blind' && showBlindText && status === 'running' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="mb-6 flex items-center gap-4 bg-indigo-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl shadow-indigo-200 border-2 border-indigo-400 pointer-events-none"
                    >
                        <EyeOff size={24} className="animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest opacity-70">Memorize Phase</span>
                            <span className="text-xl font-black uppercase italic tracking-tighter">Stay in the flow</span>
                        </div>
                        <div className="ml-auto w-12 h-12 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10">
                            <span className="text-2xl font-black">{blindCountdown}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Card */}
            <motion.div
                animate={
                    glitch ? {
                        x: [0, -10, 10, -10, 10, 0],
                        filter: ["brightness(1)", "brightness(2) contrast(2)", "brightness(1)"],
                        backgroundColor: ["#fff", "#fecaca", "#fff"]
                    } : shake ? {
                        x: [-5, 5, -5, 5, 0],
                    } : {}
                }
                className={`w-full bg-white border-2 rounded-[2.5rem] p-12 shadow-xl transition-all duration-300 relative overflow-hidden ${isFocused ? 'border-indigo-400 shadow-indigo-100' : 'border-slate-100 shadow-slate-200'
                    }`}
            >
                {/* Focus Warning Overlay */}
                {status === 'running' && !isFocused && (
                    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[45] flex items-center justify-center pointer-events-none">
                        <span className="bg-white px-6 py-2 rounded-full text-indigo-600 font-bold text-sm shadow-xl animate-bounce">
                            Click to Focus & Type
                        </span>
                    </div>
                )}

                {status === 'idle' ? (
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 font-black text-3xl italic">
                            {level}
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Level {level} Flow</h2>
                        <p className="text-slate-500 max-w-md mb-12 text-lg">
                            {level === 1 ? "Start with short, elegant phrases." :
                                level === 2 ? "Focus on rhythm and compound words." :
                                    "Master the immersion of deep paragraphs."}
                        </p>

                        <div className="mb-12 w-full max-w-xl">
                            <div className="flex flex-col items-center p-8 rounded-3xl border-2 border-indigo-900 bg-indigo-900 text-white gap-4 shadow-xl">
                                <EyeOff className="text-indigo-400 w-12 h-12 animate-pulse" />
                                <div className="text-center">
                                    <h3 className="font-black text-xl uppercase tracking-widest mb-2">Blind Mode Active</h3>
                                    <p className="text-indigo-200 font-medium">The text will vanish shortly after the game starts.<br />Trust your muscle memory.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => start()}
                            className="bg-indigo-600 text-white font-black py-5 px-16 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 text-xl uppercase tracking-widest"
                        >
                            Start Session
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Overlays */}
                        <AnimatePresence>
                            {glitch && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 2 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                                >
                                    <span className="text-8xl font-black text-rose-600 uppercase italic tracking-widest drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]">FAILED_</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-col gap-8">
                            <div className="text-3xl md:text-4xl leading-relaxed text-left break-words min-h-[1.5em]">
                                {renderText()}
                            </div>

                            <div className="flex items-center gap-2 opacity-30 mt-8 border-t pt-8">
                                <Quote size={16} />
                                <span className="text-sm font-bold uppercase tracking-widest">{currentQuote.source}</span>
                            </div>
                        </div>

                        {/* Hidden Input field */}
                        <input
                            ref={inputRef}
                            type="text"
                            className="opacity-0 absolute inset-0 w-full h-full cursor-default z-50"
                            value={userInput}
                            readOnly
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="none"
                            spellCheck="false"
                            autoFocus
                        />
                    </div>
                )}
            </motion.div>

            {/* Bottom Legend */}
            <div className="mt-8 flex gap-8">
                {mode === 'sudden-death' && (
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-tighter bg-rose-50 px-4 py-2 rounded-full border border-rose-100 italic">
                        <Zap size={14} fill="currentColor" /> Sudden Death Active: No Mistakes Allowed
                    </div>
                )}
                {mode === 'blind' && (
                    <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-tighter bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 italic">
                        <EyeOff size={14} fill="currentColor" /> Blind Mode Active: Typing Ghostly
                    </div>
                )}
            </div>
        </div>
    );
}
