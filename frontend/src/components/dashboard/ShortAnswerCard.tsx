"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import type { ShortAnswer } from "./types";

interface ShortAnswerCardProps {
    sa: ShortAnswer;
    index: number;
}

export function ShortAnswerCard({ sa, index }: ShortAnswerCardProps) {
    const [revealed, setRevealed] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)]"
            style={{ filter: "url(#squiggle)" }}
        >
            <div className="flex items-start gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full border-2 border-slate-900 bg-purple-100 flex items-center justify-center text-xs font-black">
                    {index + 1}
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">{sa.question}</p>
            </div>

            {!revealed ? (
                <button
                    onClick={() => setRevealed(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-900 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-800 hover:bg-yellow-50 transition-colors"
                >
                    <Eye size={14} />
                    Reveal Model Answer
                </button>
            ) : (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="border-t-2 border-dashed border-slate-200 pt-3"
                >
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">✏️ Model Answer</div>
                    <p className="text-sm text-slate-700 leading-relaxed bg-green-50 border border-green-200 rounded p-3">
                        {sa.modelAnswer}
                    </p>
                    <p className="mt-2 text-[11px] font-mono text-slate-400">📎 {sa.citation}</p>
                </motion.div>
            )}
        </motion.div>
    );
}
