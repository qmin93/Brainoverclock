import SequenceGame from "@/components/games/SequenceGame";

export default function SequenceMemoryPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold mb-2">Sequence Memory</h1>
                <p className="text-white/60">Memorize the pattern and repeat it.</p>
            </div>
            <SequenceGame />
        </div>
    );
}
