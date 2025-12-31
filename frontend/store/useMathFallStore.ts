import { create } from 'zustand';

export type MathFallMode = 'normal' | 'disappearing' | 'dual';

export interface FallingBlock {
    id: number;
    expression: string;
    answer: string;
    x: number; // 5-95%
    type: 'math' | 'word';
    duration: number;
    lane?: 'left' | 'right';
}

interface MathFallState {
    mode: MathFallMode;
    blocks: FallingBlock[];
    score: number;
    lavaLevel: number; // 0 to 100 (percentage)
    status: 'idle' | 'playing' | 'result';
    gameSpeed: number;
    level: number;

    // Actions
    setMode: (mode: MathFallMode) => void;
    startGame: () => void;
    spawnBlock: () => void;
    submitAnswer: (input: string) => boolean;
    handleBlockFloor: (id: number) => void;
    resetGame: () => void;
}

const WORDS = ["APPLE", "BRAIN", "LOGIC", "MATH", "FAST", "FOCUS", "REACT", "SPEED", "SHIFT", "THINK", "SOLVE", "INPUT"];

const generateProblem = (level: number): { exp: string, ans: string } => {
    const stage = Math.min(5, Math.floor(level / 2));
    let a, b, op;
    const ops = ['+', '-', '*'];
    if (stage >= 3) ops.push('/');

    op = ops[Math.floor(Math.random() * ops.length)];

    if (op === '+') {
        a = Math.floor(Math.random() * (10 * level)) + level;
        b = Math.floor(Math.random() * (10 * level)) + level;
        return { exp: `${a} + ${b}`, ans: (a + b).toString() };
    } else if (op === '-') {
        a = Math.floor(Math.random() * (10 * level)) + 10;
        b = Math.floor(Math.random() * a);
        return { exp: `${a} - ${b}`, ans: (a - b).toString() };
    } else if (op === '*') {
        a = Math.floor(Math.random() * (3 + level)) + 2;
        b = Math.floor(Math.random() * 10) + 2;
        return { exp: `${a} × ${b}`, ans: (a * b).toString() };
    } else {
        // Division
        const q = Math.floor(Math.random() * 10) + 2;
        b = Math.floor(Math.random() * (3 + level)) + 2;
        a = q * b;
        return { exp: `${a} ÷ ${b}`, ans: q.toString() };
    }
};

export const useMathFallStore = create<MathFallState>((set, get) => ({
    mode: 'normal',
    blocks: [],
    score: 0,
    lavaLevel: 0,
    status: 'idle',
    gameSpeed: 1.0,
    level: 1,

    setMode: (mode) => set({ mode }),

    startGame: () => {
        set({
            score: 0,
            lavaLevel: 0,
            status: 'playing',
            blocks: [],
            gameSpeed: 1.0,
            level: 1,
        });
    },

    spawnBlock: () => {
        const { mode, level, blocks, gameSpeed } = get();
        if (get().status !== 'playing') return;

        let type: 'math' | 'word' = 'math';
        let blockLane: 'left' | 'right' | undefined = undefined;

        if (mode === 'dual') {
            type = Math.random() < 0.5 ? 'math' : 'word';
            blockLane = type === 'math' ? 'left' : 'right';
        }

        let exp, ans;
        if (type === 'math') {
            const prob = generateProblem(level);
            exp = prob.exp;
            ans = prob.ans;
        } else {
            ans = WORDS[Math.floor(Math.random() * WORDS.length)];
            exp = ans;
        }

        const duration = Math.max(1500, 8000 - (level * 500)) / gameSpeed;

        let x;
        if (mode === 'dual') {
            x = blockLane === 'left' ? (Math.random() * 40 + 5) : (Math.random() * 40 + 55);
        } else {
            x = Math.random() * 90 + 5;
        }

        const newBlock: FallingBlock = {
            id: Date.now(),
            expression: exp,
            answer: ans.toUpperCase(),
            x,
            type,
            duration,
            lane: blockLane
        };

        set({ blocks: [...blocks, newBlock] });
    },

    submitAnswer: (input) => {
        const { blocks, score, level } = get();
        const cleanInput = input.trim().toUpperCase();
        if (!cleanInput) return false;

        const match = blocks.find(b => b.answer === cleanInput);
        if (match) {
            set({ blocks: blocks.filter(b => b.id !== match.id) });

            const newScore = score + 100;
            const newLevel = Math.floor(newScore / 500) + 1;
            const newSpeed = 1.0 + (newLevel - 1) * 0.15;

            set({ score: newScore, level: newLevel, gameSpeed: newSpeed });
            return true;
        }
        return false;
    },

    handleBlockFloor: (id) => {
        const { blocks, lavaLevel } = get();
        const newLavaLevel = Math.min(100, lavaLevel + 33.4);
        set({
            blocks: blocks.filter(b => b.id !== id),
            lavaLevel: newLavaLevel,
            status: newLavaLevel >= 100 ? 'result' : 'playing'
        });
    },

    resetGame: () => {
        set({ status: 'idle', blocks: [] });
    }
}));
