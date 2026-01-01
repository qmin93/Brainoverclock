import AimGame from "@/components/games/AimGame";

export default function AimTrainerPage() {
    return (
        <div className="h-screen w-full bg-slate-950 text-white overflow-hidden">
            <AimGame difficulty="hard" />
        </div>
    );
}
