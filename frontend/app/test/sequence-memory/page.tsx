import { Suspense } from 'react';
import SequenceGameHard from "@/components/games/SequenceGameHard";

export default function SequenceMemoryPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white overflow-hidden">
            <Suspense fallback={<div>Loading...</div>}>
                <SequenceGameHard />
            </Suspense>
        </div>
    );
}
