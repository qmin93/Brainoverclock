"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Home, Trophy, Grip, Swords } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import ShareResult from "../ShareResult";

interface ResultModalProps {
    isOpen: boolean;
    score: number;
    unit: string;
    percentile?: number;
    gameType: string;
    onRetry: () => void;
    children?: React.ReactNode;
}

// Backend Game ID Mapping
const GAME_ID_MAP: Record<string, string> = {
    "Spatial Chaos": "chimp_test_hard",
    "Chimp Test": "chimp_test",
    "Aim Trainer Hard": "aim_hard",
    "Aim Trainer": "aim_trainer",
    "Project: Chaos Hunter": "aim_hard",
    "Chaos Hunter": "aim_hard",
    "Verbal Trap": "verbal_hard",
    "The Liar's Dictionary": "verbal_hard",
    "Verbal Memory": "verbal_memory",
    "Stroop Hard": "stroop_hard",
    "Stroop Task": "stroop_task",
    "Visual Memory Hard": "visual_hard",
    "Visual Memory": "visual_memory",
    "Type Flow": "type_flow",
    "Number Memory": "n_back",
    "Sequence Memory": "sequence_memory",
    "Schulte Grid": "schulte_normal"
};

const GAME_URL_MAP: Record<string, string> = {
    "Spatial Chaos": "/test/chimp-test-hard",
    "Chimp Test": "/test/chimp-test",
    "Aim Trainer Hard": "/test/aim-trainer-hard",
    "Aim Trainer": "/test/aim-trainer",
    "Project: Chaos Hunter": "/test/aim-trainer-hard",
    "Chaos Hunter": "/test/aim-trainer-hard",
    "Verbal Trap": "/test/verbal-memory-hard",
    "The Liar's Dictionary": "/test/verbal-memory-hard",
    "Verbal Memory": "/test/verbal-memory-hard",
    "Stroop Hard": "/test/stroop-test-hard",
    "Stroop Task": "/test/stroop-test-hard",
    "Chaos Stroop": "/test/stroop-test-hard",
    "Visual Memory Hard": "/test/visual-memory-hard",
    "Visual Memory": "/test/visual-memory-hard",
    "Type Flow": "/test/type-flow",
    "Number Memory": "/test/number-memory",
    "Sequence Memory Hard": "/test/sequence-memory",
    "Sequence Memory": "/test/sequence-memory",
    "Schulte Grid": "/test/schulte-table",
    "Math Fall": "/test/math-fall",
    "Reaction Time (Hard)": "/test/reaction-time-hard",
    "Reaction Time": "/test/reaction-time",
    "Dual N-Back": "/test/dual-n-back"
};

