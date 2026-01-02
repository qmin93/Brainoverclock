"use client";

import { Suspense } from "react";
import ChimpGame from '@/components/games/ChimpGame';

export default function ChimpPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ChimpGame />
            </Suspense>
        </main>
    );
}
