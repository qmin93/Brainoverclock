import { create } from 'zustand';

export type ColorType = 'red' | 'blue' | 'green' | 'yellow';
export type RuleType = 'match_color' | 'match_word';

const COLORS: ColorType[] = ['red', 'blue', 'green', 'yellow'];
const RULES: RuleType[] = ['match_color', 'match_word'];

interface StroopHardState {
    currentText: ColorType;
    currentColor: ColorType;
    currentRule: RuleType;

    score: number;
    level: number;
    status: 'idle' | 'playing' | 'result';
    timeLeft: number;
    maxTime: number;

    startGame: () => void;
    setQuestion: () => void;
    handleAnswer: (userChoice: ColorType) => void;
    tick: () => void;
    resetGame: () => void;
}

export const useStroopHardStore = create<StroopHardState>((set, get) => ({
    currentText: 'red',
    currentColor: 'blue',
    currentRule: 'match_color',
    score: 0,
    level: 1,
    status: 'idle',
    timeLeft: 3.0,
    maxTime: 3.0,

    startGame: () => {
        set({ score: 0, level: 1, status: 'playing', timeLeft: 3.0, maxTime: 3.0 });
        get().setQuestion();
    },

    setQuestion: () => {
        const { score } = get();
        const textIdx = Math.floor(Math.random() * COLORS.length);
        const colorIdx = Math.floor(Math.random() * COLORS.length);
        const ruleIdx = Math.floor(Math.random() * RULES.length);

        const newLevel = Math.floor(score / 500) + 1;
        // Start at 3.0s, decrease slower. Min limit 1.2s
        const newMaxTime = Math.max(1.2, 3.0 - (newLevel - 1) * 0.1);

        set({
            currentText: COLORS[textIdx],
            currentColor: COLORS[colorIdx],
            currentRule: RULES[ruleIdx],
            level: newLevel,
            maxTime: newMaxTime,
            timeLeft: newMaxTime,
        });
    },

    handleAnswer: (userChoice: ColorType) => {
        const { currentRule, currentColor, currentText, score, status } = get();
        if (status !== 'playing') return;

        const isCorrect = currentRule === 'match_color'
            ? userChoice === currentColor
            : userChoice === currentText;

        if (isCorrect) {
            set({ score: score + 100 });
            get().setQuestion();
        } else {
            set({ status: 'result' });
        }
    },

    tick: () => {
        const { timeLeft, status } = get();
        if (status !== 'playing') return;

        if (timeLeft <= 0) {
            set({ status: 'result' });
        } else {
            set({ timeLeft: timeLeft - 0.1 });
        }
    },

    resetGame: () => {
        set({ status: 'idle', score: 0 });
    },
}));
