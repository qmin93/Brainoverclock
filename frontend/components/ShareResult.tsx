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
            `제 기록을 넘을 수 있겠어요? 😎\n` +
            `지금 도전해보세요! 👇\n${url}`;
    };

    // 2. 복사 기능 핸들러
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(getShareText());
            toast.success("도전장이 클립보드에 복사되었습니다! 🔥");
        } catch (err) {
            toast.error("복사에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 3. 네이티브 공유 기능 핸들러
    const handleShare = async () => {
        const shareData = {
            title: `Brain Overclock: ${gameTitle}`,
            text: getShareText(),
            url: "https://brain-overclock.vercel.app", // 실제 배포 주소로 변경
        };

        // 브라우저가 공유 API를 지원하는지 확인
        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // 사용자가 공유를 취소한 경우는 에러로 처리하지 않음
                if ((err as Error).name !== "AbortError") {
                    toast.error("공유하기에 실패했습니다.");
                }
            }
        } else {
            // 지원하지 않는 경우 (주로 PC) 복사 기능으로 대체
            handleCopy();
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
            {/* COPY CHALLENGE 버튼 */}
            <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 w-full py-3 font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-200 transition-colors active:scale-95 shadow-lg border border-transparent hover:border-slate-300"
            >
                <Copy size={20} />
                COPY CHALLENGE
            </button>

            {/* Share Result 버튼 */}
            <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 w-full py-3 font-bold text-white bg-slate-700/50 border-2 border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-all active:scale-95"
            >
                <Share2 size={20} />
                Share Result
            </button>
        </div>
    );
}
