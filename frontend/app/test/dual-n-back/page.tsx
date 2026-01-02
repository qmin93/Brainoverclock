"use client";

import { Suspense } from "react";
import NBackGame from "@/components/games/NBackGame";

export default function DualNBackPage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <NBackGame />
            </Suspense>
        </main>
    );
}
