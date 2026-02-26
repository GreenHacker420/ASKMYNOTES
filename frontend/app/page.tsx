"use client";
import { SquiggleFilter, GraphPaper, Hero, TapeMarquee, FeatureBoard } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/Sketchy";

// --- Main Layout ---
export default function SketchyPage() {
  return (
    <main className="relative min-h-screen w-full text-slate-800 overflow-x-hidden font-sans selection:bg-yellow-300 selection:text-black">
      <SquiggleFilter />
      <GraphPaper />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xl font-black tracking-tighter">
          <div className="h-8 w-8 rounded border-2 border-slate-900 bg-slate-800" />
          AskMyNotes.
        </div>
        <div className="hidden md:block font-mono text-xs">
          Coordinates: {`{ x: 0, y: 0 }`}
        </div>
        <button className="rounded border-2 border-slate-900 bg-white px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
          Sign In
        </button>
      </nav>

      <Hero />
      <TapeMarquee />
      <FeatureBoard />

      <footer className="py-24 text-center">
        <p className="text-2xl text-slate-500 opacity-60 rotate-2 italic">
          Made with love and a lot of coffee.
        </p>
      </footer>
    </main>
  );
}