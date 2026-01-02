"use client";

import { Suspense } from "react";
import VisualGameHard from "@/components/games/VisualGameHard";

export default function VisualMemoryHardPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <VisualGameHard />
            </Suspense>
        </main>
    );
}
