"use client";

import { motion } from "framer-motion";

interface TileProps {
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export function Tile({ isActive, onClick, disabled }: TileProps) {
    return (
        <motion.div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl cursor-pointer transition-colors duration-200 ${isActive
                    ? "bg-white shadow-[0_0_30px_rgba(255,255,255,0.6)]"
                    : "bg-white/10 hover:bg-white/15 active:bg-white/20"
                }`}
            onClick={!disabled ? onClick : undefined}
            animate={{
                scale: isActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.1 }}
        />
    );
}
