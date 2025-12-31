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
    timeLeft: 1.5,
    maxTime: 1.5,

    startGame: () => {
        set({ score: 0, level: 1, status: 'playing', timeLeft: 1.5, maxTime: 1.5 });
        get().setQuestion();
    },

    setQuestion: () => {
        const { score } = get();
        const textIdx = Math.floor(Math.random() * COLORS.length);
        const colorIdx = Math.floor(Math.random() * COLORS.length);
        const ruleIdx = Math.floor(Math.random() * RULES.length);

        const newLevel = Math.floor(score / 500) + 1;
        const newMaxTime = Math.max(0.7, 1.5 - (newLevel - 1) * 0.15);

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
