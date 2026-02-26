"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import type { Subject, ChatMessage as ChatMessageType } from "./types";
import { ChatMessage } from "./ChatMessage";

interface ChatPanelProps {
    subject: Subject;
    onSendMessage: (subjectId: string, message: string) => void;
    isLoading: boolean;
}

export function ChatPanel({ subject, onSendMessage, isLoading }: ChatPanelProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [subject.chatMessages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(subject.id, input.trim());
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                    💬 Chat with {subject.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                    {subject.chatMessages.length} messages
                </span>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto rounded-lg border-2 border-slate-200 bg-white p-4 mb-4 space-y-4 min-h-[300px]">
                {subject.chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="text-4xl mb-3"
                        >
                            💭
                        </motion.div>
                        <p className="text-sm font-bold text-slate-600">Ask anything about {subject.name}</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-xs">
                            Your questions will be answered strictly using your uploaded notes, with citations and evidence.
                        </p>
                    </div>
                ) : (
                    subject.chatMessages.map((msg) => (
                        <ChatMessage key={msg.id} message={msg} />
                    ))
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-slate-500"
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-blue-200 flex items-center justify-center">
                            <Loader2 size={14} className="animate-spin" />
                        </div>
                        <div className="rounded-lg border-2 border-slate-200 bg-slate-50 px-4 py-2">
                            <div className="flex gap-1">
                                <motion.span
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                    className="w-2 h-2 bg-slate-400 rounded-full"
                                />
                                <motion.span
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                    className="w-2 h-2 bg-slate-400 rounded-full"
                                />
                                <motion.span
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                                    className="w-2 h-2 bg-slate-400 rounded-full"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative rounded-lg border-2 border-slate-900 bg-white overflow-hidden shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]" style={{ filter: "url(#squiggle)" }}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            subject.files.length === 0
                                ? "Upload notes first before asking questions..."
                                : `Ask a question about ${subject.name}...`
                        }
                        disabled={subject.files.length === 0 || isLoading}
                        rows={2}
                        className="w-full resize-none px-4 py-3 pr-14 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading || subject.files.length === 0}
                        className="absolute right-2 bottom-2 w-9 h-9 rounded-md border-2 border-slate-900 bg-yellow-300 flex items-center justify-center hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={14} className="text-slate-900" />
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                    Press Enter to send • Shift+Enter for new line
                </p>
            </form>
        </div>
    );
}
