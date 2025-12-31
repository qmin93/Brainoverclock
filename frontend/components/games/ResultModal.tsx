"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, Copy, RotateCcw, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResultModalProps {
    isOpen: boolean;
    score: number;
    unit: string;
    percentile?: number;
    gameType: string;
    onRetry: () => void;
    children?: React.ReactNode;
}

export function ResultModal({
    isOpen,
    score,
    unit,
    percentile,
    gameType,
    onRetry,
    children,
}: ResultModalProps) {
    const router = useRouter();
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 2000);
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            showToast("Link Details copied!");
        } catch (err) {
            // Fallback or ignore
        }
    };

    const handleCopyResult = async () => {
        const text = `I achieved ${score} ${unit} on ${gameType}! Can you beat me? #BrainOverclock`;
        try {
            await navigator.clipboard.writeText(text);
            showToast("Result Details copied!");
        } catch (err) {
            // Fallback
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center relative overflow-hidden"
                >
                    {/* Toast Notification */}
                    <AnimatePresence>
                        {toastMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-4 py-2 rounded-full shadow-lg z-20"
                            >
                                {toastMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Gradient Glow */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Game Over</h2>
                    <p className="text-white/50 text-sm uppercase tracking-widest mb-8">{gameType}</p>

                    <div className="mb-10">
                        <div className="text-7xl font-mono font-black text-white mb-2">
                            {score}
                            <span className="text-3xl text-white/40 ml-2">{unit}</span>
                        </div>
                        {percentile !== undefined && (
                            <div className="inline-block bg-white/5 px-4 py-1 rounded-full border border-white/10">
                                <span className="text-emerald-400 font-bold">Top {percentile}%</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl transition-all duration-200"
                        >
                            <Share2 className="w-5 h-5" />
                            <span className="font-semibold">Share</span>
                        </button>

                        <button
                            onClick={handleCopyResult}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl transition-all duration-200"
                        >
                            <Copy className="w-5 h-5" />
                            <span className="font-semibold">Copy</span>
                        </button>

                        <button
                            onClick={onRetry}
                            className="col-span-1 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 p-4 rounded-xl transition-all duration-200 font-bold"
                        >
                            <RotateCcw className="w-5 h-5" />
                            <span>Retake</span>
                        </button>

                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => router.push('/')}
                            className="col-span-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl transition-all duration-200"
                        >
                            <Home className="w-5 h-5" />
                            <span>Home</span>
                        </button>
                    </div>

                    {children && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            {children}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
