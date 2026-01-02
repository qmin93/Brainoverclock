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
    // 1. 공유할 텍스트 생성 함수
    const getShareText = () => {
        const baseUrl = typeof window !== 'undefined'
            ? window.location.origin
            : "https://brainoverclock-frontend-8h7h.vercel.app";

        const urlToShare = gameUrl
            ? `${baseUrl}${gameUrl}`
            : baseUrl;

        return `🧠 **BRAIN OVERCLOCK CHALLENGE** 🧠\n\n` +
            `🎮 Game: ${gameTitle}\n` +
            `🏆 Score: ${score}\n` +
            `🎖️ Tier: ${tier}\n\n` +
            `Can you beat my score? 😎\n` +
            `Challenge now! 👇\n${urlToShare}`;
    };

    // Unified Handler with Image Capture
    const handleHybridAction = async () => {
        const text = getShareText();
        let imageBlob: Blob | null = null;

        // 1. Capture Image
        try {
            const html2canvas = (await import('html2canvas')).default;
            const element = document.getElementById("score-card-capture");

            if (element) {
                const canvas = await html2canvas(element, {
                    backgroundColor: '#1e293b', // bg-slate-800
                    scale: 3,
                    useCORS: true,
                    logging: false
                });
                imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            }
        } catch (e) {
            console.error("Image capture failed", e);
        }

        // 2. Try Copy Image to Clipboard
        let copied = false;
        if (imageBlob) {
            try {
                // ClipboardItem API requires secure context (HTTPS)
                const item = new ClipboardItem({ 'image/png': imageBlob });
                await navigator.clipboard.write([item]);
                toast.success("Result Card Copied! 📸 Ready to paste.");
                copied = true;
            } catch (err) {
                console.warn("Image copy failed, falling back to text.", err);
            }
        }

        // 3. Fallback: Copy Text
        if (!copied) {
            try {
                await navigator.clipboard.writeText(text);
                toast.success("Result Text Copied! 🔥");
            } catch (err) {
                toast.error("Failed to copy.");
            }
        }

        // 4. Native Share (Mobile) - Share Image File
        if (navigator.share && imageBlob) {
            const file = new File([imageBlob], "brain-overclock-result.png", { type: "image/png" });
            const shareData: ShareData = {
                files: [file],
                title: `Brain Overclock: ${gameTitle}`,
                text: text,
            };

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    // Ignore abort
                }
            }
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
