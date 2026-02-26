"use client";
import Link from "next/link";
import {
  SquiggleFilter,
  GraphPaper,
  Hero,
  TapeMarquee,
  FeatureBoard,
  NotebookFeatureGrid,
  HowItWorks,
  BottomCTA,
} from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/Sketchy";
import Link from "next/link";

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
        <div className="flex gap-4">
          <Link href="/login">
            <button className="rounded border-2 border-slate-900 bg-white px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-colors">
              Sign In
            </button>
          </Link>
          <Link href="/register">
            <button className="rounded border-2 border-slate-900 bg-yellow-300 px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none">
              Sign Up
            </button>
          </Link>
        </div>
      </nav>

      <Hero />
      <TapeMarquee />
      <FeatureBoard />
      <NotebookFeatureGrid />
      <HowItWorks />
      <BottomCTA />

      <footer className="relative z-10 py-24 text-center border-t-2 border-dashed border-slate-200">
        <p className="text-lg text-slate-400 italic">
          Made with 📚 and a lot of ☕ for hackathon builders.
        </p>
        <p className="mt-2 text-xs font-mono text-slate-300 tracking-widest uppercase">
          AskMyNotes © 2026
        </p>
      </footer>
    </main>
  );
}
