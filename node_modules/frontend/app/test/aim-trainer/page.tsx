"use client";

import { Suspense } from "react";
import AimGame from "@/components/games/AimGame";

export default function AimTrainerPage() {
    return (
        <div className="h-screen w-full bg-slate-950 text-white overflow-hidden">
            <Suspense fallback={<div>Loading...</div>}>
                <AimGame difficulty="hard" />
            </Suspense>
        </div>
    );
}
