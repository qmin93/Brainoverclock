"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useHighScore } from "@/hooks/useHighScore";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface GameColumnProps {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    colorClass: string;
    storageKey: string;
    unit: string;
    children?: ReactNode;
}

export function GameColumn({
    title,
    description,
    href,
    icon: Icon,
    colorClass,
    storageKey,
    unit,
    children,
}: GameColumnProps) {
    const score = useHighScore(storageKey);
    const router = useRouter();

    const handleCardClick = () => {
        router.push(href);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`flex-1 group relative overflow-hidden cursor-pointer ${colorClass}`}
        >
            <motion.div
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />

            <div className="h-full flex flex-col items-center justify-center gap-8 p-8 text-center z-10 relative">
                <div className="flex flex-col items-center gap-6">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="p-4 bg-white/20 rounded-full backdrop-blur-sm"
                    >
                        <Icon className="w-12 h-12" />
                    </motion.div>

                    <h2 className="text-5xl font-bold tracking-tight">{title}</h2>
                    <p className="opacity-80 text-xl max-w-xs leading-relaxed">{description}</p>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <div className="text-sm font-bold uppercase tracking-widest opacity-60">
                        Personal Best
                    </div>
                    <div className="text-4xl font-mono font-black">
                        {score ? `${score} ${unit}` : <span className="opacity-40">--</span>}
                    </div>
                </div>

                {children && (
                    <div onClick={(e) => e.stopPropagation()} className="relative z-20">
                        {children}
                    </div>
                )}

                <motion.div
                    className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0"
                >
                    <span className="bg-black/20 backdrop-blur-md px-8 py-3 rounded-full font-bold text-sm tracking-wide border border-white/20">
                        PLAY NOW
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
