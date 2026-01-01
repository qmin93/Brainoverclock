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
            className={`group relative overflow-hidden cursor-pointer min-h-[220px] rounded-[2rem] flex flex-col ${colorClass}`}
        >
            <motion.div
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />

            <div className="h-full flex flex-col items-center justify-center gap-4 p-4 text-center z-10 relative">
                <div className="flex flex-col items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="p-3 bg-white/20 rounded-full backdrop-blur-sm"
                    >
                        <Icon className="w-8 h-8" />
                    </motion.div>

                    <h2 className="text-2xl font-black tracking-tight uppercase leading-none">{title}</h2>
                    <p className="opacity-70 text-xs max-w-[180px] leading-tight line-clamp-2">{description}</p>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        Best
                    </div>
                    <div className="text-xl font-mono font-black">
                        {score ? `${score}${unit}` : <span className="opacity-40">--</span>}
                    </div>
                </div>

                {children && (
                    <div onClick={(e) => e.stopPropagation()} className="relative z-20">
                        {children}
                    </div>
                )}

                <motion.div
                    className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                >
                    <span className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full font-black text-[10px] tracking-widest border border-white/20 uppercase">
                        Launch
                    </span>
                </motion.div>
            </div>
        </div>
    );
}
