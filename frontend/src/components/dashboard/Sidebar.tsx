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
        <aside className="flex flex-col h-full w-full">
            {/* Header */}
            <div className="px-4 pt-4 pb-3 border-b border-slate-200">
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">
                    📚 My Subjects
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                    {subjects.length}/{MAX_SUBJECTS} subjects created
                </p>
            </div>

            {/* Subject list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                <AnimatePresence>
                    {subjects.map((subject, i) => {
                        const color = SUBJECT_COLORS[i] ?? SUBJECT_COLORS[0];
                        const isActive = subject.id === selectedId;

                        return (
                            <motion.button
                                key={subject.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => onSelect(subject.id)}
                                className={cn(
                                    "w-full text-left rounded-lg border-2 p-3 transition-all group",
                                    isActive
                                        ? `${color.border} ${color.bg} shadow-[3px_3px_0px_0px_rgba(0,0,0,0.1)]`
                                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="text-lg">{color.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-bold truncate", isActive ? color.text : "text-slate-700")}>
                                            {subject.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                <FileText size={9} /> {subject.files.length}
                                            </span>
                                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                <MessageSquare size={9} /> {subject.chatMessages.length}
                                            </span>
                                            {subject.studyQuiz && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                                    <Brain size={9} /> ✓
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color.accent }} />
                                    )}
                                </div>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Create button */}
            {subjects.length < MAX_SUBJECTS && (
                <div className="p-3 border-t border-slate-200">
                    <button
                        onClick={onCreateClick}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-slate-500 hover:border-slate-900 hover:text-slate-900 hover:bg-yellow-50 transition-all"
                    >
                        <Plus size={16} />
                        Add Subject ({subjects.length}/{MAX_SUBJECTS})
                    </button>
                </div>
            )}

            {subjects.length >= MAX_SUBJECTS && (
                <div className="p-3 border-t border-slate-200">
                    <div className="text-center text-[10px] text-slate-400 py-2 font-mono">
                        ✅ All {MAX_SUBJECTS} subjects created
                    </div>
                </div>
            )}
        </aside>
    );
}
