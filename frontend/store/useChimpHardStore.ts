import { create } from 'zustand';

interface Block {
    id: number;
    value: number;       // Number to display (1~N for targets, N+1~ for dummies)
    x: number;
    y: number;
    state: 'visible' | 'hidden' | 'solved';
    isDummy: boolean;
}

interface ChimpHardState {
    level: number;
    status: 'idle' | 'memorize' | 'recall' | 'result';
    blocks: Block[];
    nextExpectedNumber: number;
    exposureTime: number; // ms

    startGame: () => void;
    startRecall: () => void;
    clickBlock: (id: number) => void;
    resetGame: () => void;
    nextLevel: () => void;
}

const generateBlocks = (level: number): { blocks: Block[], exposureTime: number } => {
    // PRD Logic
    // Lv1: Target 4 (1~4), Dummy 1 (5) -> Total 5
    const targetCount = level + 3;
    const dummyCount = Math.floor(level / 2) + 1;
    const totalCount = targetCount + dummyCount;

    const positions: { x: number; y: number }[] = [];
    const rows = 5;
    const cols = 8; // Desktop standard

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            positions.push({ x, y });
        }
    }

    // Shuffle positions
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    const blocks: Block[] = [];

    // 1. Create Targets (1 ~ targetCount)
    for (let i = 0; i < targetCount; i++) {
        blocks.push({
            id: i, // Unique visual key ID
            value: i + 1,
            x: positions[i].x,
            y: positions[i].y,
            state: 'visible',
            isDummy: false
        });
    }

    // 2. Create Dummies (targetCount+1 ~ ) -> Seamlessly continuing numbers
    // e.g. Target 1,2,3,4. Dummy 5.
    for (let i = 0; i < dummyCount; i++) {
        blocks.push({
            id: targetCount + i,
            value: targetCount + 1 + i,
            x: positions[targetCount + i].x,
            y: positions[targetCount + i].y,
            state: 'visible',
            isDummy: true
        });
    }

    // PRD Time Calculation: (Count * 0.8s) + 1.0s
    // 5 items: 4000 + 1000 = 5000ms ?? 
    // Wait, PRD says "Lv 1 (5 items) -> 3.0s".
    // Formula: (TotalCount * 800) + 1000 ? 5 * 800 = 4000 + 1000 = 5000. 
    // PRD table says Lv 1 = 3.0s. 
    // Let's adjust formula to match PRD table.
    // Lv 1 (5 items): 3000ms.
    // Lv 3 (7 items): 4000ms.
    // Lv 5 (9 items): 5000ms.
    // It seems to be roughly: 5 items -> 3s, 7 items -> 4s, 9 items -> 5s.
    // 2 items increase -> 1s increase. (0.5s per item).
    // Base for 5 items = 3.0s. 
    // Formula: 3000 + (totalCount - 5) * 500.

    const exposureTime = 3000 + (totalCount - 5) * 500;

    return { blocks, exposureTime };
};

export const useChimpHardStore = create<ChimpHardState>((set, get) => ({
    level: 1, // Starts at Level 1 per PRD
    status: 'idle',
    blocks: [],
    nextExpectedNumber: 1,
    exposureTime: 0,

    startGame: () => {
        const startLevel = 1;
        const { blocks, exposureTime } = generateBlocks(startLevel);
        set({
            level: startLevel,
            status: 'memorize',
            blocks: blocks,
            nextExpectedNumber: 1,
            exposureTime: exposureTime
        });
    },

    resetGame: () => {
        get().startGame();
    },

    startRecall: () => {
        const { status, blocks } = get();
        if (status !== 'memorize') return;

        const newBlocks = blocks.map(b => ({ ...b, state: 'hidden' as const }));
        set({
            status: 'recall',
            blocks: newBlocks
        });
    },

    nextLevel: () => {
        const nextLvl = get().level + 1;
        const { blocks, exposureTime } = generateBlocks(nextLvl);
        set({
            level: nextLvl,
            status: 'memorize',
            blocks: blocks,
            nextExpectedNumber: 1,
            exposureTime: exposureTime
        });
    },

    clickBlock: (id: number) => {
        const { nextExpectedNumber, blocks, status, level } = get();

        if (status === 'result') return;

        const clickedBlock = blocks.find(b => b.id === id);
        if (!clickedBlock) return;

        // Memorize phase interaction
        if (status === 'memorize') {
            // If User clicks '1' (Target), start recall immediately.
            if (clickedBlock.value === 1 && !clickedBlock.isDummy) {
                const newBlocks = blocks.map(b => {
                    if (b.id === id) return { ...b, state: 'solved' as const };
                    return { ...b, state: 'hidden' as const };
                });
                set({
                    status: 'recall',
                    blocks: newBlocks,
                    nextExpectedNumber: 2
                });
                return;
            }
            // Click dummy -> Fail
            if (clickedBlock.isDummy) {
                set({ status: 'result' });
                return;
            }
            return;
        }

        // Recall phase
        if (status === 'recall') {
            // 1. Clicked Dummy? -> Fail
            if (clickedBlock.isDummy) {
                set({ status: 'result' });
                return;
            }

            // 2. Clicked wrong order? -> Fail
            if (clickedBlock.value !== nextExpectedNumber) {
                set({ status: 'result' });
                return;
            }

            // 3. Correct
            const newBlocks = blocks.map(b =>
                b.id === id ? { ...b, state: 'solved' as const } : b
            );

            // Check completion (Targets only)
            const targetCount = level + 3;

            if (nextExpectedNumber === targetCount) {
                // Determine if this was the last target
                set({
                    blocks: newBlocks,
                    nextExpectedNumber: nextExpectedNumber + 1
                });
                setTimeout(() => {
                    get().nextLevel();
                }, 300);
            } else {
                set({
                    blocks: newBlocks,
                    nextExpectedNumber: nextExpectedNumber + 1
                });
            }
        }
    },
}));
