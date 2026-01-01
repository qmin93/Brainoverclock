import { useState, useCallback } from 'react';

export type GameStatus = 'waiting' | 'playing' | 'finished';

export function useGameState() {
    const [gameState, setGameState] = useState<GameStatus>('waiting');
    const [score, setScore] = useState<number>(1);

    const startGame = useCallback(() => {
        setGameState('playing');
        setScore(1);
    }, []);

    const endGame = useCallback((success: boolean = false) => {
        setGameState('finished');
    }, []);

    return {
        gameState,
        score,
        setScore,
        startGame,
        endGame,
    };
}
