"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenTool } from "lucide-react";
import { GraphPaper } from "./CoreLandingPages/CompleteLandingPages/tsx/Sketchy";

const loadingTexts = [
    "Sharpening pencils...",
    "Opening notebooks...",
    "Finding the right page...",
    "Getting things ready...",
];

export default function Preloader() {
    const [isLoading, setIsLoading] = useState(true);
    const [textIndex, setTextIndex] = useState(0);

    useEffect(() => {
        // Change text every 800ms
        const textInterval = setInterval(() => {
            setTextIndex((prev) => (prev + 1) % loadingTexts.length);
        }, 800);

        // End loading after 3.2 seconds
        const hideTimeout = setTimeout(() => {
            setIsLoading(false);
        }, 3200);

        return () => {
            clearInterval(textInterval);
            clearTimeout(hideTimeout);
        };
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    key="preloader"
                    // Exit animation: slides up and fades out elegantly
                    exit={{ y: "-100%", opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#fdfbf7]"
                >
                    {/* Sketchy filter definition specifically for the preloader */}
                    <svg className="hidden">
                        <defs>
                            <filter id="preloader-squiggle">
                                <feTurbulence type="fractalNoise" baseFrequency="0.015 0.015" numOctaves="3" result="noise" seed="0" />
                                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
                            </filter>
                        </defs>
                    </svg>

                    {/* Graph paper background */}
                    <div className="absolute inset-0 z-0">
                        <GraphPaper />
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {/* The Logo / Icon Drawing */}
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ rotate: [-5, 5, -5] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative"
                            >
                                <div className="h-16 w-16 rounded border-4 border-slate-900 bg-slate-800" style={{ filter: "url(#preloader-squiggle)" }} />

                                {/* Floating doodles around the logo */}
                                <motion.svg className="absolute -top-6 -right-8 w-10 h-10 text-yellow-400" viewBox="0 0 50 50"
                                    animate={{ rotate: 180, scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}>
                                    <path d="M 25 5 L 30 20 L 45 25 L 30 30 L 25 45 L 20 30 L 5 25 L 20 20 Z" fill="currentColor" style={{ filter: "url(#preloader-squiggle)" }} />
                                </motion.svg>
                            </motion.div>
                        </div>

                        {/* The Sketchy Progress Bar */}
                        <div className="relative w-64 md:w-80 h-10 mb-6">
                            {/* Box border */}
                            <div
                                className="absolute inset-0 border-4 border-slate-900 rounded-md bg-white p-1"
                                style={{ filter: "url(#preloader-squiggle)" }}
                            />

                            {/* Fill bar */}
                            <div className="absolute inset-x-2 top-2 bottom-2 overflow-hidden rounded-sm" style={{ filter: "url(#preloader-squiggle)" }}>
                                <motion.div
                                    className="h-full bg-yellow-300 w-full origin-left"
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 3, ease: "easeInOut" }}
                                />
                            </div>

                            {/* The Pencil moving along the bar */}
                            <motion.div
                                className="absolute -top-10 left-0"
                                initial={{ x: "-5%" }}
                                animate={{ x: "105%" }}
                                transition={{ duration: 3, ease: "easeInOut" }}
                            >
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: [-10, 0, -15, 5, -10], y: [0, -4, 2, -2, 0] }}
                                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                                    >
                                        <PenTool size={40} className="text-slate-900 drop-shadow-lg -rotate-[100deg]" fill="white" />
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Text cycling */}
                        <div className="h-8 mb-2">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={textIndex}
                                    initial={{ opacity: 0, y: 10, rotate: -2 }}
                                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                                    exit={{ opacity: 0, y: -10, rotate: 2 }}
                                    transition={{ duration: 0.3 }}
                                    className="font-handwriting text-slate-800 text-lg md:text-xl font-bold tracking-wide"
                                    style={{ filter: "url(#preloader-squiggle)" }}
                                >
                                    {loadingTexts[textIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Sub text */}
                        <p className="font-mono text-xs text-slate-400">AskMyNotes • Study Copilot</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
