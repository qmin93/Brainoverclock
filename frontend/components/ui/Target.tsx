"use client";

import { motion } from "framer-motion";
import { MouseEventHandler } from "react";

interface TargetProps {
    top: number;
    left: number;
    onMouseDown: MouseEventHandler<HTMLDivElement>;
    size?: number;
}

export function Target({ top, left, onMouseDown, size = 48 }: TargetProps) {
    return (
        <motion.div
            className="absolute cursor-pointer flex items-center justify-center"
            style={{
                top: `${top}%`,
                left: `${left}%`,
                width: size,
                height: size,
                marginLeft: -(size / 2),
                marginTop: -(size / 2)
            }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onMouseDown(e);
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg overflow-visible">
                <circle cx="50" cy="50" r="45" fill="#e11d48" stroke="white" strokeWidth="5" />
                <circle cx="50" cy="50" r="30" fill="white" />
                <circle cx="50" cy="50" r="15" fill="#e11d48" />
            </svg>
        </motion.div>
    );
}
