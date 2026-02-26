"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BookOpen, Search, FileText, ShieldCheck, Brain, Zap } from "lucide-react";
import { FloatingDoodles } from "./FloatingDoodles";

// --- Internal: Notebook Feature Card (with pin + notebook ruling lines) ---
function NotebookFeatureCard({
    icon: Icon,
    title,
    description,
    rotation,
    delay,
    pinColor,
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    rotation: number;
    delay: number;
    pinColor: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <motion.div
            ref={ref}
            className="relative group"
            initial={{ opacity: 0, y: 60, rotate: rotation * 2 }}
            animate={isInView ? { opacity: 1, y: 0, rotate: rotation } : {}}
            transition={{ duration: 0.6, delay, ease: "easeOut" }}
        >
            {/* Pin */}
            <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-6 h-6 rounded-full shadow-md border-2 border-white"
                style={{ backgroundColor: pinColor }}
            />

            {/* Card */}
            <motion.div
                className="relative bg-white border-2 border-slate-200 rounded-sm p-6 pt-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)] transition-all cursor-default overflow-hidden"
                whileHover={{
                    rotate: 0,
                    scale: 1.05,
                    zIndex: 10,
                }}
                style={{ filter: "url(#squiggle)" }}
            >
                {/* Notebook ruling lines */}
                <div className="absolute inset-x-4 top-8 bottom-4 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="border-b border-blue-100/60" style={{ height: "28px" }} />
                    ))}
                </div>

                {/* Red margin line */}
                <div className="absolute top-0 bottom-0 left-10 w-px bg-rose-200/60" />

                <div className="relative z-10">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-800 bg-white">
                        <Icon size={20} />
                    </div>
                    <h3 className="font-black text-lg text-slate-800 mb-2 tracking-tight">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed font-light">{description}</p>
                </div>

                {/* Corner fold */}
                <div className="absolute bottom-0 right-0 w-0 h-0 border-l-[16px] border-t-[16px] border-l-transparent border-t-slate-100/80" />
            </motion.div>
        </motion.div>
    );
}

// --- Exported: 6-card Notebook Feature Grid ---
export function NotebookFeatureGrid() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const features = [
        {
            icon: BookOpen,
            title: "Three-Subject Setup",
            description: "Create exactly 3 subjects and upload multiple PDF or TXT notes for each. Your study material, perfectly organized.",
            rotation: -2,
            pinColor: "#ef4444",
        },
        {
            icon: Search,
            title: "Subject-Scoped Q&A",
            description: "Select a subject and ask questions in a chat interface. Answers come strictly from your uploaded notes — nothing else.",
            rotation: 1.5,
            pinColor: "#3b82f6",
        },
        {
            icon: FileText,
            title: "Citations & Evidence",
            description: "Every answer includes file name references, page/section citations, confidence level, and top supporting evidence snippets.",
            rotation: -1,
            pinColor: "#10b981",
        },
        {
            icon: ShieldCheck,
            title: '"Not Found" Handling',
            description: 'No guessing. No fabrication. If the answer isn\'t in your notes, you get a clear "Not found in your notes" response.',
            rotation: 2,
            pinColor: "#f59e0b",
        },
        {
            icon: Brain,
            title: "Study Mode",
            description: "Generate 5 MCQs with explanations and 3 short-answer questions with model answers — all with citations from your notes.",
            rotation: -1.5,
            pinColor: "#8b5cf6",
        },
        {
            icon: Zap,
            title: "Instant & Accurate",
            description: "Powered by AI with strict grounding. Get transparent, trustworthy answers with confidence levels: High, Medium, or Low.",
            rotation: 1,
            pinColor: "#ec4899",
        },
    ];

    return (
        <section ref={ref} className="relative z-10 py-24 px-4 md:px-12 lg:px-20">
            <FloatingDoodles />

            {/* Section heading */}
            <motion.div
                className="text-center mb-16"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
            >
                <motion.span
                    className="inline-block text-xs font-mono uppercase tracking-[0.3em] text-slate-400 mb-4"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ delay: 0.2 }}
                >
                    ── All Features ──
                </motion.span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
                    Everything You Need to{" "}
                    <span className="relative inline-block">
                        Study Smarter
                        <svg className="absolute -bottom-2 left-0 w-full h-3" viewBox="0 0 200 12" preserveAspectRatio="none">
                            <motion.path
                                d="M0 6 C40 0 60 12 100 6 C140 0 160 12 200 6"
                                fill="none"
                                stroke="#f59e0b"
                                strokeWidth="3"
                                strokeLinecap="round"
                                initial={{ pathLength: 0 }}
                                animate={isInView ? { pathLength: 1 } : {}}
                                transition={{ duration: 1, delay: 0.5 }}
                            />
                        </svg>
                    </span>
                </h2>
            </motion.div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {features.map((feature, i) => (
                    <NotebookFeatureCard
                        key={i}
                        icon={feature.icon}
                        title={feature.title}
                        description={feature.description}
                        rotation={feature.rotation}
                        delay={0.1 + i * 0.1}
                        pinColor={feature.pinColor}
                    />
                ))}
            </div>
        </section>
    );
}
