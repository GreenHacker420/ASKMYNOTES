"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Loader2, RefreshCw } from "lucide-react";
import type { Subject, StudyQuiz, MCQ, ShortAnswer } from "./types";
import { McqCard } from "./McqCard";
import { ShortAnswerCard } from "./ShortAnswerCard";

interface StudyModePanelProps {
    subject: Subject;
    onGenerateQuiz: (subjectId: string) => void;
    isGenerating: boolean;
}

export function StudyModePanel({ subject, onGenerateQuiz, isGenerating }: StudyModePanelProps) {
    const quiz = subject.studyQuiz;

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                    🧠 Study Mode — {subject.name}
                </h3>
                {quiz && (
                    <button
                        onClick={() => onGenerateQuiz(subject.id)}
                        disabled={isGenerating || subject.files.length === 0}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40"
                    >
                        <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                        Regenerate
                    </button>
                )}
            </div>

            {/* No files warning */}
            {subject.files.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-sm text-slate-500">📎 Upload notes first to generate study questions.</p>
                </div>
            )}

            {/* Generate button (no quiz yet) */}
            {!quiz && subject.files.length > 0 && !isGenerating && (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <motion.div
                        animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="text-6xl mb-6"
                    >
                        🧠
                    </motion.div>
                    <h4 className="text-lg font-black text-slate-800 mb-2">Ready to test yourself?</h4>
                    <p className="text-sm text-slate-500 mb-6 max-w-sm text-center">
                        Generate 5 MCQs and 3 short-answer questions from your {subject.name} notes — all with citations.
                    </p>
                    <button
                        onClick={() => onGenerateQuiz(subject.id)}
                        className="rounded-md border-2 border-slate-900 bg-yellow-300 px-6 py-3 text-sm font-bold text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
                    >
                        <Brain size={18} />
                        Generate Study Questions
                    </button>
                </div>
            )}

            {/* Generating animation */}
            {isGenerating && (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                    <p className="text-sm font-bold text-slate-700">Generating study questions...</p>
                    <p className="text-xs text-slate-400 mt-1">Analyzing your notes for {subject.name}</p>
                </div>
            )}

            {/* Quiz results */}
            {quiz && !isGenerating && (
                <div className="flex-1 overflow-y-auto space-y-8">
                    {/* MCQs */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                📝 Multiple Choice — {quiz.mcqs.length} Questions
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <div className="space-y-4">
                            {quiz.mcqs.map((mcq, i) => (
                                <McqCard key={mcq.id} mcq={mcq} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Short Answers */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                ✏️ Short Answer — {quiz.shortAnswers.length} Questions
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <div className="space-y-4">
                            {quiz.shortAnswers.map((sa, i) => (
                                <ShortAnswerCard key={sa.id} sa={sa} index={i} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
