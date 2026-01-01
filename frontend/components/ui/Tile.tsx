"use client";

import { motion } from "framer-motion";

interface TileProps {
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    isDummy?: boolean;
    isDummyActive?: boolean;
}

export function Tile({ isActive, onClick, disabled, isDummy, isDummyActive }: TileProps) {
    return (
        <motion.div
            className={`w-24 h-24 sm:w-32 sm:h-32 rounded-xl cursor-pointer transition-colors duration-200 border-2 ${isActive
                    ? "bg-white border-white shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                    : isDummyActive
                        ? "bg-red-500 border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                        : isDummy
                            ? "bg-red-900/20 border-red-900/30"
                            : "bg-white/5 border-transparent hover:bg-white/10"
                }`}
            onClick={!disabled ? onClick : undefined}
            animate={{
                scale: isActive || isDummyActive ? 1.05 : 1,
            }}
            transition={{ duration: 0.1 }}
        />
    );
}
