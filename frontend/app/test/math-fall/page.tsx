"use client";

import { Suspense } from "react";
import MathFallGame from "@/components/games/MathFallGame";

export default function MathFallPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <MathFallGame />
            </Suspense>
        </main>
    );
}
