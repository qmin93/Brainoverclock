import { useState, useCallback } from 'react';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export function useGameState() {
    const [gameState, setGameState] = useState<GameStatus>('waiting');
    const [score, setScore] = useState<number>(1);

    const startGame = useCallback(() => {
        setGameState('playing');
        setScore(1);
    }, []);

    const endGame = useCallback(async (isWin: boolean = false) => {
        setGameState('finished');

        // 점수 저장 로직 추가!
        if (isWin || score > 0) { // 점수가 있을 때만 저장
            try {
                await fetch("http://127.0.0.1:5000/api/submit-score", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: "Player1", // 나중에는 유저 닉네임 입력받게 수정
                        score: score,
                        tier: "Alien" // 현재 티어 계산해서 넣기
                    }),
                });
                console.log("점수 제출 성공!");
            } catch (error) {
                console.error("서버 연결 실패:", error);
            }
        }
    }, [score]);

    return {
        gameState,
        score,
        setScore,
        startGame,
        endGame,
    };
}
