import { create } from 'zustand';

interface Block {
    id: number;
    x: number;
    y: number;
    state: 'visible' | 'hidden' | 'solved';
    isDummy?: boolean;
}

interface ChimpHardState {
    level: number;       // Number of correct blocks (starts at 4)
    status: 'idle' | 'memorize' | 'recall' | 'result';
    blocks: Block[];
    nextExpectedNumber: number;
    exposureTime: number; // ms

    startGame: () => void;
    startRecall: () => void; // Called manually or by timeout
    clickBlock: (id: number) => void;
    resetGame: () => void;
    nextLevel: () => void;
}

const generateBlocks = (count: number): Block[] => {
    // Difficulty curve: Add dummies as level increases
    let dummyCount = 0;
    if (count >= 18) dummyCount = 3;
    else if (count >= 13) dummyCount = 2;
    else if (count >= 8) dummyCount = 1;

    const totalItems = count + dummyCount;
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

    return positions.slice(0, totalItems).map((pos, index) => {
        // Items 0 to count-1 are Real (id 1..count)
        // Items count to totalItems-1 are Dummies (id 1000+)
        if (index < count) {
            return {
                id: index + 1,
                x: pos.x,
                y: pos.y,
                state: 'visible',
                isDummy: false
            };
        } else {
            return {
                id: 1000 + (index - count), // Dummy ID
                x: pos.x,
                y: pos.y,
                state: 'visible',
                isDummy: true
            };
        }
    });
};

const calculateExposureTime = (count: number) => {
    // Lv 1 (4): 1000ms
    // Lv 5 (9): 2000ms
    // Slope: (2000-1000)/(9-4) = 200ms per item
    // Lv 10 (14): 1000 + 10*200 = 3000ms.
    // PRD says 2.5s for 14.
    // Let's use 150ms per item + base.
    // Base 400ms + (Count * 150ms).
    // 4 items: 400 + 600 = 1000ms. Perfect.
    // 9 items: 400 + 1350 = 1750ms. Close to 2.0s.
    // 14 items: 400 + 2100 = 2500ms. Perfect match with PRD.
    return 400 + (count * 150);
};

export const useChimpHardStore = create<ChimpHardState>((set, get) => ({
    level: 4,
    status: 'idle',
    blocks: [],
    nextExpectedNumber: 1,
    exposureTime: 1000,

    startGame: () => {
        const startCount = 4;
        set({
            level: startCount,
            status: 'memorize',
            blocks: generateBlocks(startCount),
            nextExpectedNumber: 1,
            exposureTime: calculateExposureTime(startCount)
        });
    },

    resetGame: () => {
        get().startGame();
    },

    startRecall: () => {
        const { status, blocks } = get();
        if (status !== 'memorize') return;

        // Hide all blocks
        const newBlocks = blocks.map(b => ({ ...b, state: 'hidden' as const }));
        set({
            status: 'recall',
            blocks: newBlocks
        });
    },

    nextLevel: () => {
        const nextLvl = get().level + 1;
        set({
            level: nextLvl,
            status: 'memorize',
            blocks: generateBlocks(nextLvl),
            nextExpectedNumber: 1,
            exposureTime: calculateExposureTime(nextLvl)
        });
    },

    clickBlock: (id: number) => {
        const { nextExpectedNumber, blocks, status } = get();

        if (status === 'result') return;

        // In Hard Mode, clicking during Memorize might be allowed to skip wait?
        // PRD: "사용자가 클릭하지 않아도... 시간이 다 되면...".
        // Usually standard Chimp: if you click '1', it starts.
        // Hard Mode Flash: The numbers just appear. Trigger timer.
        // If user clicks correct number, we can facilitate.

        if (status === 'memorize') {
            // If user clicks 1, we enter recall immediately?
            // "사용자가 클릭하지 않아도...". 
            // Let's assume user CAN preemptively start by clicking 1.
            if (id === 1) {
                // Force recall mode immediately, handle logic
                // Actually, Phase 2 starts logic.
                // If I click 1:
                // 1 becomes solved. Others hidden. Status Recall.
                const newBlocks = blocks.map((b) => {
                    if (b.id === 1) return { ...b, state: 'solved' as const };
                    return { ...b, state: 'hidden' as const };
                });
                set({
                    status: 'recall',
                    blocks: newBlocks,
                    nextExpectedNumber: 2
                });
                return;
            } else {
                // Clicking wrong number during memorize?
                // Maybe ignore or Fail?
                // Let's ignore to be kind, or Fail if strictly "Flash".
                // PRD doesn't specify. I'll ignore.
                return;
            }
        }

        if (id === nextExpectedNumber) {
            // Correct
            const newBlocks = blocks.map((b) =>
                b.id === id ? { ...b, state: 'solved' as const } : b
            );

            const isLevelComplete = newBlocks.every((b) => b.state === 'solved');

            if (isLevelComplete) {
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
                    nextExpectedNumber: nextExpectedNumber + 1,
                });
            }
        } else {
            // Incorrect -> Sudden Death (1 Strike)
            set({ status: 'result' });
        }
    },
}));
