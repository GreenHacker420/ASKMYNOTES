"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles, User, GraduationCap, X, FileText } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useStudyStore } from "@/src/store/useStudyStore";
import type { Subject } from "@/src/components/dashboard/types";
import { getSocket } from "@/src/lib/socket";
import { ConfidenceBadge } from "@/src/components/dashboard/ConfidenceBadge";

interface VoiceMessage {
    id: string;
    role: "user" | "ai";
    text: string;
    citations?: Array<{ fileName: string; page: number | null; chunkId: string }>;
    confidence?: "High" | "Medium" | "Low";
    evidence?: string[];
    found?: boolean;
}

/* ---------- localStorage helpers for threadId ---------- */
function getStoredThreadId(subjectId: string): string | null {
    try {
        return localStorage.getItem(`voice-thread-${subjectId}`);
    } catch {
        return null;
    }
}
function storeThreadId(subjectId: string, threadId: string) {
    try {
        localStorage.setItem(`voice-thread-${subjectId}`, threadId);
    } catch { /* ignore */ }
}

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

    const selectedSubject = subjects.find((s: Subject) => s.id === selectedId);
    const [messages, setMessages] = useState<VoiceMessage[]>([]);
    const [voiceStage, setVoiceStage] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const sessionStartedRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    /* ---- audio capture refs ---- */
    const captureCtxRef = useRef<AudioContext | null>(null);
    const captureSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const captureWorkletRef = useRef<AudioWorkletNode | null>(null);
    const captureStreamRef = useRef<MediaStream | null>(null);

    /* ---- audio playback refs ---- */
    const playbackCtxRef = useRef<AudioContext | null>(null);
    const playbackWorkletRef = useRef<AudioWorkletNode | null>(null);

    /* ---- auto-scroll on new messages ---- */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    /* ---- helper: Int16 PCM → base64 ---- */
    const int16ToBase64 = (int16: Int16Array): string => {
        const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };

    /* ---- start/stop raw PCM capture via AudioWorklet ---- */
    const startCapture = useCallback(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        });
        captureStreamRef.current = stream;

        const ctx = new AudioContext({ sampleRate: 16000 });
        captureCtxRef.current = ctx;

        // Load the worklet processor (served from /public)
        await ctx.audioWorklet.addModule("/pcm-capture-processor.js");

        const source = ctx.createMediaStreamSource(stream);
        captureSourceRef.current = source;

        const workletNode = new AudioWorkletNode(ctx, "pcm-capture-processor");
        captureWorkletRef.current = workletNode;

        // Receive Int16 PCM chunks from the worklet thread
        workletNode.port.onmessage = (e: MessageEvent<{ pcm: Int16Array }>) => {
            const base64 = int16ToBase64(e.data.pcm);
            getSocket().emit("voice:audio", {
                data: base64,
                mimeType: "audio/pcm;rate=16000"
            });
        };

        source.connect(workletNode);
        workletNode.connect(ctx.destination); // required to keep the worklet alive
    }, []);

    const stopCapture = useCallback(() => {
        captureWorkletRef.current?.disconnect();
        captureSourceRef.current?.disconnect();
        captureStreamRef.current?.getTracks().forEach((t) => t.stop());
        captureCtxRef.current?.close().catch(() => { });
        captureWorkletRef.current = null;
        captureSourceRef.current = null;
        captureStreamRef.current = null;
        captureCtxRef.current = null;
    }, []);

    /* ---- raw PCM playback via AudioWorklet ---- */
    const ensurePlayback = useCallback(async () => {
        if (!playbackCtxRef.current) {
            playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
            await playbackCtxRef.current.audioWorklet.addModule("/pcm-playback-processor.js");
            playbackWorkletRef.current = new AudioWorkletNode(playbackCtxRef.current, "pcm-playback-processor");
            playbackWorkletRef.current.connect(playbackCtxRef.current.destination);
        }
        if (playbackCtxRef.current.state === "suspended") {
            await playbackCtxRef.current.resume();
        }
    }, []);

    const pushPlaybackPcm = useCallback(async (pcm: Int16Array) => {
        await ensurePlayback();
        playbackWorkletRef.current?.port.postMessage({ type: "data", pcm }, [pcm.buffer]);
    }, [ensurePlayback]);

    /* ---- toggle voice on/off ---- */
    const toggleVoice = async () => {
        if (!selectedId) return;

        if (isVoiceActive) {
            stopCapture();
            setVoiceActive(false);
            setVoiceStatus("idle");
            // Flush any buffered audio on the server
            getSocket().emit("voice:audio", { audioStreamEnd: true });
            return;
        }

        try {
            // Start the Live API session if not started
            if (!sessionStartedRef.current) {
                const threadId = getStoredThreadId(selectedId) ?? `thread-${Date.now()}`;
                storeThreadId(selectedId, threadId);

                getSocket().emit("voice:start", {
                    subjectId: selectedId,
                    threadId,
                    subjectName: selectedSubject?.name
                });
                sessionStartedRef.current = true;
            }

            await startCapture();
            setVoiceActive(true);
            setVoiceStatus("listening");
        } catch (error) {
            console.error("Voice capture failed:", error);
            setVoiceStatus("idle");
        }
    };

    /* ---- end session fully ---- */
    const endSession = useCallback(() => {
        stopCapture();
        getSocket().emit("voice:stop");
        setVoiceActive(false);
        setVoiceStatus("idle");
        setVoiceStage(null);
        sessionStartedRef.current = false;
        setMessages([]);
        playbackWorkletRef.current?.port.postMessage({ type: "clear" });
        playbackWorkletRef.current?.disconnect();
        playbackCtxRef.current?.close().catch(() => { });
        playbackWorkletRef.current = null;
        playbackCtxRef.current = null;
        // Clear cached thread so next session starts fresh
        if (selectedId) {
            try { localStorage.removeItem(`voice-thread-${selectedId}`); } catch { /* ignore */ }
        }
    }, [selectedId, stopCapture, setVoiceActive, setVoiceStatus]);

    /* ---- socket event listeners ---- */
    useEffect(() => {
        const socket = getSocket();

        const handleReady = () => {
            setVoiceStatus("idle");
        };

        const handleTranscript = (payload: { text: string }) => {
            if (!payload.text.trim()) return;
            setMessages((prev) => {
                // Append to the latest user message (accumulate transcript chunks)
                const last = prev[prev.length - 1];
                if (last && last.role === "user") {
                    return [...prev.slice(0, -1), { ...last, text: last.text + payload.text }];
                }
                return [...prev, { id: `user-${Date.now()}`, role: "user", text: payload.text }];
            });
        };

        const handleOutputTranscript = (payload: { text: string }) => {
            if (!payload.text.trim()) return;
            // Strip any "ANSWER:" prefix the model might add
            const cleaned = payload.text.replace(/^ANSWER:\s*/i, "");
            if (!cleaned.trim()) return;
            setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "ai") {
                    return [...prev.slice(0, -1), { ...last, text: last.text + cleaned }];
                }
                return [...prev, { id: `ai-${Date.now()}`, role: "ai", text: cleaned }];
            });
        };

        const handleAudio = (payload: { data: string; mimeType: string }) => {
            if (!payload.data) return;
            setVoiceStatus("speaking");
            if (isMuted) return;
            try {
                const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
                const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
                void pushPlaybackPcm(pcm);
            } catch (err) {
                console.warn("[voice] playback decode error", err);
            }
        };

        const handleFinal = () => {
            setVoiceStatus(isVoiceActive ? "listening" : "idle");
        };

        const handleInterrupted = () => {
            playbackWorkletRef.current?.port.postMessage({ type: "clear" });
            setVoiceStatus("listening");
        };

        const handleAnswer = (payload: {
            text: string;
            citations?: Array<{ fileName: string; page: number | null; chunkId: string }>;
            confidence?: "High" | "Medium" | "Low";
            evidence?: string[];
            found?: boolean;
        }) => {
            if (!payload.text) return;
            setMessages((prev) => [
                ...prev,
                {
                    id: `crag-${Date.now()}`,
                    role: "ai",
                    text: payload.text,
                    citations: payload.citations,
                    confidence: payload.confidence,
                    evidence: payload.evidence,
                    found: payload.found
                }
            ]);
        };

        const handleStatus = (payload: { stage?: string; detail?: string }) => {
            const detail = payload.detail ?? payload.stage ?? null;
            setVoiceStage(detail);
            if (payload.stage === "speaking") {
                setVoiceStatus("speaking");
            } else if (payload.stage === "listening") {
                setVoiceStatus("listening");
            } else if (payload.stage) {
                setVoiceStatus("processing");
            }
        };

        const handleError = (payload: { error: string }) => {
            console.error("[voice] error from server:", payload.error);
            setVoiceStatus("idle");
            setVoiceStage(null);
            setMessages((prev) => [
                ...prev,
                { id: `err-${Date.now()}`, role: "ai", text: `⚠️ ${payload.error}` }
            ]);
        };

        const handleEnded = () => {
            setVoiceStatus("idle");
            setVoiceActive(false);
            sessionStartedRef.current = false;
        };

        socket.on("voice:ready", handleReady);
        socket.on("voice:transcript", handleTranscript);
        socket.on("voice:output-transcript", handleOutputTranscript);
        socket.on("voice:audio", handleAudio);
        socket.on("voice:final", handleFinal);
        socket.on("voice:interrupted", handleInterrupted);
        socket.on("voice:answer", handleAnswer);
        socket.on("voice:status", handleStatus);
        socket.on("voice:error", handleError);
        socket.on("voice:ended", handleEnded);

        return () => {
            socket.off("voice:ready", handleReady);
            socket.off("voice:transcript", handleTranscript);
            socket.off("voice:output-transcript", handleOutputTranscript);
            socket.off("voice:audio", handleAudio);
            socket.off("voice:final", handleFinal);
            socket.off("voice:interrupted", handleInterrupted);
            socket.off("voice:answer", handleAnswer);
            socket.off("voice:status", handleStatus);
            socket.off("voice:error", handleError);
            socket.off("voice:ended", handleEnded);
        };
    }, [isVoiceActive, isMuted, pushPlaybackPcm]);

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

                    {sessionStartedRef.current && (
                        <button
                            onClick={() => setIsMuted((prev) => !prev)}
                            className={cn(
                                "px-3 py-1.5 rounded-full border-2 font-bold text-xs uppercase tracking-tight flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
                                isMuted ? "border-slate-400 bg-slate-50 text-slate-600" : "border-emerald-400 bg-emerald-50 text-emerald-700"
                            )}
                        >
                            <Volume2 size={12} />
                            {isMuted ? "Muted" : "Audio On"}
                        </button>
                    )}

                    {sessionStartedRef.current && (
                        <button
                            onClick={endSession}
                            className="px-3 py-1.5 rounded-full border-2 border-red-400 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-tight flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(239,68,68,0.5)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                            <X size={12} />
                            End Session
                        </button>
                    )}
                </div>
            </div>

            {/* Conversation + Mic Area */}
            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                {/* Scrollable conversation history */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                    {voiceStage && (
                        <div className="text-[11px] uppercase tracking-widest text-slate-500 font-bold bg-white border-2 border-slate-200 px-3 py-1 rounded-full inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                            AI: {voiceStage}
                        </div>
                    )}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <Mic size={48} className="mb-4 opacity-30" />
                            <p className="font-bold text-sm uppercase tracking-widest">
                                Tap the mic to start talking
                            </p>
                        </div>
                    )}

                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex items-start gap-3",
                                    msg.role === "ai" && "flex-row-reverse"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
                                    msg.role === "user" ? "bg-white" : "bg-yellow-300"
                                )}>
                                    {msg.role === "user"
                                        ? <User size={16} className="text-slate-600" />
                                        : <GraduationCap size={16} className="text-slate-900" />}
                                </div>

                                <div className={cn(
                                    "border-2 border-slate-900 p-3 rounded-2xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] max-w-[75%]",
                                    msg.role === "user"
                                        ? "bg-white rounded-tl-none"
                                        : "bg-indigo-50 rounded-tr-none"
                                )}>
                                    <p className={cn(
                                        "text-sm leading-relaxed whitespace-pre-wrap",
                                        msg.role === "user" ? "italic text-slate-700" : "text-slate-900 font-medium"
                                    )}>
                                        {msg.role === "user" ? `"${msg.text}"` : msg.text}
                                    </p>

                                    {/* Confidence badge */}
                                    {msg.confidence && (
                                        <div className="mt-2">
                                            <ConfidenceBadge level={msg.confidence} />
                                        </div>
                                    )}

                                    {/* Citations */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">📎 Citations</div>
                                            <div className="flex flex-wrap gap-1">
                                                {msg.citations.map((c, i) => (
                                                    <span key={i} className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-mono text-blue-700">
                                                        <FileText size={9} />
                                                        {c.fileName} {c.page !== null && `p.${c.page}`}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evidence snippets */}
                                    {msg.evidence && msg.evidence.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-200">
                                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">📝 Evidence</div>
                                            <ul className="space-y-1">
                                                {msg.evidence.map((e, i) => (
                                                    <li key={i} className="text-[11px] text-slate-600 bg-slate-50/80 rounded px-2 py-1 border-l-2 border-slate-300 italic line-clamp-2">
                                                        &ldquo;{e}&rdquo;
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Mic button */}
                <div className="flex justify-center">
                    <div className="relative">
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
                                "w-20 h-20 rounded-full border-4 border-slate-900 flex items-center justify-center transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:translate-x-1 active:translate-y-1 active:shadow-none",
                                isVoiceActive ? "bg-red-400 text-white translate-x-1 translate-y-1 shadow-none" : "bg-white text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            {isVoiceActive ? <MicOff size={32} /> : <Mic size={32} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Info */}
            <div className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">
                AskMyNotes • Teacher Mode • Phase 1
            </div>
        </div>
    );
}
