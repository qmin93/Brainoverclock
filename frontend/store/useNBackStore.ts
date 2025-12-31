import { create } from 'zustand';

interface Step {
    position: number;
    sound: string;
}

interface NBackStats {
    hits: number;
    misses: number;
    falseAlarms: number;
}

interface NBackState {
    n: number;
    history: Step[];
    currentIndex: number;
    totalTrials: number; // usually 20 per round
    status: 'idle' | 'playing' | 'round_end' | 'result';

    currentStep: Step | null;

    // User Input for CURRENT trial
    hasRespondedPos: boolean;
    hasRespondedSound: boolean;

    // Round stats
    posStats: NBackStats;
    soundStats: NBackStats;

    // Actions
    startGame: () => void;
    nextStep: () => void;
    checkInput: (type: 'position' | 'sound') => void;
    evaluateRound: () => void;
    resetGame: () => void;
}

const SOUNDS = ['C', 'H', 'K', 'L', 'Q', 'R', 'S', 'T'];

export const useNBackStore = create<NBackState>((set, get) => ({
    n: 2,
    history: [],
    currentIndex: 0,
    totalTrials: 20,
    status: 'idle',
    currentStep: null,
    hasRespondedPos: false,
    hasRespondedSound: false,
    posStats: { hits: 0, misses: 0, falseAlarms: 0 },
    soundStats: { hits: 0, misses: 0, falseAlarms: 0 },

    startGame: () => {
        set({
            currentIndex: 0,
            history: [],
            status: 'playing',
            currentStep: null,
            hasRespondedPos: false,
            hasRespondedSound: false,
            posStats: { hits: 0, misses: 0, falseAlarms: 0 },
            soundStats: { hits: 0, misses: 0, falseAlarms: 0 }
        });
        get().nextStep();
    },

    nextStep: () => {
        const { currentIndex, totalTrials, history, n, hasRespondedPos, hasRespondedSound, posStats, soundStats } = get();

        // Before moving to next, check if user MISSED a match in the previous trial
        if (currentIndex > 0) {
            const prevStep = history[history.length - 1];
            const targetStep = history[history.length - 1 - n];

            if (targetStep) {
                if (targetStep.position === prevStep.position && !hasRespondedPos) {
                    set(s => ({ posStats: { ...s.posStats, misses: s.posStats.misses + 1 } }));
                }
                if (targetStep.sound === prevStep.sound && !hasRespondedSound) {
                    set(s => ({ soundStats: { ...s.soundStats, misses: s.soundStats.misses + 1 } }));
                }
            }
        }

        if (currentIndex >= totalTrials) {
            get().evaluateRound();
            return;
        }

        // Generate New Step
        let pos: number;
        let sound: string;

        const target = history[history.length - n];
        const shouldMatchPos = Math.random() < 0.3;
        const shouldMatchSound = Math.random() < 0.3;

        if (target && shouldMatchPos) {
            pos = target.position;
        } else {
            pos = Math.floor(Math.random() * 9);
        }

        if (target && shouldMatchSound) {
            sound = target.sound;
        } else {
            sound = SOUNDS[Math.floor(Math.random() * SOUNDS.length)];
        }

        const newStep = { position: pos, sound };

        set({
            currentStep: newStep,
            history: [...history, newStep],
            currentIndex: currentIndex + 1,
            hasRespondedPos: false,
            hasRespondedSound: false
        });
    },

    checkInput: (type: 'position' | 'sound') => {
        const { history, n, currentStep, hasRespondedPos, hasRespondedSound, posStats, soundStats, status } = get();
        if (status !== 'playing' || !currentStep) return;

        const targetStep = history[history.length - 1 - n];

        if (type === 'position') {
            if (hasRespondedPos) return;
            const isMatch = targetStep && targetStep.position === currentStep.position;
            if (isMatch) {
                set(s => ({ posStats: { ...s.posStats, hits: s.posStats.hits + 1 }, hasRespondedPos: true }));
            } else {
                set(s => ({ posStats: { ...s.posStats, falseAlarms: s.posStats.falseAlarms + 1 }, hasRespondedPos: true }));
            }
        } else {
            if (hasRespondedSound) return;
            const isMatch = targetStep && targetStep.sound === currentStep.sound;
            if (isMatch) {
                set(s => ({ soundStats: { ...s.soundStats, hits: s.soundStats.hits + 1 }, hasRespondedSound: true }));
            } else {
                set(s => ({ soundStats: { ...s.soundStats, falseAlarms: s.soundStats.falseAlarms + 1 }, hasRespondedSound: true }));
            }
        }
    },

    evaluateRound: () => {
        const { posStats, soundStats, totalTrials, n } = get();

        // Simple accuracy: (hits) / (total match opportunities) is complex because we dont track total ops easily here
        // Let's use a simpler heuristic for adaptive: If total errors (misses + FalseAlarms) is low.
        const totalErrors = posStats.misses + posStats.falseAlarms + soundStats.misses + soundStats.falseAlarms;

        // In Dual N-Back, you usually need >90% accuracy on BOTH.
        // Let's say if errors < 3 -> Level Up. Errors > 6 -> Level Down.
        let nextN = n;
        if (totalErrors <= 2) nextN = n + 1;
        else if (totalErrors >= 6) nextN = Math.max(2, n - 1);

        set({ n: nextN, status: 'round_end' });
    },

    resetGame: () => {
        set({ status: 'idle' });
    }
}));
