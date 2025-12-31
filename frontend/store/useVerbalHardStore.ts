import { create } from 'zustand';
import { WORD_DATA } from './wordData';

interface VerbalHardState {
    score: number;
    lives: number; // 1 for sudden death
    status: 'idle' | 'playing' | 'result';
    currentWord: string;
    seenWords: Set<string>;

    // Logic
    startGame: () => void;
    makeGuess: (guess: 'SEEN' | 'NEW') => void;
    resetGame: () => void;
}

export const useVerbalHardStore = create<VerbalHardState>((set, get) => ({
    score: 0,
    lives: 1,
    status: 'idle',
    currentWord: "",
    seenWords: new Set(),

    startGame: () => {
        const startWord = WORD_DATA[Math.floor(Math.random() * WORD_DATA.length)].word;
        set({
            score: 0,
            lives: 1,
            status: 'playing',
            seenWords: new Set(),
            currentWord: startWord,
        });
    },

    resetGame: () => {
        // Reset to idle
        set({
            score: 0,
            lives: 1,
            status: 'idle',
            currentWord: "",
            seenWords: new Set(),
        });
    },

    makeGuess: (guess: 'SEEN' | 'NEW') => {
        const { seenWords, currentWord, score } = get();

        // Is it actually seen?
        const isActuallySeen = seenWords.has(currentWord);

        let correct = false;
        if (guess === 'SEEN' && isActuallySeen) correct = true;
        if (guess === 'NEW' && !isActuallySeen) correct = true;

        if (!correct) {
            // Sudden Death
            set({ status: 'result', lives: 0 });
            return;
        }

        // Correct!
        // Update State
        const newSeen = new Set(seenWords);
        newSeen.add(currentWord);

        // Pick Next Word
        // Logic: 
        // Chance to show a SEEN word again: ~40%?
        // Chance to show a NEW word: ~60%?
        //      If NEW: 
        //          Chance to show a TRAP (related to a SEEN word): ~30%?
        //          Chance to show a RANDOM word: ~30%?

        let nextWord = "";

        // Calculate probabilities based on score?
        // Harder as you go.
        const seenArray = Array.from(newSeen);
        const hasSeen = seenArray.length > 0;

        const roll = Math.random();

        if (hasSeen && roll < 0.4) {
            // Show OLD word
            nextWord = seenArray[Math.floor(Math.random() * seenArray.length)];
        } else {
            // Show NEW word
            // Try to generate a TRAP
            // 1. Find all "Related" words of CURRENTLY SEEN words.
            // 2. Filter out those that are ALREADY SEEN (wait, if related is seen, it's just an old word).
            // 3. Pick one.

            const possibleTraps: string[] = [];
            seenArray.forEach(seen => {
                const data = WORD_DATA.find(d => d.word === seen);
                if (data) {
                    // Add related words that haven't been seen yet
                    data.related.forEach(r => {
                        if (!newSeen.has(r)) possibleTraps.push(r);
                    });
                }
            });

            // 50% chance to use trap if available
            if (possibleTraps.length > 0 && Math.random() < 0.5) {
                nextWord = possibleTraps[Math.floor(Math.random() * possibleTraps.length)];
            } else {
                // Random NEW word
                // Filter WORD_DATA for words not in newSeen
                const candidates = WORD_DATA.filter(d => !newSeen.has(d.word));
                if (candidates.length === 0) {
                    // Exhausted all primary words?
                    // Just pick a seen word? Or one of the related words as primary?
                    // For MVP let's just pick any related word from dataset not seen
                    const allWords = new Set<string>();
                    WORD_DATA.forEach(d => {
                        allWords.add(d.word);
                        d.related.forEach(r => allWords.add(r));
                    });
                    // Find something not seen
                    const available = Array.from(allWords).filter(w => !newSeen.has(w));
                    if (available.length > 0) {
                        nextWord = available[Math.floor(Math.random() * available.length)];
                    } else {
                        // Start repeating seen words (Endgame state)
                        nextWord = seenArray[Math.floor(Math.random() * seenArray.length)];
                    }
                } else {
                    nextWord = candidates[Math.floor(Math.random() * candidates.length)].word;
                }
            }
        }

        set({
            score: score + 1,
            seenWords: newSeen,
            currentWord: nextWord
        });
    },
}));
