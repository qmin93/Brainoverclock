"use client";

import React from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner"; // 토스트 메시지를 위해 sonner 사용 (설치 필요)

interface ShareResultProps {
    gameTitle: string;
    score: number | string;
    tier: string;
    gameUrl?: string; // 게임별 고유 URL이 있다면 사용
}

export default function ShareResult({ gameTitle, score, tier, gameUrl }: ShareResultProps) {
    // 1. 공유할 텍스트 생성 함수 (더 꾸며진 버전)
    const getShareText = () => {
        const baseUrl = "https://brain-overclock.vercel.app";
        const url = gameUrl ? `${baseUrl}${gameUrl}` : baseUrl;

        return `🧠 **Brain Overclock Challenge!** 🧠\n\n` +
            `🎮 Game: ${gameTitle}\n` +
            `🏆 Score: ${score}\n` +
            `🎖️ Tier: ${tier}\n\n` +
            `Can you beat my score? 😎\n` +
            `Challenge now! 👇\n${url}`;
    };

    // Unified Handler
    const handleHybridAction = async () => {
        const shareData = {
            title: `Brain Overclock: ${gameTitle}`,
            text: getShareText(),
            url: "https://brain-overclock.vercel.app",
        };

        // 1. Try Native Share (Mobile)
        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return; // Shared manually
            } catch (err) {
                // Ignore user abort, proceed to copy if error wasn't abort
                if ((err as Error).name === "AbortError") return;
            }
        }

        // 2. Fallback to Copy (PC or Share failed)
        try {
            await navigator.clipboard.writeText(getShareText());
            toast.success("Copy complete! Ready to share. 🔥");
        } catch (err) {
            toast.error("Failed to copy.");
        }
    };

    return (
        <div className="w-full max-w-xs mx-auto">
            <button
                onClick={handleHybridAction}
                className="flex items-center justify-center gap-2 w-full py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/30 uppercase text-sm"
            >
                <Share2 size={20} />
                COPY AND SHARE THE RESULT
            </button>
        </div>
    );
}
