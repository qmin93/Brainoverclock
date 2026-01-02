"use client";

import { Suspense } from "react";
import StroopGameHard from "@/components/games/StroopGameHard";

export default function StroopTestHardPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <StroopGameHard />
            </Suspense>
        </main>
    );
}
