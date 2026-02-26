"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { MCQ } from "./types";

interface McqCardProps {
    mcq: MCQ;
    index: number;
}

export function McqCard({ mcq, index }: McqCardProps) {
    const [selected, setSelected] = useState<number | null>(null);
    const [revealed, setRevealed] = useState(false);

    const handleSelect = (optionIndex: number) => {
        if (revealed) return;
        setSelected(optionIndex);
    };

    const handleReveal = () => {
        setRevealed(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)]"
            style={{ filter: "url(#squiggle)" }}
        >
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-900 bg-blue-100 flex items-center justify-center text-xs font-black">
                    {index + 1}
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{mcq.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-4">
                {mcq.options.map((option, i) => {
                    let optionStyle = "border-slate-200 bg-white hover:bg-slate-50";
                    if (revealed) {
                        if (i === mcq.correctIndex) {
                            optionStyle = "border-green-400 bg-green-50";
                        } else if (i === selected && i !== mcq.correctIndex) {
                            optionStyle = "border-red-400 bg-red-50";
                        }
                    } else if (i === selected) {
                        optionStyle = "border-yellow-400 bg-yellow-50";
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleSelect(i)}
                            disabled={revealed}
                            className={cn(
                                "w-full text-left rounded-md border-2 px-4 py-2.5 text-sm transition-all flex items-center gap-3",
                                optionStyle,
                                !revealed && "cursor-pointer"
                            )}
                        >
                            <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(65 + i)}
                            </span>
                            <span>{option}</span>
                            {revealed && i === mcq.correctIndex && <Check size={16} className="ml-auto text-green-600" />}
                            {revealed && i === selected && i !== mcq.correctIndex && <X size={16} className="ml-auto text-red-500" />}
                        </button>
                    );
                })}
            </div>

            {/* Reveal / Explanation */}
            {!revealed ? (
                <button
                    onClick={handleReveal}
                    disabled={selected === null}
                    className={cn(
                        "w-full rounded-md border-2 border-dashed px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all",
                        selected !== null
                            ? "border-slate-900 text-slate-800 hover:bg-yellow-50"
                            : "border-slate-300 text-slate-400 cursor-not-allowed"
                    )}
                >
                    Check Answer
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 pt-3 border-t-2 border-dashed border-slate-200"
                >
                    <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-800">💡 Explanation: </span>
                        {mcq.explanation}
                    </p>
                    <p className="mt-2 text-[11px] font-mono text-slate-400">📎 {mcq.citation}</p>
                </motion.div>
            )}
        </motion.div>
    );
}
