import { Suspense } from 'react';
import AimGameHard from "@/components/games/AimGameHard";

export default function AimTrainerHardPage() {
    return (
        <div className="h-screen w-full bg-slate-950 text-white overflow-hidden">
            <Suspense fallback={<div>Loading...</div>}>
                <AimGameHard />
            </Suspense>
        </div>
    );
}
