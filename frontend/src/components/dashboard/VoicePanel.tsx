"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Sparkles, User, GraduationCap } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useStudyStore } from "@/src/store/useStudyStore";
import type { Subject } from "@/src/components/dashboard/types";
import { getSocket } from "@/src/lib/socket";

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
    const [transcript, setTranscript] = useState("");
    const [lastAiResponse, setLastAiResponse] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const greetedRef = useRef(false);
    const playbackQueueRef = useRef<Int16Array[]>([]);
    const isPlayingRef = useRef(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    const getSupportedMimeType = (): string => {
        const candidates = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/ogg;codecs=opus"
        ];
        for (const candidate of candidates) {
            if (MediaRecorder.isTypeSupported(candidate)) {
                return candidate;
            }
        }
        return "";
    };

    const stopRecording = () => {
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            recorder.stop();
        }
        setVoiceActive(false);
    };

    const toggleVoice = async () => {
        if (!selectedId) return;
        if (isVoiceActive) {
            stopRecording();
            setVoiceStatus("processing");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = getSupportedMimeType();
            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            setTranscript("");
            setLastAiResponse(null);

            recorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                    try {
                        const base64Pcm = await convertToPcm16(event.data, 16000);
                        getSocket().emit("voice:audio", {
                            data: base64Pcm,
                            mimeType: "audio/pcm;rate=16000"
                        });
                    } catch (err) {
                        console.warn("PCM chunk conversion failed", err);
                    }
                }
            };

            recorder.onstop = async () => {
                stream.getTracks().forEach((track) => track.stop());
                audioChunksRef.current = [];
                setVoiceStatus("processing");
                getSocket().emit("voice:stop");
            };

            recorder.start(250);
            setVoiceActive(true);
            setVoiceStatus("listening");
        } catch (error) {
            console.error("Voice capture failed:", error);
            setVoiceStatus("idle");
        }
    };

    useEffect(() => {
        if (!selectedId || greetedRef.current) return;
        greetedRef.current = true;
        const socket = getSocket();
        const threadId = selectedSubject?.threadId ?? `thread-${Date.now()}`;
        socket.emit("voice:start", {
            subjectId: selectedId,
            threadId,
            subjectName: selectedSubject?.name
        });
    }, [selectedId, selectedSubject]);

    useEffect(() => {
        const socket = getSocket();

        const handleReady = () => {
            setVoiceStatus("idle");
            setLastAiResponse("Session ready. Ask your question.");
        };

        const handleTranscript = (payload: { text: string }) => {
            setTranscript(payload.text);
        };

        const handleAudio = (payload: { data: string; mimeType: string }) => {
            const bytes = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
            const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
            playbackQueueRef.current.push(pcm);
            if (!isPlayingRef.current) {
                void playQueue();
            }
        };

        const handleFinal = () => {
            setVoiceStatus("idle");
        };

        socket.on("voice:ready", handleReady);
        socket.on("voice:transcript", handleTranscript);
        socket.on("voice:audio", handleAudio);
        socket.on("voice:final", handleFinal);

        return () => {
            socket.off("voice:ready", handleReady);
            socket.off("voice:transcript", handleTranscript);
            socket.off("voice:audio", handleAudio);
            socket.off("voice:final", handleFinal);
        };
    }, []);

    const playQueue = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }
        const context = audioContextRef.current;
        isPlayingRef.current = true;
        while (playbackQueueRef.current.length > 0) {
            const chunk = playbackQueueRef.current.shift();
            if (!chunk) continue;
            const buffer = context.createBuffer(1, chunk.length, 24000);
            const channel = buffer.getChannelData(0);
            for (let i = 0; i < chunk.length; i++) {
                channel[i] = chunk[i] / 32768;
            }
            const source = context.createBufferSource();
            source.buffer = buffer;
            source.connect(context.destination);
            source.start();
            await new Promise((resolve) => {
                source.onended = resolve;
            });
        }
        isPlayingRef.current = false;
    };

    const convertToPcm16 = async (blob: Blob, targetSampleRate: number): Promise<string> => {
        const arrayBuffer = await blob.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

        const numChannels = 1;
        const offlineContext = new OfflineAudioContext(numChannels, Math.ceil(audioBuffer.duration * targetSampleRate), targetSampleRate);
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);

        const rendered = await offlineContext.startRendering();
        const channelData = rendered.getChannelData(0);
        const pcmBuffer = new ArrayBuffer(channelData.length * 2);
        const view = new DataView(pcmBuffer);
        let offset = 0;
        for (let i = 0; i < channelData.length; i++) {
            let sample = Math.max(-1, Math.min(1, channelData[i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(offset, sample, true);
            offset += 2;
        }

        await audioContext.close();
        const bytes = new Uint8Array(pcmBuffer);
        let binary = "";
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary);
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
