"use client";

import NumberGame from "@/components/games/NumberGame";

export default function NumberMemoryPage() {
    return (
        <div className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center">
            <NumberGame difficulty="hard" />
        </div>
    );
}
