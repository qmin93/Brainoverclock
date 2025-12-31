import { create } from 'zustand';

interface Tile {
    r: number;
    c: number;
}

interface VisualHardState {
    level: number;
    lives: number;
    status: 'idle' | 'encode' | 'transform' | 'result';
    score: number;

    gridSize: number; // N
    targetTiles: Tile[]; // The original tiles shown
    rotation: 90 | -90 | 180; // The instruction given

    clickedTiles: Tile[]; // User input (transformed coordinates)

    startGame: () => void;
    startTurn: () => void;
    startRecall: () => void;
    clickTile: (r: number, c: number) => void;
    resetGame: () => void;
}

const generateTiles = (N: number, count: number): Tile[] => {
    const tiles: Tile[] = [];
    const used = new Set<string>();

    while (tiles.length < count) {
        const r = Math.floor(Math.random() * N);
        const c = Math.floor(Math.random() * N);
        const key = `${r},${c}`;
        if (!used.has(key)) {
            used.add(key);
            tiles.push({ r, c });
        }
    }
    return tiles;
};

// Transform Logic
// 90 (CW): (r, c) -> (c, N-1-r)
// -90 (CCW): (r, c) -> (N-1-c, r)
// 180: (r, c) -> (N-1-r, N-1-c)
const transformTile = (t: Tile, rot: number, N: number): Tile => {
    if (rot === 90) return { r: t.c, c: N - 1 - t.r };
    if (rot === -90) return { r: N - 1 - t.c, c: t.r };
    if (rot === 180) return { r: N - 1 - t.r, c: N - 1 - t.c };
    return t;
};

export const useVisualHardStore = create<VisualHardState>((set, get) => ({
    level: 1,
    lives: 3,
    score: 0,
    status: 'idle',
    gridSize: 3,
    targetTiles: [],
    rotation: 90,
    clickedTiles: [],

    startGame: () => {
        set({
            level: 1,
            lives: 3,
            score: 0,
            status: 'idle',
            gridSize: 3,
            targetTiles: [],
            rotation: 90,
            clickedTiles: []
        });
        get().startTurn();
    },

    resetGame: () => {
        set({ status: 'idle' });
    },

    startTurn: () => {
        const { level } = get();

        // Difficulty Logic
        // Lv 1-3: 3x3, 3 tiles.
        // Lv 4-6: 4x4, 4 tiles.
        // Lv 7+: 5x5, 5 tiles + 180 rotation introduced.

        let N = 3;
        let tileCount = 3;
        let possibleRotations: number[] = [90, -90];

        if (level >= 4) {
            N = 4;
            tileCount = 4;
        }
        if (level >= 7) {
            N = 5;
            tileCount = 5 + Math.floor((level - 7) / 2); // Increase tiles slowly
            possibleRotations.push(180);
        }

        const newTargets = generateTiles(N, tileCount);
        const rotation = possibleRotations[Math.floor(Math.random() * possibleRotations.length)] as 90 | -90 | 180;

        set({
            gridSize: N,
            targetTiles: newTargets,
            rotation: rotation,
            clickedTiles: [],
            status: 'encode'
        });

        // Wait then switch to recall
        setTimeout(() => {
            get().startRecall();
        }, 2000 + (tileCount * 300)); // Dynamic exposure time
    },

    startRecall: () => {
        set({ status: 'transform' });
    },

    clickTile: (r: number, c: number) => {
        const { status, clickedTiles, targetTiles, rotation, gridSize, lives, level, score } = get();

        if (status !== 'transform') return;

        // Check if this tile is ALREADY clicked
        if (clickedTiles.some(t => t.r === r && t.c === c)) return;

        // Verify Correctness
        // Does (r, c) match ANY of the transformed targets?
        // It's easier to verify: Is (r, c) a valid transformed point?

        // Calculate ALL valid answers
        const validAnswers = targetTiles.map(t => transformTile(t, rotation, gridSize));

        const isCorrect = validAnswers.some(vt => vt.r === r && vt.c === c);

        if (isCorrect) {
            const newClicked = [...clickedTiles, { r, c }];
            set({ clickedTiles: newClicked });

            if (newClicked.length === targetTiles.length) {
                // Level Complete
                set({ score: score + 1, level: level + 1 });
                setTimeout(() => {
                    get().startTurn();
                }, 500);
            }
        } else {
            // Wrong Click
            // 3 Lives system usually: Lose a life. Repeat level? Or just strike?
            // PRD: "Mental Rotation".
            // Losing life usually means fail level.
            const newLives = lives - 1;
            if (newLives <= 0) {
                set({ lives: 0, status: 'result' });
            } else {
                // Show error? shake?
                // Let's just deduct life and continue? Or reset level?
                // Usually visual memory allows continuing if you have lives, but wrong tile stays wrong?
                // Let's reset the turn for fairness in Hard Mode.
                set({ lives: newLives });
                // Maybe flash red?
                // Just restart turn for now to keep it simple
                setTimeout(() => {
                    get().startTurn();
                }, 500);
            }
        }
    },
}));
