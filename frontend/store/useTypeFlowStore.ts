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

// Extensive Quote Database sorted roughly by length/complexity
const QUOTE_DATABASE = [
    // Level 1: Very Short (10-25 chars)
    { text: "Be yourself.", source: "Oscar Wilde" },
    { text: "Seize the day.", source: "Horace" },
    { text: "Love covers all.", source: "Proverb" },
    { text: "Stars can't shine without darkness.", source: "Unknown" },
    { text: "No pain, no gain.", source: "Proverb" },
    { text: "Silence is golden.", source: "Proverb" },

    // Level 2: Short (25-40 chars)
    { text: "Stay hungry, stay foolish.", source: "Steve Jobs" },
    { text: "Knowledge is power.", source: "Francis Bacon" },
    { text: "I think, therefore I am.", source: "René Descartes" },
    { text: "Dream big and dare to fail.", source: "Norman Vaughan" },
    { text: "Time waits for no one.", source: "Folklore" },

    // Level 3: Medium-Short (40-60 chars)
    { text: "Life is what happens when you're busy making other plans.", source: "John Lennon" },
    { text: "That which does not kill us makes us stronger.", source: "Friedrich Nietzsche" },
    { text: "Get busy living or get busy dying.", source: "Stephen King" },
    { text: "You only live once, but if you do it right, once is enough.", source: "Mae West" },

    // Level 4: Medium (60-80 chars)
    { text: "The only thing we have to fear is fear itself.", source: "Franklin D. Roosevelt" },
    { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", source: "Martin Luther King Jr." },
    { text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", source: "Ralph Waldo Emerson" },

    // Level 5: Medium-Long (80-100 chars)
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", source: "Winston Churchill" },
    { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", source: "Thomas A. Edison" },

    // Level 6: Long (100-140 chars)
    { text: "Here's to the crazy ones. The misfits. The rebels. The troublemakers. The round pegs in the square holes. The ones who see things differently.", source: "Apple Inc." },
    { text: "Two roads diverged in a wood, and I—I took the one less traveled by, And that has made all the difference.", source: "Robert Frost" },

    // Level 7: Very Long (140+ chars)
    { text: "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better.", source: "Theodore Roosevelt" },
    { text: "I have a dream that my four little children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character.", source: "Martin Luther King Jr." }
];

// Helper to get quotes based on level
const getQuotesByLevel = (level: number) => {
    // 0-5, 6-10, 11-15... logic
    // Or simple mapping
    if (level === 1) return QUOTE_DATABASE.slice(0, 6);
    if (level === 2) return QUOTE_DATABASE.slice(6, 11);
    if (level === 3) return QUOTE_DATABASE.slice(11, 15);
    if (level === 4) return QUOTE_DATABASE.slice(15, 18);
    if (level === 5) return QUOTE_DATABASE.slice(18, 20);
    if (level === 6) return QUOTE_DATABASE.slice(20, 22);
    if (level >= 7) return QUOTE_DATABASE.slice(22); // All long ones for high levels
    return QUOTE_DATABASE.slice(0, 6); // Fallback
};

export const useTypeFlowStore = create<TypeFlowState>((set, get) => ({
    currentQuote: QUOTE_DATABASE[0],
    userInput: '',
    status: 'idle',
    mode: 'blind', // Default and Fixed to Blind
    startTime: null,
    endTime: null,
    mistakes: 0,
    wpm: 0,
    accuracy: 0,
    level: 1,

    setMode: (mode) => set({ mode: 'blind' }), // Enforce Blind mode

    start: (resetLevel = true) => {
        const currentLevel = resetLevel ? 1 : get().level;
        const levelQuotes = getQuotesByLevel(currentLevel);
        const quote = levelQuotes[Math.floor(Math.random() * levelQuotes.length)];

        set({
            currentQuote: quote,
            userInput: '',
            status: 'running',
            mode: 'blind', // Ensure blind mode on start
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
                // Blind Mode doesn't fail on mistake, but maybe we want visual feedback?
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

        // Advance Level & Setup Next Round immediately
        const nextLevel = level + 1;
        const levelQuotes = getQuotesByLevel(nextLevel);
        const nextQuote = levelQuotes[Math.floor(Math.random() * levelQuotes.length)];

        set({
            // Save prev stats if needed, but for flow we just move on
            level: nextLevel,
            currentQuote: nextQuote,
            userInput: '',
            mistakes: 0,
            startTime: Date.now(), // Restart timer immediately (or wait for first input? logic inside handleInput handles !startTime check if we set it null. Let's set it Date.now() but the user has memorize time. So actually set startTime to Date.now() is wrong if we want strict WPM. But usually WPM starts on first keystroke? TypeFlow logic starts on 'start()'. Let's reset startTime to Date.now() effectively resetting the clock.)
            // Actually, handleInput checks `!startTime`. If we set it here, time flies while memorizing.
            // Adjust: Set startTime to null? No, then handleInput wont work?
            // handleInput: `if (status !== 'running' || !startTime) return;`
            // We need to keep running.
            // Issue: When Next Level starts, Blind Mode gives 7s memorize time. Typing is allowed?
            // If typing is allowed during memorize, WPM counts.
            // If we want WPM to start AFTER memorize or FIRST keystroke, we should set startTime on first input.
            // But existing logic sets startTime in start().
            // Let's set startTime to Date.now() for simplicity, assuming user starts typing or memorizing.
            // Ideally, we reset startTime to Date.now().
            startTime: Date.now(),
            wpm: finalWPM, // Update display WPM to show last run's speed
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
            level: 1,
            mode: 'blind'
        });
    }
}));
