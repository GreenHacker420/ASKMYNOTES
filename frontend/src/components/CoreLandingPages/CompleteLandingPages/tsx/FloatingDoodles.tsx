"use client";

import { motion } from "framer-motion";

// Floating animated SVG doodles — star, circle, book, lightbulb, squiggle, arrow
export function FloatingDoodles() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Star doodle */}
            <motion.svg
                className="absolute top-20 right-[15%] w-12 h-12 text-amber-400 opacity-50"
                viewBox="0 0 40 40"
                animate={{ rotate: [0, 15, -15, 0], y: [0, -8, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                <path
                    d="M20 2 L24 14 L38 14 L27 22 L31 36 L20 28 L9 36 L13 22 L2 14 L16 14 Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
            </motion.svg>

            {/* Circle doodle */}
            <motion.svg
                className="absolute top-40 left-[10%] w-16 h-16 text-blue-400 opacity-30"
                viewBox="0 0 50 50"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" />
            </motion.svg>

            {/* Book doodle */}
            <motion.svg
                className="absolute top-[30%] right-[8%] w-14 h-14 text-violet-400 opacity-35"
                viewBox="0 0 50 50"
                animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <path
                    d="M10 40 L10 10 C15 8 20 8 25 12 C30 8 35 8 40 10 L40 40 C35 38 30 38 25 42 C20 38 15 38 10 40Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <line x1="25" y1="12" x2="25" y2="42" stroke="currentColor" strokeWidth="1.5" />
            </motion.svg>

            {/* Lightbulb doodle */}
            <motion.svg
                className="absolute bottom-[25%] left-[12%] w-10 h-14 text-yellow-500 opacity-35"
                viewBox="0 0 40 55"
                animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.55, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
                <path
                    d="M20 5 C10 5 5 12 5 20 C5 28 12 32 14 38 L26 38 C28 32 35 28 35 20 C35 12 30 5 20 5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                />
                <line x1="14" y1="42" x2="26" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="15" y1="46" x2="25" y2="46" stroke="currentColor" strokeWidth="2" />
                <line x1="17" y1="50" x2="23" y2="50" stroke="currentColor" strokeWidth="2" />
            </motion.svg>

            {/* Squiggly underline */}
            <motion.svg
                className="absolute top-[55%] left-[5%] w-28 h-6 text-rose-400 opacity-25"
                viewBox="0 0 120 20"
                animate={{ x: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
                <path
                    d="M0 10 Q10 0 20 10 Q30 20 40 10 Q50 0 60 10 Q70 20 80 10 Q90 0 100 10 Q110 20 120 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </motion.svg>

            {/* Arrow doodle */}
            <motion.svg
                className="absolute bottom-[35%] right-[18%] w-16 h-16 text-emerald-500 opacity-25"
                viewBox="0 0 60 60"
                animate={{ x: [0, 10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
                <path
                    d="M10 50 C20 20 40 15 50 10 M42 8 L50 10 L48 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
            </motion.svg>
        </div>
    );
}
