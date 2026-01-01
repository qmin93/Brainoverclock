"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Share2, RotateCcw, Home, Trophy, Medal } from "lucide-react";
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

// Tier Logic Helper
const getTier = (gameType: string, score: number): { name: string; icon: string; color: string } => {
    // Determine category based on gameType (loose matching)
    const type = gameType.toLowerCase();

    if (type.includes("chimp") || type.includes("spatial")) {
        if (score >= 15) return { name: "Alien (👽)", icon: "👽", color: "text-purple-400" };
        if (score >= 10) return { name: "Chimp (🦍)", icon: "🦍", color: "text-rose-400" };
        if (score >= 5) return { name: "Cat (🐈)", icon: "🐈", color: "text-amber-400" };
        return { name: "Shrimp (🦐)", icon: "🦐", color: "text-slate-400" };
    }

    if (type.includes("typo") || type.includes("type")) {
        if (score >= 90) return { name: "Alien (👽)", icon: "👽", color: "text-purple-400" }; // WPM
        if (score >= 60) return { name: "Cheetah (🐆)", icon: "🐆", color: "text-amber-400" };
        if (score >= 30) return { name: "Rabbit (🐇)", icon: "🐇", color: "text-blue-400" };
        return { name: "Turtle (🐢)", icon: "🐢", color: "text-emerald-400" };
    }

    if (type.includes("aim") || type.includes("chaos")) {
        if (score >= 20000) return { name: "Aimbot (🤖)", icon: "🤖", color: "text-rose-500" };
        if (score >= 10000) return { name: "Sniper (🎯)", icon: "🎯", color: "text-amber-400" };
        if (score >= 5000) return { name: "Soldier (🔫)", icon: "🔫", color: "text-blue-400" };
        return { name: "Stormtrooper (💀)", icon: "💀", color: "text-slate-400" };
    }

    if (type.includes("verbal") || type.includes("liar")) {
        if (score >= 100) return { name: "Encyclopedia (📖)", icon: "📖", color: "text-amber-400" };
        if (score >= 50) return { name: "Scholar (🎓)", icon: "🎓", color: "text-blue-400" };
        if (score >= 20) return { name: "Student (🎒)", icon: "🎒", color: "text-emerald-400" };
        return { name: "Goldfish (🐟)", icon: "🐟", color: "text-orange-400" };
    }

    if (type.includes("stroop")) {
        if (score >= 20) return { name: "Computer (💻)", icon: "💻", color: "text-blue-400" };
        if (score >= 15) return { name: "Genius (🧠)", icon: "🧠", color: "text-purple-400" };
        if (score >= 10) return { name: "Human (👤)", icon: "👤", color: "text-emerald-400" };
        return { name: "Sleepy (😴)", icon: "😴", color: "text-slate-400" };
    }

    // Default Fallback
    if (score >= 20) return { name: "Grandmaster", icon: "👑", color: "text-yellow-400" };
    if (score >= 10) return { name: "Expert", icon: "🥇", color: "text-slate-200" };
    if (score >= 5) return { name: "Novice", icon: "🥉", color: "text-orange-700" };
    return { name: "Beginner", icon: "🌱", color: "text-emerald-400" };
};

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

    const tier = getTier(gameType, score);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 2000);
    };

    const getShareText = () => {
        return `🧠 Brain Overclock: ${gameType}\n🏆 Score: ${score} ${unit}\n🎖️ Tier: ${tier.name}\n\nCan you beat my record? 👇\nhttps://brain-overclock.vercel.app`;
    };

    const handleCopy = async () => {
        const text = getShareText();
        try {
            await navigator.clipboard.writeText(text);
            showToast("Challenge Copied to Clipboard!");
        } catch (err) {
            console.error(err);
            showToast("Failed to copy");
        }
    };

    const handleShare = async () => {
        const text = getShareText();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Brain Overclock Result`,
                    text: text,
                    url: "https://brain-overclock.vercel.app"
                });
            } catch (err) {
                console.log("Share canceled or failed", err);
            }
        } else {
            // Fallback for PC
            handleCopy();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-slate-900 border border-slate-700 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
                >
                    {/* Toast Notification */}
                    <AnimatePresence>
                        {toastMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, x: "-50%" }}
                                animate={{ opacity: 1, y: 10, x: "-50%" }}
                                exit={{ opacity: 0 }}
                                className="absolute top-0 left-1/2 bg-white text-slate-900 text-xs font-black px-6 py-3 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] z-50 whitespace-nowrap"
                            >
                                {toastMsg}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Background Shine */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 blur-[80px]" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-rose-500/20 blur-[80px]" />

                    {/* Header */}
                    <div className="relative mb-6">
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">{gameType}</h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Result Report</p>
                    </div>

                    {/* Score Card */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700 relative overflow-hidden">

                        <div className="flex flex-col items-center">
                            <span className="text-slate-400 text-xs uppercase font-bold mb-2">Final Score</span>
                            <div className="text-6xl font-black text-white leading-none tracking-tighter mb-2">
                                {score}
                                <span className="text-lg text-slate-500 ml-1 font-medium">{unit}</span>
                            </div>

                            {/* Tier Badge */}
                            <div className="mt-4 flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700 shadow-inner">
                                <span className="text-xl">{tier.icon}</span>
                                <span className={`font-bold ${tier.color}`}>{tier.name}</span>
                            </div>
                        </div>

                        {percentile !== undefined && (
                            <div className="absolute top-3 right-3">
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                                    TOP {percentile}%
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        {/* Primary: Copy/Challenge */}
                        <button
                            onClick={handleCopy}
                            className="w-full bg-white hover:bg-slate-200 text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg group"
                        >
                            <Copy className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            <span>COPY CHALLENGE</span>
                        </button>

                        {/* Secondary: Share (Mobile) */}
                        <button
                            onClick={handleShare}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700"
                        >
                            <Share2 className="w-5 h-5 text-indigo-400" />
                            <span>Share Result</span>
                        </button>

                        {/* Navigation Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button
                                onClick={onRetry}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:text-white"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Retry</span>
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:text-white"
                            >
                                <Home className="w-4 h-4" />
                                <span>Home</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
