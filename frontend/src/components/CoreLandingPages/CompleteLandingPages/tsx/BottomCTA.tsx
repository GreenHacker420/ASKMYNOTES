"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SketchButton } from "./SketchButton";

// Bottom call-to-action with dashed offset border
export function BottomCTA() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section ref={ref} className="relative z-10 py-24 px-4">
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 }}
            >
                <div className="inline-block relative">
                    <div className="absolute -inset-3 border-2 border-dashed border-slate-300 rounded-lg -rotate-1" />
                    <div className="relative bg-white border-2 border-slate-900 rounded-lg p-8 md:p-12" style={{ filter: "url(#squiggle)" }}>
                        <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 mb-3">
                            Ready to ace your exams? 🎯
                        </h3>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">
                            Stop drowning in notes. Let AskMyNotes find the answers for you — with proof.
                        </p>
                        <SketchButton className="mx-auto">
                            Start Studying Smarter <ArrowRight size={18} />
                        </SketchButton>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
