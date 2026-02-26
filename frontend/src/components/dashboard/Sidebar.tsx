"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, MessageSquare, Brain } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Subject, DashboardTab } from "./types";
import { SUBJECT_COLORS, MAX_SUBJECTS } from "./types";

interface SidebarProps {
    subjects: Subject[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onCreateClick: () => void;
}

export function Sidebar({ subjects, selectedId, onSelect, onCreateClick }: SidebarProps) {
    return (
        <aside className="flex flex-col h-full w-full bg-[#fdfbf7] relative">
            {/* Right Border Squiggle Line */}
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-slate-900 z-10" />

            {/* Header */}
            <div className="px-5 pt-6 pb-5 border-b-2 border-slate-900 bg-yellow-300 relative">
                {/* Decorative dots */}
                <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-900" />
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-900" />
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-slate-900" />
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-slate-900" />

                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <span className="text-xl">📚</span> My Subjects
                </h2>
                <div className="mt-2 inline-block px-2 py-0.5 border-2 border-slate-900 rounded bg-white font-bold text-[10px] text-slate-700 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                    {subjects.length}/{MAX_SUBJECTS} created
                </div>
            </div>

            {/* Subject list */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 custom-scrollbar">
                <AnimatePresence>
                    {subjects.map((subject, i) => {
                        const color = SUBJECT_COLORS[i] ?? SUBJECT_COLORS[0];
                        const isActive = subject.id === selectedId;

                        return (
                            <motion.button
                                key={subject.id}
                                initial={{ opacity: 0, x: -20, rotate: -2 }}
                                animate={{ opacity: 1, x: 0, rotate: 0 }}
                                transition={{ delay: i * 0.1, type: "spring" }}
                                onClick={() => onSelect(subject.id)}
                                className={cn(
                                    "w-full text-left rounded-xl border-2 p-3 transition-all relative group block",
                                    isActive
                                        ? "border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] translate-x-1 " + color.bg.replace("100", "200")
                                        : "border-slate-300 bg-white hover:border-slate-900 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:-translate-y-0.5 " + "hover:" + color.bg.replace("100", "50")
                                )}
                            >
                                {/* Active Indicator Squiggle */}
                                {isActive && (
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-2 h-8 bg-slate-900 rounded-full" />
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center border-2 border-slate-900 bg-white shadow-sm shrink-0">
                                        <span className="text-xl">{color.emoji}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-base font-black truncate tracking-tight",
                                            isActive ? "text-slate-900" : "text-slate-700"
                                        )}>
                                            {subject.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded border-2 border-slate-900 flex items-center gap-1 bg-white shadow-sm",
                                                isActive ? "text-slate-900" : "text-slate-600"
                                            )}>
                                                <FileText size={10} /> {subject.files.length}
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-bold px-1.5 py-0.5 rounded border-2 border-slate-900 flex items-center gap-1 bg-white shadow-sm",
                                                isActive ? "text-slate-900" : "text-slate-600"
                                            )}>
                                                <MessageSquare size={10} /> {subject.chatMessages.length}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Create button */}
            <div className="p-4 border-t-2 border-slate-900 bg-slate-50 relative">
                {subjects.length < MAX_SUBJECTS ? (
                    <button
                        onClick={onCreateClick}
                        className="w-full relative group flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 px-4 py-3 text-sm font-black text-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all overflow-hidden"
                    >
                        {/* Button Background Fill Animation */}
                        <div className="absolute inset-0 bg-yellow-300 w-0 group-hover:w-full transition-all duration-300 -z-10" />

                        <div className="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center bg-yellow-300 group-hover:bg-white transition-colors">
                            <Plus size={16} strokeWidth={3} />
                        </div>
                        Add Subject ({subjects.length}/{MAX_SUBJECTS})
                    </button>
                ) : (
                    <div className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 px-4 py-3 text-sm font-black text-slate-500 bg-slate-200 shadow-[2px_2px_0px_0px_rgba(15,23,42,0.5)] cursor-not-allowed">
                        <span>✅</span> All {MAX_SUBJECTS} slots filled
                    </div>
                )}
            </div>
        </aside>
    );
}
