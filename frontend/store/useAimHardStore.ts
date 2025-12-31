import { create } from 'zustand';

export type TargetType = 'enemy' | 'hostage';

export interface Target {
    id: number;
    x: number;      // 0 ~ 90% (to fit in container)
    y: number;      // 0 ~ 90%
    type: TargetType;
    spawnTime: number;
}

interface AimHardState {
    score: number;
    lives: number;
    isPlaying: boolean;
    isGameOver: boolean;
    targets: Target[];
    nextId: number;

    level: number;
    spawnInterval: number; // ms
    lifespan: number; // ms
    hostageChance: number; // 0.0 ~ 1.0

    // Actions
    startGame: () => void;
    stopGame: () => void;
    handleClick: (id: number) => void;
    handleMiss: (id: number) => void; // Called when target times out
    spawnTarget: () => void;
    gameLoopTick: (now: number) => void; // External loop calls this
}

export const useAimHardStore = create<AimHardState>((set, get) => ({
    score: 0,
    lives: 3,
    isPlaying: false,
    isGameOver: false,
    targets: [],
    nextId: 1,

    level: 1,
    spawnInterval: 1000,
    lifespan: 2000,
    hostageChance: 0.2,

    startGame: () => {
        set({
            score: 0,
            lives: 3,
            isPlaying: true,
            isGameOver: false,
            targets: [],
            nextId: 1,
            level: 1,
            spawnInterval: 1000,
            lifespan: 2000,
            hostageChance: 0.2,
        });
    },

    stopGame: () => {
        set({ isPlaying: false, isGameOver: true });
    },

    spawnTarget: () => {
        const { hostageChance, nextId, targets } = get();
        // Safety cap
        if (targets.length > 20) return;

        // Random Pos
        const x = Math.random() * 85 + 5; // 5% to 90%
        const y = Math.random() * 80 + 10; // 10% to 90%

        const type: TargetType = Math.random() < hostageChance ? 'hostage' : 'enemy';

        const newTarget: Target = {
            id: nextId,
            x,
            y,
            type,
            spawnTime: performance.now()
        };

        set({
            targets: [...targets, newTarget],
            nextId: nextId + 1
        });
    },

    handleClick: (id: number) => {
        const { targets, score, lives } = get();
        const target = targets.find(t => t.id === id);
        if (!target) return;

        const newTargets = targets.filter(t => t.id !== id);

        if (target.type === 'enemy') {
            // Success
            // Level Progression Logic
            const newScore = score + 100;
            let { level, spawnInterval, lifespan, hostageChance } = get();

            // Every 1000 points (10 enemies) -> Level Up
            if (Math.floor(newScore / 1000) > Math.floor(score / 1000)) {
                level++;
                // Max Level Cap
                if (level <= 10) {
                    spawnInterval = Math.max(400, 1000 - (level * 60));
                    lifespan = Math.max(800, 2000 - (level * 100));
                    hostageChance = Math.min(0.5, 0.2 + (level * 0.03));
                }
            }

            set({
                score: newScore,
                targets: newTargets,
                level,
                spawnInterval,
                lifespan,
                hostageChance
            });
        } else {
            // Hostage -> Penalty
            // Option A (Hard): Game Over
            set({
                lives: 0,
                isPlaying: false,
                isGameOver: true,
                score: Math.max(0, score - 500) // Optional penalty before death?
            });
        }
    },

    handleMiss: (id: number) => {
        const { targets, lives } = get();
        const target = targets.find(t => t.id === id);
        if (!target) return; // Already clicked/gone

        const newTargets = targets.filter(t => t.id !== id);

        if (target.type === 'enemy') {
            // Enemy escaped -> Life -1
            const newLives = lives - 1;
            if (newLives <= 0) {
                set({
                    lives: 0,
                    isPlaying: false,
                    isGameOver: true,
                    targets: []
                });
            } else {
                set({
                    targets: newTargets,
                    lives: newLives
                });
            }
        } else {
            // Hostage escaped -> Good!
            set({ targets: newTargets });
        }
    },

    gameLoopTick: (now: number) => {
        const { targets, lifespan, handleMiss } = get();

        targets.forEach(t => {
            if (now - t.spawnTime > lifespan) {
                handleMiss(t.id);
            }
        });
    }
}));
