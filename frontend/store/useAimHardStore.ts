import { create } from 'zustand';

export interface AimHardState {
    isPlaying: boolean;
    isGameOver: boolean;

    score: number;
    lives: number;
    level: number;

    // Difficulty Factors
    spawnRate: number; // ms betweeen checks? Or just logic-based

    // Actions
    startGame: () => void;
    stopGame: () => void;
    setGameOver: () => void;

    addScore: (points: number) => void;
    loseLife: (amount: number) => void;
    incrementLevel: () => void;
}

export const useAimHardStore = create<AimHardState>((set, get) => ({
    isPlaying: false,
    isGameOver: false,
    score: 0,
    lives: 3,
    level: 1,
    spawnRate: 1000,

    startGame: () => {
        set({
            isPlaying: true,
            isGameOver: false,
            score: 0,
            lives: 3,
            level: 1
        });
    },

    stopGame: () => {
        set({ isPlaying: false });
    },

    setGameOver: () => {
        set({ isPlaying: false, isGameOver: true });
    },

    addScore: (points) => {
        const { score, level } = get();
        const newScore = score + points;
        set({ score: newScore });

        // Level Up Logic: Every 1000 points
        if (Math.floor(newScore / 1000) > Math.floor(score / 1000)) {
            get().incrementLevel();
        }
    },

    loseLife: (amount) => {
        const { lives } = get();
        const newLives = lives - amount;
        if (newLives <= 0) {
            set({ lives: 0 });
            get().setGameOver();
        } else {
            set({ lives: newLives });
        }
    },

    incrementLevel: () => {
        set((state) => ({ level: state.level + 1 }));
    }
}));
