import { create } from 'zustand';

export type TypeFlowMode = 'normal' | 'sudden-death' | 'blind';

interface TypeFlowState {
    currentQuote: { text: string; source: string };
    userInput: string;
    status: 'idle' | 'running' | 'finished';
    mode: TypeFlowMode;
    startTime: number | null;
    endTime: number | null;
    mistakes: number;
    wpm: number;
    accuracy: number;
    level: number;

    // Actions
    setMode: (mode: TypeFlowMode) => void;
    start: (resetLevel?: boolean) => void;
    handleInput: (value: string) => void;
    finish: () => void;
    reset: () => void;
}

const QUOTES_BY_LEVEL: Record<number, { text: string; source: string }[]> = {
    1: [
        { text: "Knowledge is power.", source: "Francis Bacon" },
        { text: "Stay hungry, stay foolish.", source: "Steve Jobs" },
        { text: "I think, therefore I am.", source: "René Descartes" },
        { text: "May the Force be with you.", source: "Star Wars" },
        { text: "Houston, we have a problem.", source: "Apollo 13" },
        { text: "Be the change you wish to see.", source: "Mahatma Gandhi" }
    ],
    2: [
        { text: "Life is what happens when you're busy making other plans.", source: "John Lennon" },
        { text: "The only thing we have to fear is fear itself.", source: "Franklin D. Roosevelt" },
        { text: "To be or not to be, that is the question.", source: "William Shakespeare" },
        { text: "It is during our darkest moments that we must focus to see the light.", source: "Aristotle" },
        { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", source: "Benjamin Franklin" }
    ],
    3: [
        { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", source: "Nelson Mandela" },
        { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", source: "Winston Churchill" },
        { text: "Your time is limited, so don't waste it living someone else's life.", source: "Steve Jobs" },
        { text: "The future belongs to those who believe in the beauty of their dreams.", source: "Eleanor Roosevelt" },
        { text: "Innovation distinguishes between a leader and a follower.", source: "Steve Jobs" }
    ]
};

export const useTypeFlowStore = create<TypeFlowState>((set, get) => ({
    currentQuote: QUOTES_BY_LEVEL[1][0],
    userInput: '',
    status: 'idle',
    mode: 'normal',
    startTime: null,
    endTime: null,
    mistakes: 0,
    wpm: 0,
    accuracy: 0,
    level: 1,

    setMode: (mode) => set({ mode }),

    start: (resetLevel = true) => {
        const currentLevel = resetLevel ? 1 : Math.min(get().level, 3);
        const levelQuotes = QUOTES_BY_LEVEL[currentLevel] || QUOTES_BY_LEVEL[1];
        const quote = levelQuotes[Math.floor(Math.random() * levelQuotes.length)];

        set({
            currentQuote: quote,
            userInput: '',
            status: 'running',
            startTime: Date.now(),
            endTime: null,
            mistakes: 0,
            wpm: 0,
            accuracy: 0,
            level: currentLevel
        });
    },

    handleInput: (value) => {
        const { currentQuote, status, mode, mistakes, startTime, userInput } = get();
        if (status !== 'running' || !startTime) return;

        // Normalize smart quotes/apostrophes
        const normalizedValue = value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');

        // Handle Backspace (deleting)
        if (normalizedValue.length < userInput.length) {
            set({ userInput: normalizedValue });
            return;
        }

        // Handle typing forward
        if (normalizedValue.length > userInput.length) {
            const typedChar = normalizedValue[normalizedValue.length - 1];
            const expectedChar = currentQuote.text[userInput.length];

            // Strict check
            if (typedChar !== expectedChar) {
                set({ mistakes: mistakes + 1 });

                if (mode === 'sudden-death') {
                    set({ status: 'finished', endTime: Date.now() });
                }

                return;
            }
        }

        set({ userInput: normalizedValue });

        const now = Date.now();
        const timeElapsed = (now - startTime) / 1000 / 60; // in minutes
        const currentWPM = timeElapsed > 0 ? Math.round((normalizedValue.length / 5) / timeElapsed) : 0;

        set({ wpm: currentWPM });

        if (normalizedValue === currentQuote.text) {
            get().finish();
        }
    },

    finish: () => {
        const { startTime, userInput, mistakes, level } = get();
        if (!startTime) return;

        const endTime = Date.now();
        const timeElapsed = (endTime - startTime) / 1000 / 60;
        const finalWPM = Math.round((userInput.length / 5) / timeElapsed);

        const totalChars = userInput.length;
        const finalAccuracy = totalChars > 0 ? Math.round(((totalChars - mistakes) / totalChars) * 100) : 100;

        set({
            status: 'finished',
            endTime,
            wpm: finalWPM,
            accuracy: Math.max(0, finalAccuracy),
            level: level + 1 // Advance level
        });
    },

    reset: () => {
        set({
            status: 'idle',
            userInput: '',
            startTime: null,
            endTime: null,
            mistakes: 0,
            wpm: 0,
            accuracy: 0,
            level: 1
        });
    }
}));
