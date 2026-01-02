"use client";

import { Suspense } from 'react';
import VerbalGameHard from '@/components/games/VerbalGameHard';

export default function VerbalHardPage() {
    return (
        <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <VerbalGameHard />
            </Suspense>
        </main>
    );
}
