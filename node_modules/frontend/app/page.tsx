"use client";

import { Zap, Grid3X3, Crosshair, Hash, Brain, Eye, Calculator, Keyboard } from "lucide-react";
import Link from "next/link";
import { GameColumn } from "@/components/dashboard/GameColumn";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-zinc-50 text-slate-900 relative flex flex-col pt-20 pb-8 px-4 md:px-12 items-center font-sans selection:bg-cyan-200 selection:text-cyan-900">
      {/* Branding Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <h1 className="text-3xl font-black tracking-[0.3em] uppercase opacity-90 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-cyan-400 whitespace-nowrap drop-shadow-sm">
          Brain Overclock
        </h1>
      </div>

      <div className="w-full h-full px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 flex-1 pb-4 auto-rows-fr">
        <GameColumn
          title="Reaction Time"
          description="Choice Reaction. Click GREEN only."
          href="/test/reaction-time-hard"
          icon={Zap}
          colorClass="bg-orange-400 hover:bg-orange-300 text-slate-900 shadow-xl shadow-orange-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="reaction_time_hard_score"
          unit="ms"
        />

        <GameColumn
          title="Sequence Memory"
          description="Memorize the pattern."
          href="/test/sequence-memory"
          icon={Grid3X3}
          colorClass="bg-cyan-400 hover:bg-cyan-300 text-slate-900 shadow-xl shadow-cyan-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="sequence_memory_score"
          unit="Level"
        />

        <GameColumn
          title="Aim Trainer"
          description="Hit targets fast."
          href="/test/aim-trainer-hard"
          icon={Crosshair}
          colorClass="bg-fuchsia-400 hover:bg-fuchsia-300 text-slate-900 shadow-xl shadow-fuchsia-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="aim_trainer_hard_score"
          unit="ms"
        />

        <GameColumn
          title="Number Memory"
          description="Memorize digits."
          href="/test/number-memory"
          icon={Hash}
          colorClass="bg-yellow-400 hover:bg-yellow-300 text-slate-900 shadow-xl shadow-yellow-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="number_memory_hard_score"
          unit="Digits"
        />

        <GameColumn
          title="Flash Chimp"
          description="Photographic memory."
          href="/test/chimp-test-hard"
          icon={Brain}
          colorClass="bg-pink-400 hover:bg-pink-300 text-slate-900 shadow-xl shadow-pink-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="chimp_hard_score"
          unit="Items"
        />

        <GameColumn
          title="Type Flow"
          description="Rhythm typing."
          href="/test/type-flow"
          icon={Keyboard}
          colorClass="bg-indigo-400 hover:bg-indigo-300 text-slate-900 shadow-xl shadow-indigo-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="type_flow_score"
          unit="WPM"
        />

        <GameColumn
          title="Verbal Trap"
          description="Semantic test."
          href="/test/verbal-memory-hard"
          icon={Brain}
          colorClass="bg-indigo-400 hover:bg-indigo-300 text-slate-900 shadow-xl shadow-indigo-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="verbal_hard_score"
          unit="Words"
        />

        <GameColumn
          title="Rotating Matrix"
          description="Mental rotation."
          href="/test/visual-memory-hard"
          icon={Grid3X3}
          colorClass="bg-red-500 hover:bg-red-400 text-slate-900 shadow-xl shadow-red-200/50 transition-all duration-300 border-none rounded-3xl flex flex-col justify-center items-center p-8 h-full"
          storageKey="visual_hard_score"
          unit="Pts"
        />

        {/* 
        <GameColumn
          title="Chaos Stroop"
          description="Task Switching. Rule changes between COLOR and WORD. No mistakes."
          href="/test/stroop-test-hard"
          icon={Zap}
          colorClass="bg-violet-500 hover:bg-violet-400 text-slate-900 shadow-xl shadow-violet-200/50 transition-all duration-300 hover:scale-[1.02] border-none rounded-3xl"
          storageKey="stroop_hard_score"
          unit="Pts"
        />

        <GameColumn
          title="Dual N-Back"
          description="IQ Trainer. Match position and sound from N steps ago."
          href="/test/dual-n-back"
          icon={Brain}
          colorClass="bg-cyan-400 hover:bg-cyan-300 text-slate-900 shadow-xl shadow-cyan-200/50 transition-all duration-300 hover:scale-[1.02] border-none rounded-3xl"
          storageKey="n_back_score"
          unit="Back"
        />

        <GameColumn
          title="Schulte Table"
          description="Peripheral Vision. Focus on the center and find numbers 1 to 25."
          href="/test/schulte-table"
          icon={Eye}
          colorClass="bg-orange-400 hover:bg-orange-300 text-slate-900 shadow-xl shadow-orange-200/50 transition-all duration-300 hover:scale-[1.02] border-none rounded-3xl"
          storageKey="schulte_normal_score"
          unit="s"
        />

        <GameColumn
          title="Math Fall"
          description="Arithmetic Defense. Solve equations before they hit the ground."
          href="/test/math-fall"
          icon={Calculator}
          colorClass="bg-rose-400 hover:bg-rose-300 text-slate-900 shadow-xl shadow-rose-200/50 transition-all duration-300 hover:scale-[1.02] border-none rounded-3xl"
          storageKey="math_fall_score"
          unit="Pts"
        /> 
        */}

      </div>
    </main>
  );
}
