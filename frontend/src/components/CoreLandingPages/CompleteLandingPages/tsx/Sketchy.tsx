"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Circle, Layout, PenTool, Ruler, Scissors, Shapes, BookOpen, Brain, Search } from "lucide-react";
import { cn } from "@/src/lib/utils"

// --- 1. The Magic SVG Filter (Squiggly Lines) ---
export function SquiggleFilter() {
    return (
        <svg className="hidden">
            <defs>
                <filter id="squiggle">
                    <feTurbulence type="fractalNoise" baseFrequency="0.01 0.01" numOctaves="5" result="noise" seed="0" />
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
                </filter>
                {/* A second, rougher filter for "filling" */}
                <filter id="pencil-texture">
                    <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                </filter>
            </defs>
        </svg>
    );
}

// --- 2. Hand-Drawn Components ---

export function SketchButton({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, rotate: -1 }}
            whileTap={{ scale: 0.95, rotate: 1 }}
            className={cn(
                "relative px-8 py-3 font-bold text-slate-800 transition-colors group",
                className
            )}
        >
            {/* The Button Border (SVG for perfect stroke control) */}
            <div className="absolute inset-0 h-full w-full" style={{ filter: "url(#squiggle)" }}>
                <svg className="h-full w-full overflow-visible">
                    <rect x="2" y="2" width="100%" height="100%" rx="8" fill="transparent" stroke="currentColor" strokeWidth="3" className="text-slate-800" />
                </svg>
            </div>

            {/* Background Fill (Offset) */}
            <div className="absolute inset-0 top-1 left-1 -z-10 h-full w-full rounded-lg bg-yellow-300 opacity-0 transition-opacity group-hover:opacity-100" style={{ filter: "url(#squiggle)" }} />

            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    );
};

export function StickyNote({ children, color = "bg-yellow-200", rotate = 0, className }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.1, rotate: rotate * -1, zIndex: 10 }}
            className={cn(
                "relative flex h-64 w-64 flex-col justify-between p-6 shadow-sm",
                color,
                className
            )}
            style={{
                filter: "url(#squiggle)",
                transform: `rotate(${rotate}deg)`
            }}
        >
            {/* Tape Effect */}
            <div className="absolute -top-3 left-1/2 h-8 w-24 -translate-x-1/2 bg-white/40 shadow-sm rotate-1" />

            <div className="font-handwriting text-slate-800 text-lg leading-relaxed">
                {children}
            </div>

            <div className="self-end opacity-50">
                <Scissors size={16} />
            </div>
        </motion.div>
    )
}

// --- 3. Graph Paper Background ---
export function GraphPaper() {
    return (
        <div className="fixed inset-0 -z-10 bg-[#fdfbf7]">
            {/* Blue Grid Lines */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)", backgroundSize: "40px 40px" }}
            />
            {/* Paper Grain */}
            <div className="absolute inset-0 opacity-30" style={{ filter: "url(#pencil-texture)" }} />
        </div>
    );
}

