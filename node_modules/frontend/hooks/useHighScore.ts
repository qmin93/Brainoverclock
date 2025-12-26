"use client";

import { useState, useEffect } from "react";

export function useHighScore(key: string) {
    const [score, setScore] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(key);
            setScore(saved);
        }
    }, [key]);

    return score;
}
