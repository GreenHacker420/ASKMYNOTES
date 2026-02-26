"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { SUBJECT_COLORS, MAX_SUBJECTS } from "./types";
import type { Subject } from "./types";

interface CreateSubjectModalProps {
    open: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
    existingCount: number;
}

export function CreateSubjectModal({ open, onClose, onCreate, existingCount }: CreateSubjectModalProps) {
    const [name, setName] = useState("");
    const colorInfo = SUBJECT_COLORS[existingCount] ?? SUBJECT_COLORS[0];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || existingCount >= MAX_SUBJECTS) return;
        onCreate(name.trim());
        setName("");
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.85, rotate: -3, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.85, rotate: 3, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                        className="relative w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Shadow */}
                        <div className="absolute inset-0 bg-slate-900 rounded-lg translate-x-2 translate-y-2" style={{ filter: "url(#squiggle)" }} />

                        <div className="relative bg-white border-2 border-slate-900 rounded-lg p-6" style={{ filter: "url(#squiggle)" }}>
                            {/* Tape */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-20 bg-white/60 border border-slate-200 -rotate-2" />

                            <button
                                onClick={onClose}
                                className="absolute top-3 right-3 text-slate-400 hover:text-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <h2 className="text-xl font-black tracking-tight text-slate-900 mb-1">
                                📝 New Subject
                            </h2>
                            <p className="text-sm text-slate-500 mb-6">
                                Subject {existingCount + 1} of {MAX_SUBJECTS}. Choose a name for your subject.
                            </p>

                            {/* Color preview */}
                            <div className={cn("flex items-center gap-3 rounded-lg border-2 p-3 mb-4", colorInfo.border, colorInfo.bg)}>
                                <span className="text-2xl">{colorInfo.emoji}</span>
                                <div>
                                    <div className={cn("text-xs font-bold uppercase tracking-widest", colorInfo.text)}>
                                        Subject {existingCount + 1} Color
                                    </div>
                                    <div className="text-xs text-slate-500">This color will identify your subject</div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Subject Name</label>
                                <input
                                    autoFocus
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Physics, Calculus, History..."
                                    maxLength={40}
                                    className="w-full rounded-md border-2 border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900 transition-colors"
                                />

                                <div className="flex gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 rounded-md border-2 border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!name.trim()}
                                        className={cn(
                                            "flex-1 rounded-md border-2 border-slate-900 px-4 py-2.5 text-sm font-bold transition-all",
                                            name.trim()
                                                ? "bg-yellow-300 text-slate-900 hover:bg-yellow-400 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        Create Subject
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
