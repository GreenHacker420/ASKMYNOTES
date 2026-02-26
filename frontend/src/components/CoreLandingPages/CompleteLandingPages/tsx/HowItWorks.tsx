"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

// 3-step zigzag timeline — Create Subjects → Upload Notes → Ask & Learn
export function HowItWorks() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const steps = [
        {
            step: "01",
            title: "Create Your Subjects",
            desc: "Set up exactly three subjects you want to study. Name them however you like.",
            emoji: "📁",
        },
        {
            step: "02",
            title: "Upload Your Notes",
            desc: "Drag & drop PDFs or TXT files for each subject. Upload as many files as you need.",
            emoji: "📤",
        },
        {
            step: "03",
            title: "Ask & Learn",
            desc: "Select a subject, ask questions in chat, and get cited answers. Or switch to Study Mode for quizzes!",
            emoji: "🎓",
        },
    ];

    return (
        <section id="how-it-works" ref={ref} className="relative z-10 py-24 px-4">
            <motion.div
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-center text-4xl md:text-5xl font-black tracking-tighter text-slate-900 mb-16">
                    How It Works
                    <span className="text-amber-400 ml-1">*</span>
                </h3>

                <div className="relative">
                    {/* Connecting dashed line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px border-l-2 border-dashed border-slate-300 hidden md:block" />

                    {steps.map((item, i) => (
                        <motion.div
                            key={i}
                            className={`relative flex items-center gap-8 mb-12 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: 0.5 + i * 0.25, duration: 0.6 }}
                        >
                            {/* Step circle on the dashed line */}
                            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-slate-900 font-black text-sm z-10">
                                {item.step}
                            </div>

                            {/* Content card */}
                            <div className={`flex-1 ${i % 2 === 0 ? "md:pr-20 md:text-right" : "md:pl-20"}`}>
                                <motion.div
                                    className="inline-block bg-white border-2 border-slate-200 rounded-sm p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)]"
                                    whileHover={{ scale: 1.03, rotate: i % 2 === 0 ? -1 : 1 }}
                                    style={{ filter: "url(#squiggle)" }}
                                >
                                    <span className="text-2xl block mb-2">{item.emoji}</span>
                                    <span className="md:hidden text-xs font-mono text-slate-400 block mb-1">Step {item.step}</span>
                                    <h4 className="font-black text-lg text-slate-800 mb-1">{item.title}</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                                </motion.div>
                            </div>

                            {/* Spacer for the other side */}
                            <div className="hidden md:block flex-1" />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
