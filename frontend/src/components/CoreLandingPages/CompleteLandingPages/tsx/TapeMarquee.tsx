"use client";

import { motion } from "framer-motion";
import { Circle } from "lucide-react";

// Scrolling marquee tape with hand-drawn style
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
    );
}
