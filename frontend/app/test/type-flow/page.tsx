"use client";

import { Suspense } from "react";
import TypeFlowGame from "@/components/games/TypeFlowGame";

export default function TypeFlowPage() {
    return (
        <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <TypeFlowGame />
            </Suspense>
        </main>
    );
}
