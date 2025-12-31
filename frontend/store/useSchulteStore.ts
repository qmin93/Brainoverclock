import { create } from 'zustand';

export type SchulteMode = 'normal' | 'dynamic' | 'mixed';

export interface GridItem {
    id: string; // Unique ID for Framer Motion layout to work well
    value: string;
    cleared: boolean;
}

interface SchulteState {
    mode: SchulteMode;
    grid: GridItem[];
    sequence: string[]; // The expected order
    currentIndex: number;

    status: 'idle' | 'playing' | 'finished';
    startTime: number;
    finalTime: number;

    // Actions
    setMode: (mode: SchulteMode) => void;
    startGame: () => void;
    clickItem: (id: string) => void;
    resetGame: () => void;
}

// Utility to shuffle
const shuffle = <T>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const generateSequence = (mode: SchulteMode): string[] => {
    if (mode === 'mixed') {
        const seq = [];
        const alphabets = "ABCDEFGHIJKL"; // 12
        for (let i = 1; i <= 13; i++) {
            seq.push(String(i));
            if (i <= 12) seq.push(alphabets[i - 1]);
        }
        return seq;
    } else {
        // Normal/Dynamic: 1 to 25
        return Array.from({ length: 25 }, (_, i) => String(i + 1));
    }
};

export const useSchulteStore = create<SchulteState>((set, get) => ({
    mode: 'normal',
    grid: [],
    sequence: [],
    currentIndex: 0,
    status: 'idle',
    startTime: 0,
    finalTime: 0,

    setMode: (mode) => set({ mode }),

    startGame: () => {
        const { mode } = get();
        const fullSequence = generateSequence(mode);
        const shuffledGrid = shuffle(fullSequence).map(val => ({
            id: `item-${val}`,
            value: val,
            cleared: false
        }));

        set({
            sequence: fullSequence,
            grid: shuffledGrid,
            currentIndex: 0,
            status: 'playing',
            startTime: performance.now(),
            finalTime: 0
        });
    },

    clickItem: (id) => {
        const { grid, sequence, currentIndex, status, mode, startTime } = get();
        if (status !== 'playing') return;

        const item = grid.find(i => i.id === id);
        if (!item || item.cleared) return;

        const expectedValue = sequence[currentIndex];

        if (item.value === expectedValue) {
            // Correct
            const nextIndex = currentIndex + 1;

            let newGrid = grid.map(i => i.id === id ? { ...i, cleared: true } : i);

            if (mode === 'dynamic') {
                // Shuffle the uncleared items
                const uncleared = newGrid.filter(i => !i.cleared);
                const cleared = newGrid.filter(i => i.cleared);
                const shuffledUncleared = shuffle(uncleared);
                newGrid = [...cleared, ...shuffledUncleared];
            }

            if (nextIndex === sequence.length) {
                // Finished
                set({
                    grid: newGrid,
                    currentIndex: nextIndex,
                    status: 'finished',
                    finalTime: performance.now() - startTime
                });
            } else {
                set({
                    grid: newGrid,
                    currentIndex: nextIndex
                });
            }
        } else {
            // Wrong click
            // Visual feedback handled in component, store just tracks state
        }
    },

    resetGame: () => {
        set({ status: 'idle', grid: [], currentIndex: 0 });
    }
}));