// --- 4. Hero Section with Live Drawing ---
export function Hero() {
    return (
        <section className="relative flex min-h-screen flex-col items-center justify-center pt-24 pb-12 overflow-hidden px-4">

            {/* The "Highlighter" Stroke behind text */}
            <div className="relative mb-6 text-center">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5, ease: "circOut" }}
                    className="absolute bottom-2 left-0 -z-10 h-6 w-full origin-left -rotate-1 rounded-sm bg-blue-300/50"
                    style={{ filter: "url(#squiggle)" }}
                />
                <span className="font-mono text-sm font-bold uppercase tracking-widest text-blue-600">
                    Subject-Scoped Study Copilot
                </span>
            </div>

            <h1 className="relative text-center text-6xl font-black tracking-tight text-slate-900 md:text-8xl">
                Ask <span className="relative inline-block">
                    Your Notes
                    {/* Hand Drawn Circle */}
                    <svg className="absolute -left-4 -top-6 h-[140%] w-[120%] overflow-visible text-red-500 pointer-events-none" style={{ filter: "url(#squiggle)" }}>
                        <motion.path
                            d="M 10 30 Q 50 10 90 30 T 170 30"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 1 }}
                        />
                        <motion.path
                            d="M 10 50 Q 60 70 170 50"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="4"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1, delay: 1.2 }}
                        />
                    </svg>
                </span> <br />
                Get Answers.
            </h1>

            <p className="mt-8 max-w-lg text-center font-medium text-slate-500 text-lg leading-relaxed">
                Upload notes for <strong className="text-slate-700">3 subjects</strong>, ask questions in a chat, and get <strong className="text-slate-700">grounded answers with citations</strong> — straight from your study material. No guessing, no hallucinations.
            </p>

            <div className="mt-12 flex gap-6">
                <SketchButton>
                    Get Started <ArrowRight size={18} />
                </SketchButton>
                <button className="px-6 py-3 font-mono text-sm font-bold text-slate-500 underline decoration-wavy underline-offset-4 hover:text-slate-900">
                    How It Works
                </button>
            </div>

            {/* Live Drawing Animation Box - Study Interface Preview */}
            <div className="mt-20 w-full max-w-4xl">
                <div className="relative aspect-video w-full rounded-xl border-2 border-slate-900 bg-white p-4 shadow-xl" style={{ filter: "url(#squiggle)" }}>
                    {/* Browser Header */}
                    <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-4 mb-8">
                        <div className="h-3 w-3 rounded-full border border-slate-900 bg-red-400" />
                        <div className="h-3 w-3 rounded-full border border-slate-900 bg-yellow-400" />
                        <div className="h-3 w-3 rounded-full border border-slate-900 bg-green-400" />
                        <span className="ml-4 font-mono text-xs text-slate-400">AskMyNotes — Chat</span>
                    </div>

                    {/* Content: Study App Layout Drawing Itself */}
                    <div className="grid grid-cols-12 gap-4 h-64">
                        {/* Sidebar - Subject list */}
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "100%" }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="col-span-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-2 overflow-hidden"
                        >
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.5 }}
                                className="space-y-2"
                            >
                                <div className="h-6 rounded bg-blue-100 border border-blue-200 flex items-center px-2">
                                    <span className="text-[10px] font-mono text-blue-600 truncate">📘 Physics</span>
                                </div>
                                <div className="h-6 rounded bg-green-100 border border-green-200 flex items-center px-2">
                                    <span className="text-[10px] font-mono text-green-600 truncate">📗 Chemistry</span>
                                </div>
                                <div className="h-6 rounded bg-purple-100 border border-purple-200 flex items-center px-2">
                                    <span className="text-[10px] font-mono text-purple-600 truncate">📕 Math</span>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Main Content - Chat area */}
                        <div className="col-span-9 flex flex-col gap-4">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.8, delay: 1 }}
                                className="h-32 w-full rounded-lg border-2 border-slate-900 bg-blue-50 p-3 overflow-hidden"
                            >
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2 }}
                                    className="space-y-2"
                                >
                                    <div className="flex gap-2 items-start">
                                        <div className="h-4 w-4 rounded-full bg-slate-300 flex-shrink-0 mt-0.5" />
                                        <div className="bg-white rounded px-2 py-1 border border-slate-200">
                                            <span className="text-[9px] text-slate-600">What is Newton&apos;s 2nd law?</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-start justify-end">
                                        <div className="bg-blue-100 rounded px-2 py-1 border border-blue-200">
                                            <span className="text-[9px] text-blue-700">F = ma [📎 Ch.3, p.42]</span>
                                        </div>
                                        <div className="h-4 w-4 rounded-full bg-blue-400 flex-shrink-0 mt-0.5" />
                                    </div>
                                </motion.div>
                            </motion.div>
                            <div className="flex gap-4 h-full">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5, delay: 1.8 }}
                                    className="h-full w-1/2 rounded-lg border-2 border-slate-900 bg-yellow-50 p-2 overflow-hidden"
                                >
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
                                        <span className="text-[9px] font-bold text-slate-700 block mb-1">📊 Confidence</span>
                                        <div className="h-3 w-3/4 bg-green-300 rounded-full" />
                                        <span className="text-[8px] text-green-700 mt-1 block">High</span>
                                    </motion.div>
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.5, delay: 2.0 }}
                                    className="h-full w-1/2 rounded-lg border-2 border-slate-900 bg-pink-50 p-2 overflow-hidden"
                                >
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
                                        <span className="text-[9px] font-bold text-slate-700 block mb-1">📎 Evidence</span>
                                        <span className="text-[8px] text-slate-500 block">notes_ch3.pdf</span>
                                        <span className="text-[8px] text-slate-500 block">pg 42, sec 3.2</span>
                                    </motion.div>
                                </motion.div>
                            </div>
                        </div>
                    </div>

                    {/* Cursor */}
                    <motion.div
                        initial={{ x: 0, y: 0, opacity: 0 }}
                        animate={{
                            x: [0, 200, 400, 300],
                            y: [0, 100, 50, 200],
                            opacity: 1
                        }}
                        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute top-0 left-0 pointer-events-none"
                    >
                        <PenTool className="h-8 w-8 text-slate-900 -rotate-12 drop-shadow-lg" fill="white" />
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

// --- 5. Features (Sticky Notes) ---
export function FeatureBoard() {
    return (
        <section className="py-32 px-4 overflow-hidden">
            <div className="mx-auto max-w-6xl">
                <div className="mb-20 flex items-end justify-between border-b-2 border-slate-900 pb-4">
                    <h2 className="text-4xl font-black text-slate-900">
                        The <span className="text-blue-600 decoration-wavy underline">Feature</span> Board.
                    </h2>
                    <Ruler className="text-slate-400" />
                </div>

                <div className="flex flex-wrap justify-center gap-12">
                    <StickyNote rotate={-3} color="bg-yellow-200">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-white">
                            <BookOpen size={20} />
                        </div>
                        <h3 className="font-bold text-xl mb-2">3-Subject Setup</h3>
                        <p className="text-sm">Create 3 subjects & upload PDF/TXT notes for each. Multiple files per subject supported.</p>
                    </StickyNote>

                    <StickyNote rotate={2} color="bg-blue-200">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-white">
                            <Search size={20} />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Scoped Q&A</h3>
                        <p className="text-sm">Pick a subject, ask questions, get answers strictly from your notes with citations & evidence.</p>
                    </StickyNote>

                    <StickyNote rotate={-1} color="bg-pink-200">
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-white">
                            <Brain size={20} />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Study Mode</h3>
                        <p className="text-sm">Auto-generate 5 MCQs + 3 short-answer questions with model answers, all cited from your notes.</p>
                    </StickyNote>
                </div>
            </div>
        </section>
    )
}

// --- 6. Marquee (Handwritten Tape) ---
export function TapeMarquee() {
    return (
        <div className="relative -rotate-2 bg-slate-900 py-6 overflow-hidden shadow-xl" style={{ filter: "url(#squiggle)" }}>
            <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                className="flex whitespace-nowrap"
            >
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="flex items-center gap-8 mx-8">
                        <span className="text-3xl font-black text-[#fdfbf7] uppercase tracking-widest">
                            Upload • Ask • Learn • Cite
                        </span>
                        <Circle className="h-4 w-4 fill-blue-500 text-blue-500" />
                    </div>
                ))}
            </motion.div>
        </div>
    )
}
