"use client";

import { Ruler, BookOpen, Brain, Search } from "lucide-react";
import { StickyNote } from "./StickyNote";

// Feature Board with sticky notes — 3 key features
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
    );
}