const getTier = (gameType: string, score: number): { name: string; icon: string; color: string } => {
    const type = gameType.toLowerCase();

    if (type.includes("chimp") || type.includes("spatial")) {
        if (score >= 15) return { name: "Alien (👽)", icon: "👽", color: "text-purple-400" };
        if (score >= 10) return { name: "Chimp (🦍)", icon: "🦍", color: "text-rose-400" };
        if (score >= 5) return { name: "Cat (🐈)", icon: "🐈", color: "text-amber-400" };
        return { name: "Shrimp (🦐)", icon: "🦐", color: "text-slate-400" };
    }

    if (type.includes("typo") || type.includes("type")) {
        if (score >= 90) return { name: "Alien (👽)", icon: "👽", color: "text-purple-400" };
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
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'report' | 'leaderboard'>('report');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [isLoadingLb, setIsLoadingLb] = useState(false);

    // Support for shared results via URL
    const isShareMode = searchParams.get('share') === 'true';
    const sharedScore = parseInt(searchParams.get('score') || '0');
    const sharedGame = searchParams.get('game') || '';
    const sharedTier = searchParams.get('tier') || '';

    const effectiveIsOpen = isOpen || isShareMode;
    const displayScore = isShareMode && !isOpen ? sharedScore : score;
    const displayGameType = isShareMode && !isOpen ? sharedGame : gameType;

    const tier = getTier(displayGameType, displayScore);
    const backendGameId = GAME_ID_MAP[displayGameType] || displayGameType.toLowerCase().replace(/ /g, '_');

    useEffect(() => {
        if (effectiveIsOpen) {
            // Always fetch leaderboard on open (for desktop view compatibility)
            setIsLoadingLb(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5328';
            fetch(`${apiUrl}/api/leaderboard?game_type=${backendGameId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setLeaderboard(data);
                })
                .catch(err => console.error("Failed to load leaderboard", err))
                .finally(() => setIsLoadingLb(false));
        }
    }, [effectiveIsOpen, backendGameId]);

    // Reset tab on open
    useEffect(() => {
        if (effectiveIsOpen) setActiveTab('report');
    }, [effectiveIsOpen]);

    const handleRetry = () => {
        if (isShareMode) {
            // Clear search params on retry/challenge
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
        onRetry();
    };

    if (!effectiveIsOpen) return null;

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
                    className="bg-slate-900 border border-slate-700 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm md:max-w-5xl text-center relative overflow-hidden"
                >
                    {/* Background Shine */}
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 blur-[80px]" />
                    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-rose-500/20 blur-[80px]" />

                    {/* Header */}
                    <div className="relative mb-6">
                        {isShareMode && !isOpen && (
                            <div className="flex items-center justify-center gap-2 mb-2 py-1 px-4 bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] w-fit mx-auto shadow-lg shadow-indigo-500/20">
                                <Swords size={12} strokeWidth={3} />
                                Challenge Received
                            </div>
                        )}
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase">{displayGameType}</h2>

                        {/* Tabs (Mobile Only) */}
                        <div className="flex justify-center mt-4 bg-slate-800 p-1 rounded-full w-full md:hidden">
                            <button
                                onClick={() => setActiveTab('report')}
                                className={`flex-1 py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                    ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
                                `}
                            >
                                Report
                            </button>
                            <button
                                onClick={() => setActiveTab('leaderboard')}
                                className={`flex-1 py-1.5 px-4 rounded-full text-xs font-bold uppercase tracking-wider transition-all
                                    ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}
                                `}
                            >
                                Leaderboard
                            </button>
                        </div>
                    </div>

                    {/* TWO COLUMN GRID FOR DESKTOP */}
                    <div className="flex flex-col md:flex-row gap-8 text-left">

                        {/* LEFT COLUMN: REPORT (Visible on Mobile Report Tab OR Desktop) */}
                        <div className={`${activeTab === 'report' ? 'block' : 'hidden'} md:block flex-1`}>

                            {/* Score Card */}
                            <div id="score-card-capture" className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-700 relative overflow-hidden text-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-slate-400 text-xs uppercase font-bold mb-2">
                                        {isShareMode && !isOpen ? "Goal to Beat" : "Final Score"}
                                    </span>
                                    <div className="text-6xl font-black text-white leading-none tracking-tighter mb-2">
                                        {displayScore}
                                        <span className="text-lg text-slate-500 ml-1 font-medium">{unit}</span>
                                    </div>
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

                            {/* Share & Buttons */}
                            <div className="mb-4">
                                {(() => {
                                    // Robust base title matching: find the longest key that matches displayGameType
                                    const matchingKeys = Object.keys(GAME_URL_MAP).filter(key => displayGameType.includes(key));
                                    const baseGameTitle = matchingKeys.sort((a, b) => b.length - a.length)[0] || displayGameType;

                                    const basePath = GAME_URL_MAP[baseGameTitle] || "/";
                                    const shareUrl = `${basePath}?share=true&score=${displayScore}&game=${encodeURIComponent(displayGameType)}&tier=${encodeURIComponent(tier.name)}`;

                                    return (
                                        <ShareResult
                                            gameTitle={displayGameType}
                                            score={`${displayScore} ${unit}`}
                                            tier={`${tier.icon} ${tier.name}`}
                                            gameUrl={shareUrl}
                                        />
                                    );
                                })()}
                            </div>

                            {/* Challenge Banner */}
                            {isShareMode && !isOpen && (
                                <div className="bg-slate-800/80 rounded-xl p-4 mb-4 border border-indigo-500/30 text-center animate-pulse">
                                    <p className="text-indigo-400 font-bold text-xs uppercase tracking-wider">
                                        Can you do better?
                                    </p>
                                    <p className="text-slate-500 text-[10px] mt-1 italic">
                                        Click START to take the challenge
                                    </p>
                                </div>
                            )}

                            {/* Navigation Buttons (Desktop: Bottom of Left Col, Mobile: Bottom of Modal) */}
                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
                                <button
                                    onClick={handleRetry}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20"
                                >
                                    {isShareMode && !isOpen ? <Swords className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                    <span>{isShareMode && !isOpen ? 'START' : 'Retry'}</span>
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

                        {/* RIGHT COLUMN: LEADERBOARD (Visible on Mobile Leaderboard Tab OR Desktop) */}
                        <div className={`${activeTab === 'leaderboard' ? 'block' : 'hidden'} md:block flex-1 md:border-l md:border-slate-800 md:pl-8`}>
                            <h3 className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-500" />
                                Global Leaderboard
                            </h3>

                            {isLoadingLb ? (
                                <div className="flex items-center justify-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div className="text-slate-500 text-sm py-10 text-center">No records. Be the first!</div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                    {leaderboard.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between p-3 rounded-lg border 
                                                ${idx === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                                    idx === 1 ? 'bg-slate-700/50 border-slate-600' :
                                                        idx === 2 ? 'bg-orange-700/20 border-orange-700/30' :
                                                            'bg-slate-800/30 border-slate-800'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0
                                                     ${idx === 0 ? 'bg-yellow-500 text-black' :
                                                        idx === 1 ? 'bg-slate-400 text-black' :
                                                            idx === 2 ? 'bg-orange-600 text-white' :
                                                                'bg-slate-700 text-slate-400'}
                                                `}>
                                                    {idx + 1}
                                                </div>
                                                <div className="flex flex-col items-start min-w-0">
                                                    <span className={`text-sm font-bold truncate ${idx === 0 ? 'text-yellow-400' : 'text-slate-200'}`}>
                                                        {entry.user_id.split('_')[0] || 'Unknown'}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500 truncate">#{entry.user_id.slice(-4)}</span>
                                                        {entry.tier && (
                                                            <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">{entry.tier}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="font-mono font-bold text-white shrink-0">
                                                {entry.best_score}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Mobile Only Navigation Buttons (Repeated because they shouldn't be inside Right Col on desktop) */}
                            {/* Actually, Navigation is in Left Col on Desktop. On Mobile, if we are in Leaders tab, we might need Nav. */}
                            {/* But standard UI pattern: Nav is usually sticky or at bottom. */}
                            {/* Let's replicate Nav buttons for Mobile Leaderboard Tab convenience */}
                            <div className="md:hidden grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
                                <button
                                    onClick={handleRetry}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    {isShareMode && !isOpen ? <Swords className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                                    <span>{isShareMode && !isOpen ? 'START' : 'Retry'}</span>
                                </button>
                                <button
                                    onClick={() => router.push('/')}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Home</span>
                                </button>
                            </div>
                        </div>

                    </div>

                    {children && (
                        <div className="mt-2 text-xs text-slate-600">
                            {/* Optional children content */}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
