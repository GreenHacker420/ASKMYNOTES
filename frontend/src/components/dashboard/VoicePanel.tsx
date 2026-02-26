"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Search, AlertCircle, Quote, Sparkles, User, GraduationCap } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useStudyStore } from "@/src/store/useStudyStore";
import { SketchButton } from "../CoreLandingPages/CompleteLandingPages/tsx/SketchButton";

export function VoicePanel() {
    const {
        selectedId,
        subjects,
        voiceStatus,
        setVoiceStatus,
        isVoiceActive,
        setVoiceActive,
        addChatMessage
    } = useStudyStore();

    const selectedSubject = subjects.find(s => s.id === selectedId);
    const [transcript, setTranscript] = useState("");
    const [lastAiResponse, setLastAiResponse] = useState<string | null>(null);

    // Simulation: Toggle listening state
    const toggleVoice = () => {
        if (isVoiceActive) {
            setVoiceActive(false);
            setVoiceStatus("idle");
        } else {
            setVoiceActive(true);
            setVoiceStatus("listening");

            // Simulate hearing a question after 2 seconds
            setTimeout(() => {
                setVoiceStatus("processing");
                setTranscript("Can you explain the main concept of this subject?");

                // Simulate AI thinking and then speaking
                setTimeout(() => {
                    setVoiceStatus("speaking");
                    setLastAiResponse("Based on your notes, the main concept involves the fundamental relationship between force and acceleration...");

                    // Add to chat history too for multi-turn context
                    if (selectedId) {
                        addChatMessage(selectedId, {
                            id: Math.random().toString(),
                            role: "assistant",
                            content: "I've explained this in our voice session: The main concept involves the fundamental relationship between force and acceleration.",
                            timestamp: new Date()
                        });
                    }

                    // Return to idle/listening after speaking
                    setTimeout(() => {
                        setVoiceStatus("listening");
                        setTranscript("");
                    }, 4000);
                }, 1500);
            }, 2000);
        }
    };

    if (!selectedId) return null;

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] relative overflow-hidden">
            {/* Background Ornaments */}
            <div className="absolute top-10 right-10 opacity-10 pointer-events-none">
                <Sparkles size={120} className="text-yellow-400 rotate-12" />
            </div>
            <div className="absolute bottom-10 left-10 opacity-10 pointer-events-none">
                <Volume2 size={100} className="text-blue-400 -rotate-12" />
            </div>

            {/* Header */}
            <div className="p-6 border-b-2 border-slate-900 bg-white z-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <Mic className="text-indigo-500" />
                            Voice Interaction
                        </h2>
                        <p className="text-slate-500 font-medium text-sm mt-1">
                            Talk to your {selectedSubject?.name} notes like a personal teacher.
                        </p>
                    </div>

                    <div className={cn(
                        "px-4 py-1.5 rounded-full border-2 border-slate-900 font-bold text-xs uppercase tracking-tighter flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
                        voiceStatus === "listening" ? "bg-red-100 text-red-600 animate-pulse" :
                            voiceStatus === "processing" ? "bg-yellow-100 text-yellow-600" :
                                voiceStatus === "speaking" ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-600"
                    )}>
                        <span className={cn("w-2 h-2 rounded-full",
                            voiceStatus === "listening" ? "bg-red-600" :
                                voiceStatus === "processing" ? "bg-yellow-600" :
                                    voiceStatus === "speaking" ? "bg-green-600" : "bg-slate-400"
                        )} />
                        {voiceStatus}
                    </div>
                </div>
            </div>

            {/* Main Visualizer Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                <div className="relative mb-12">
                    {/* Pulsing circles behind the mic */}
                    <AnimatePresence>
                        {isVoiceActive && (
                            <>
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                                    className="absolute inset-0 rounded-full bg-indigo-200 -z-10"
                                />
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: [1, 1.6], opacity: [0.3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                                    className="absolute inset-0 rounded-full bg-indigo-100 -z-10"
                                />
                            </>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={toggleVoice}
                        className={cn(
                            "w-32 h-32 rounded-full border-4 border-slate-900 flex items-center justify-center transition-all shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none",
                            isVoiceActive ? "bg-red-400 text-white translate-x-1 translate-y-1 shadow-none" : "bg-white text-slate-900 hover:bg-slate-50"
                        )}
                        style={{ filter: "url(#squiggle)" }}
                    >
                        {isVoiceActive ? <MicOff size={48} /> : <Mic size={48} />}
                    </button>

                    {!isVoiceActive && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap text-slate-400 font-bold text-xs uppercase tracking-widest"
                        >
                            Tap to start session
                        </motion.div>
                    )}
                </div>

                {/* Dynamic Conversation Display */}
                <div className="w-full max-w-2xl mt-12 space-y-6">
                    <AnimatePresence mode="wait">
                        {transcript && (
                            <motion.div
                                key="transcript"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-start gap-4"
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-white flex items-center justify-center flex-shrink-0 mt-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                                    <User size={20} className="text-slate-600" />
                                </div>
                                <div className="bg-white border-2 border-slate-900 p-4 rounded-2xl rounded-tl-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]" style={{ filter: "url(#squiggle)" }}>
                                    <p className="italic text-slate-700 font-medium">"{transcript}"</p>
                                </div>
                            </motion.div>
                        )}

                        {lastAiResponse && voiceStatus === "speaking" && (
                            <motion.div
                                key="response"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-4 flex-row-reverse"
                            >
                                <div className="w-10 h-10 rounded-full border-2 border-slate-900 bg-yellow-300 flex items-center justify-center flex-shrink-0 mt-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                                    <GraduationCap size={20} className="text-slate-900" />
                                </div>
                                <div className="bg-indigo-50 border-2 border-slate-900 p-4 rounded-2xl rounded-tr-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] max-w-md" style={{ filter: "url(#squiggle)" }}>
                                    <div className="flex gap-1 mb-2">
                                        <motion.div animate={{ height: [4, 12, 4] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-1 bg-indigo-500 rounded-full" />
                                        <motion.div animate={{ height: [8, 4, 8] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-1 bg-indigo-500 rounded-full" />
                                        <motion.div animate={{ height: [6, 10, 6] }} transition={{ duration: 0.4, repeat: Infinity }} className="w-1 bg-indigo-500 rounded-full" />
                                    </div>
                                    <p className="text-slate-900 font-bold text-lg leading-snug">{lastAiResponse}</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-6 text-center text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">
                AskMyNotes • Teacher Mode • Phase 1
            </div>
        </div>
    );
}
