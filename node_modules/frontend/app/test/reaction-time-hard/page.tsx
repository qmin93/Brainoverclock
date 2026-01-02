"use client";

import { Suspense } from "react";
import ReactionGameHard from "@/components/games/ReactionGameHard";

export default function ReactionTimeHardPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <ReactionGameHard />
            </Suspense>
        </main>
    );
}
