"use client";

import { Zap, Grid3X3, Crosshair, Hash } from "lucide-react";
import Link from "next/link";
import { GameColumn } from "@/components/dashboard/GameColumn";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white relative flex flex-col pt-24 pb-8 px-4 md:px-12 items-center">
      {/* Branding Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <h1 className="text-2xl font-black tracking-[0.3em] uppercase opacity-20 whitespace-nowrap">
          Brain Overclock
        </h1>
      </div>

      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1">
        <GameColumn
          title="Reaction Time"
          description="Choice Reaction. Click GREEN only. Ignore Blue/Orange distractions."
          href="/test/reaction-time-hard"
          icon={Zap} // Or another icon if available, but Zap fits. Maybe AlertTriangle?
          colorClass="bg-[#ff4d00]/10 hover:bg-[#ff4d00]/20 border border-[#ff4d00]/20 hover:border-[#ff4d00]/50 text-white rounded-3xl"
          storageKey="reaction_time_hard_score"
          unit="ms"
        />

        <GameColumn
          title="Sequence Memory"
          description="Memorize the pattern. The sequence gets longer every step."
          href="/test/sequence-memory"
          icon={Grid3X3}
          colorClass="bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/20 hover:border-[#00e5ff]/50 text-white rounded-3xl"
          storageKey="sequence_memory_score"
          unit="Level"
        />

        <GameColumn
          title="Aim Trainer"
          description="Hit 30 small targets as fast as you can. Requires precision."
          href="/test/aim-trainer-hard"
          icon={Crosshair}
          colorClass="bg-[#cc00ff]/10 hover:bg-[#cc00ff]/20 border border-[#cc00ff]/20 hover:border-[#cc00ff]/50 text-white rounded-3xl"
          storageKey="aim_trainer_hard_score"
          unit="ms"
        />

        <GameColumn
          title="Number Memory"
          description="Memorize the number. Randomly type it NORMAL or REVERSE."
          href="/test/number-memory"
          icon={Hash}
          colorClass="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/50 text-white rounded-3xl"
          storageKey="number_memory_hard_score"
          unit="Digits"
        />
      </div>
    </main>
  );
}
