import { create } from 'zustand';
import { WORD_DATA, WordEntry } from './wordData';

interface VerbalHardState {
    score: number;
    lives: number; // Max 3
    status: 'idle' | 'playing' | 'result';

    currentWord: string;
    seenWords: Set<string>;

    // Trap State
    isTrap: boolean; // Was this word generated as a trap?
    trapSource: string | null; // The original seen word that triggered this trap

    feedback: string | null; // Feedback message on damage

    // Actions
    startGame: () => void;
    makeGuess: (guess: 'SEEN' | 'NEW') => void;
    resetGame: () => void;
    advanceRound: (damaged: boolean) => void;
}

export const useVerbalHardStore = create<VerbalHardState>((set, get) => ({
    score: 0,
    lives: 3,
    status: 'idle',
    currentWord: "",
    seenWords: new Set(),
    isTrap: false,
    trapSource: null,
    feedback: null,

    startGame: () => {
        // Pick first word (always NEW)
        const startEntry = WORD_DATA[Math.floor(Math.random() * WORD_DATA.length)];
        set({
            score: 0,
            lives: 3,
            status: 'playing',
            seenWords: new Set(),
            currentWord: startEntry.word,
            isTrap: false,
            trapSource: null,
            feedback: null
        });
    },

    resetGame: () => {
        set({
            status: 'idle',
            score: 0,
            lives: 3,
            currentWord: "",
            seenWords: new Set(),
            feedback: null
        });
    },

    makeGuess: (guess: 'SEEN' | 'NEW') => {
        const { seenWords, currentWord, lives, score, isTrap, trapSource } = get();
        const isActuallySeen = seenWords.has(currentWord);

        let isCorrect = false;
        if (guess === 'SEEN' && isActuallySeen) isCorrect = true;
        if (guess === 'NEW' && !isActuallySeen) isCorrect = true;

        if (!isCorrect) {
            // Damage Logic
            let damage = 1;
            let msg = "Wrong!";

            if (isTrap && guess === 'SEEN') {
                // Fell for the trap (Clicked SEEN on a synonym)
                damage = 2;
                msg = `That was a TRAP! Similar to "${trapSource}", but new.`;
            } else if (isActuallySeen && guess === 'NEW') {
                msg = "You've seen this word before!";
            } else if (!isActuallySeen && guess === 'SEEN') {
                msg = "You haven't seen this word yet.";
            }

            const newLives = lives - damage;

            if (newLives <= 0) {
                set({ lives: 0, status: 'result', feedback: "Game Over" });
            } else {
                set({ lives: newLives, feedback: msg });
                // Briefly show feedback then advance? Or advance immediately?
                // Better to advance to keep flow, feedback displayed somewhere.
                get().advanceRound(true); // true = damaged
            }
            return;
        }

        // Correct
        set({ score: score + 1, feedback: null });
        get().advanceRound(false);
    },

    // Helper to pick next word
    advanceRound: (damaged: boolean) => {
        const { seenWords } = get();
        const seenArray = Array.from(seenWords);

        // Add current word to seen (if it wasn't already)
        // Wait, if user guessed NEW correctly, it is now SEEN.
        // If user guessed SEEN correctly, it's already SEEN.
        // If user was WRONG (thought NEW was SEEN), it's still NEW technically? 
        // No, in Verbal Memory, usually once a word appears, it is considered "SEEN" for future rounds, regardless of user answer.
        // So we ALWAYS add currentWord to seenWords.
        const current = get().currentWord;
        const newSeen = new Set(seenWords);
        newSeen.add(current);

        const newSeenArray = Array.from(newSeen);

        // Probabilities
        // 30% SEEN
        // 40% NEW
        // 30% TRAP (Synonym of SEEN)

        const roll = Math.random();
        let nextWord = "";
        let isTrap = false;
        let trapSource = null;

        // Condition: Must have seen words to show SEEN or TRAP
        if (newSeenArray.length > 0 && roll < 0.3) {
            // 30% SEEN
            nextWord = newSeenArray[Math.floor(Math.random() * newSeenArray.length)];
        } else if (newSeenArray.length > 0 && roll < 0.6) {
            // 30% TRAP (0.3 to 0.6 range)
            // Try to find a synonym of a seen word that is NOT seen
            const potentialTraps: { word: string, source: string }[] = [];

            newSeenArray.forEach(seen => {
                const entry = WORD_DATA.find(w => w.word === seen);
                if (entry) {
                    entry.synonyms.forEach(syn => {
                        if (!newSeen.has(syn)) {
                            potentialTraps.push({ word: syn, source: seen });
                        }
                    });
                }
            });

            if (potentialTraps.length > 0) {
                const trap = potentialTraps[Math.floor(Math.random() * potentialTraps.length)];
                nextWord = trap.word;
                isTrap = true;
                trapSource = trap.source;
            } else {
                // Fallback to NEW
                const candidates = WORD_DATA.filter(w => !newSeen.has(w.word));
                if (candidates.length > 0) {
                    nextWord = candidates[Math.floor(Math.random() * candidates.length)].word;
                } else {
                    // Fallback to SEEN if run out of words
                    nextWord = newSeenArray[Math.floor(Math.random() * newSeenArray.length)];
                }
            }
        } else {
            // 40% NEW (0.6 to 1.0 range + fallback)
            const candidates = WORD_DATA.filter(w => !newSeen.has(w.word));
            // Also include synonyms that are not seen? Yes, they are valid NEW words.
            // Ideally we pick from ALL available words that are not seen.
            // Let's simplify: Pick a random entry from WORD_DATA, check if seen. If seen, pick another.
            // If mainly exhausting, use linear scan.

            // Collect ALL valid NEW words (Main words + Synonyms)
            const allNewCandidates: string[] = [];
            WORD_DATA.forEach(entry => {
                if (!newSeen.has(entry.word)) allNewCandidates.push(entry.word);
                entry.synonyms.forEach(syn => {
                    if (!newSeen.has(syn)) allNewCandidates.push(syn);
                });
            });

            if (allNewCandidates.length > 0) {
                nextWord = allNewCandidates[Math.floor(Math.random() * allNewCandidates.length)];
            } else {
                // Game effectively finished or infinite mode with only Old words
                nextWord = newSeenArray[Math.floor(Math.random() * newSeenArray.length)];
            }
        }

        set({
            seenWords: newSeen,
            currentWord: nextWord,
            isTrap,
            trapSource
        });
    }
    // Note: advanceRound passed to store but not exported in interface because it's internal helper mostly,
    // but in Zustand define it inside actions.
    // However, to keep it simple, I put logic inside `makeGuess` or merged it.
    // The implementation above includes `advanceRound` in the object but TS might complain if not in interface.
    // I'll merge `advanceRound` logic into `makeGuess` to avoid interface complexity or cast "get() as any".
    // Actually, I'll just keep it inline or fix interface. I'll merge for safety.
} as any));
// usage of 'as any' to bypass the AdvanceRound interface issue for quick implementation,
// but cleaner is to just inline logic or add to interface.
// I'll add `advanceRound` to interface? No, it's internal.
// I'll just merge it into makeGuess to be clean.
