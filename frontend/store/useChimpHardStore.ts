import { create } from 'zustand';

export interface Block {
    id: number;
    value: number; // 1, 2, 3...
    isDummy: boolean; // if true, do not click
    x: number; // Grid col
    y: number; // Grid row
    isVisible: boolean; // For clicked handling
}

type Phase = 'IDLE' | 'INSTRUCTION' | 'MEMORIZE' | 'ACTION' | 'GAME_OVER';

interface ChimpHardState {
    // Stats
    level: number;
    score: number;
    lives: number;

    // Game State
    phase: Phase;
    blocks: Block[];
    gridSize: number; // e.g. 6 (6x6)

    // Chaos Factors per round
    rotation: 0 | 90 | 180 | 270;
    isReverse: boolean;

    // Logic State
    nextExpected: number;
    remainingTargets: number;

    // Actions
    startGame: () => void;
    startRound: () => void; // Call after instruction
    startAction: () => void; // Call after memorize
    clickBlock: (id: number) => void;
    resetGame: () => void;
}

const getRotatedPosition = (x: number, y: number, size: number, deg: number) => {
    // 0 -> x, y
    // 90 -> size-1-y, x
    // 180 -> size-1-x, size-1-y
    // 270 -> y, size-1-x
    switch (deg) {
        case 90: return { x: size - 1 - y, y: x };
        case 180: return { x: size - 1 - x, y: size - 1 - y };
        case 270: return { x: y, y: size - 1 - x };
        default: return { x, y };
    }
};

export const useChimpHardStore = create<ChimpHardState>((set, get) => ({
    level: 1,
    score: 0,
    lives: 3,
    phase: 'IDLE',
    blocks: [],
    gridSize: 8, // 8x8 Grid
    rotation: 0,
    isReverse: false,
    nextExpected: 1,
    remainingTargets: 0,

    startGame: () => {
        set({
            level: 1,
            score: 0,
            lives: 3,
            phase: 'IDLE',
            blocks: [],
            gridSize: 8
        });
        get().startRound(); // Initial round
    },

    resetGame: () => {
        set({ phase: 'IDLE', blocks: [], score: 0, lives: 3, level: 1 });
    },

    startRound: () => {
        const { level } = get();

        // Difficulty Curve
        const targetCount = Math.min(20, 4 + Math.floor((level - 1) / 2)); // 4, 4, 5, 5, 6...
        const dummyCount = level >= 3 ? Math.floor(level / 2) : 0; // Starts from Lv 3

        // Chaos Probability
        let rotation: 0 | 90 | 180 | 270 = 0;
        let isReverse = false;

        // Rotation starts Lv 5
        if (level >= 5) {
            const r = Math.random();
            if (r < 0.3) rotation = 90;
            else if (r < 0.6) rotation = 180;
            else if (r < 0.8) rotation = 270;
        }

        // Reverse starts Lv 8
        if (level >= 8 && Math.random() < 0.4) {
            isReverse = true;
        }

        // Generate Blocks
        const size = 8;
        const total = targetCount + dummyCount;
        const positions = new Set<string>();
        const blocks: Block[] = [];

        // Generate Targets
        for (let i = 1; i <= targetCount; i++) {
            let x, y, key;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
                key = `${x},${y}`;
            } while (positions.has(key));
            positions.add(key);
            blocks.push({ id: Math.random(), value: i, isDummy: false, x, y, isVisible: true });
        }

        // Generate Dummies
        for (let i = 0; i < dummyCount; i++) {
            let x, y, key;
            do {
                x = Math.floor(Math.random() * size);
                y = Math.floor(Math.random() * size);
                key = `${x},${y}`;
            } while (positions.has(key));
            positions.add(key);
            // Dummies have random high values or generic symbol
            blocks.push({ id: Math.random(), value: 99 + i, isDummy: true, x, y, isVisible: true });
        }

        set({
            phase: 'INSTRUCTION',
            blocks,
            rotation,
            isReverse,
            nextExpected: isReverse ? targetCount : 1,
            remainingTargets: targetCount
        });
    },

    startAction: () => {
        // Transform Phase: Apply Rotation
        const { blocks, rotation, gridSize } = get();

        // Update positions based on rotation
        const newBlocks = blocks.map(b => {
            const { x, y } = getRotatedPosition(b.x, b.y, gridSize, rotation);
            return { ...b, x, y };
        });

        set({
            blocks: newBlocks,
            phase: 'ACTION'
        });
    },

    clickBlock: (id: number) => {
        const { blocks, nextExpected, isReverse, remainingTargets, lives, level, score } = get();
        const block = blocks.find(b => b.id === id);
        if (!block || !block.isVisible) return;

        // Dummy Check
        if (block.isDummy) {
            // Instant Death or Life Penalty? PRD says "누르면 즉시 사망" but also mentions Lives.
            // Let's use Life Penalty -2 (Critical) or Game Over.
            // PRD: "즉시 사망" -> Game Over.
            set({ phase: 'GAME_OVER', lives: 0 });
            return;
        }

        // Sequence Check
        if (block.value === nextExpected) {
            // Correct
            const newBlocks = blocks.map(b => b.id === id ? { ...b, isVisible: false } : b);

            let newRemaining = remainingTargets - 1;
            let newNext = isReverse ? nextExpected - 1 : nextExpected + 1;

            set({ blocks: newBlocks, remainingTargets: newRemaining, nextExpected: newNext });

            if (newRemaining === 0) {
                // Level Complete
                set({ score: score + 100 + (level * 10), level: level + 1 });
                // Delay then next round?
                // For simplicity, wait logic handle in component, store just updates.
                // We will rely on component to call startRound after delay.
                // But safer to set 'IDLE' or keep 'ACTION' and use a timeout in component.
                // Let's set a temp "WIN" status or just directly init next round?
                // Direct init might be abrupt. Let's keep phase ACTION but 0 remaining.
                setTimeout(() => {
                    get().startRound();
                }, 1000);
            }
        } else {
            // Wrong Order
            // Game Over
            set({ phase: 'GAME_OVER', lives: 0 });
        }
    }
}));
