"use client";

import { Suspense } from "react";
import NumberGame from "@/components/games/NumberGame";

export default function NumberMemoryPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <NumberGame difficulty="easy" />
            </Suspense>
        </main>
    );
}
