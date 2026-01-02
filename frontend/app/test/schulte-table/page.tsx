"use client";

import { Suspense } from "react";
import SchulteGame from "@/components/games/SchulteGame";

export default function SchulteTablePage() {
    return (
        <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <Suspense fallback={<div>Loading...</div>}>
                <SchulteGame />
            </Suspense>
        </main>
    );
}
