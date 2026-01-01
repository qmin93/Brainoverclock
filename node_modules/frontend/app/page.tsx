"use client";

import { Zap, Grid3X3, Crosshair, Hash, Brain, Eye, Calculator, Keyboard } from "lucide-react";
import Link from "next/link";
import { GameColumn } from "@/components/dashboard/GameColumn";

export default function Home() {
  return (
    <main className="h-screen w-full bg-slate-950 text-slate-100 relative flex flex-col p-0 overflow-hidden font-sans selection:bg-cyan-500 selection:text-white">
      {/* Branding Header - Overlay with Blur */}
      <div className="absolute top-0 left-0 w-full p-4 z-50 pointer-events-none flex justify-center bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-3xl font-black tracking-[0.3em] uppercase opacity-90 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-cyan-400 whitespace-nowrap drop-shadow-sm">
          Brain Overclock
        </h1>
      </div>

      <div className="w-full h-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-0.5 bg-slate-900">
        <GameColumn
          title="Reaction Time"
          description="Choice Reaction."
          href="/test/reaction-time-hard"
          icon={Zap}
          colorClass="bg-orange-600 hover:bg-orange-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="reaction_time_hard_score"
          unit="ms"
        />

        <GameColumn
          title="Sequence Memory"
          description="Pattern Memory."
          href="/test/sequence-memory"
          icon={Grid3X3}
          colorClass="bg-cyan-600 hover:bg-cyan-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="sequence_memory_score"
          unit="Level"
        />

        <GameColumn
          title="Aim Trainer"
          description="Precision Aiming."
          href="/test/aim-trainer-hard"
          icon={Crosshair}
          colorClass="bg-fuchsia-600 hover:bg-fuchsia-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="aim_trainer_hard_score"
          unit="ms"
        />

        <GameColumn
          title="Number Memory"
          description="Digit Recall."
          href="/test/number-memory"
          icon={Hash}
          colorClass="bg-yellow-500 hover:bg-yellow-400 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="number_memory_hard_score"
          unit="Digits"
        />

        <GameColumn
          title="Flash Chimp"
          description="Spatial Memory."
          href="/test/chimp-test-hard"
          icon={Brain}
          colorClass="bg-pink-600 hover:bg-pink-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="chimp_hard_score"
          unit="Items"
        />

        <GameColumn
          title="Type Flow"
          description="Rhythm Typing."
          href="/test/type-flow"
          icon={Keyboard}
          colorClass="bg-indigo-600 hover:bg-indigo-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="type_flow_score"
          unit="WPM"
        />

        <GameColumn
          title="Verbal Trap"
          description="Word Logic."
          href="/test/verbal-memory-hard"
          icon={Brain}
          colorClass="bg-violet-600 hover:bg-violet-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="verbal_hard_score"
          unit="Words"
        />

        <GameColumn
          title="Rotating Matrix"
          description="Spatial IQ."
          href="/test/visual-memory-hard"
          icon={Grid3X3}
          colorClass="bg-red-600 hover:bg-red-500 text-white transition-all duration-300 flex flex-col justify-center items-center p-8 h-full rounded-none"
          storageKey="visual_hard_score"
          unit="Pts"
        />

        {/* Hidden Games Area */}
      </div>
    </main>
  );
}
