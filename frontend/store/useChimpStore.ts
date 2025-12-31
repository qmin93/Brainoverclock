import { create } from 'zustand';

interface Block {
    id: number;
    x: number;
    y: number;
    state: 'visible' | 'hidden' | 'solved';
}

interface ChimpState {
    level: number;
    strikes: number;
    status: 'idle' | 'playing' | 'result';
    blocks: Block[];
    nextExpectedNumber: number;

    startGame: () => void;
    clickBlock: (id: number) => void;
    resetGame: () => void;
    nextLevel: () => void;
}

const generateBlocks = (count: number): Block[] => {
    const positions: { x: number; y: number }[] = [];
    const rows = 5;
    const cols = 8;

    // Generate all possible positions
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

    return positions.slice(0, count).map((pos, index) => ({
        id: index + 1,
        x: pos.x,
        y: pos.y,
        state: 'visible',
    }));
};

export const useChimpStore = create<ChimpState>((set, get) => ({
    level: 4,
    strikes: 3,
    status: 'idle',
    blocks: generateBlocks(4),
    nextExpectedNumber: 1,

    startGame: () => {
        set({
            level: 4,
            strikes: 3,
            status: 'idle',
            blocks: generateBlocks(4),
            nextExpectedNumber: 1,
        });
    },

    resetGame: () => {
        // Reset to initial state
        set({
            level: 4,
            strikes: 3,
            status: 'idle',
            blocks: generateBlocks(4),
            nextExpectedNumber: 1,
        });
    },

    nextLevel: () => {
        const nextLvl = get().level + 1;
        set({
            level: nextLvl,
            status: 'idle',
            blocks: generateBlocks(nextLvl),
            nextExpectedNumber: 1,
        });
    },

    clickBlock: (id: number) => {
        const { nextExpectedNumber, blocks, strikes, status } = get();

        if (status === 'result') return;

        // First click logic
        if (id === 1 && nextExpectedNumber === 1) {
            // Hide all except the clicked one (which becomes solved essentially immediately or we just handle it)
            // Actually usually '1' is clicked, then it disappears (solved), and OTHERS become hidden.

            const newBlocks = blocks.map((b) => {
                if (b.id === 1) return { ...b, state: 'solved' as const };
                return { ...b, state: 'hidden' as const };
            });

            set({
                status: 'playing',
                blocks: newBlocks,
                nextExpectedNumber: 2,
            });
            return;
        }

        // Logic for subsequent clicks
        if (id === nextExpectedNumber) {
            // Correct
            const newBlocks = blocks.map((b) =>
                b.id === id ? { ...b, state: 'solved' as const } : b
            );

            const isLevelComplete = newBlocks.every((b) => b.state === 'solved');

            if (isLevelComplete) {
                // Trigger next level
                // In a real game there might be a "Success" screen, but here we can jump to next level or wait a bit.
                // Let's just immediately go next level for MVP flow or wait a user interaction.
                // PRD says "Result Processing -> Success -> Next Level".
                // I'll update to 'idle' but with new level instantly for now, or maybe a small delay in component?
                // Store just updates state.
                set({
                    blocks: newBlocks,
                    nextExpectedNumber: nextExpectedNumber + 1
                });

                setTimeout(() => {
                    get().nextLevel();
                }, 500); // Small delay for visual feedback
            } else {
                set({
                    blocks: newBlocks,
                    nextExpectedNumber: nextExpectedNumber + 1,
                });
            }
        } else {
            // Incorrect
            const newStrikes = strikes - 1;
            if (newStrikes <= 0) {
                set({ strikes: 0, status: 'result' });
                // Game Over - Save score logic should be triggered in component
            } else {
                // Strike but continue? Usually Chimp test is "3 strikes total" but valid for different levels?
                // Or "Strike" means you lose that level and try again?
                // PRD: "Fail -> Strike option (usually 3 chances). 3 strikes -> Game Over".
                // Usually if you fail a level, you don't proceed to next level?
                // Let's assume you retry the CURRENT level or simple reset?
                // PRD says "Current level restart".
                set({
                    strikes: newStrikes,
                    // Reveal blocks for feedback?
                    // Usually on fail, it reveals all to show what you missed.
                    status: 'idle', // Reset to idle to retry level
                    blocks: generateBlocks(get().level), // Regenerate same level? or same blocks?
                    // Usually regenerate.
                    nextExpectedNumber: 1
                });
            }
        }
    },
}));
