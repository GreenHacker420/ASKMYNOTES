"use client";

import { motion } from "framer-motion";
import { FileText, User, Bot } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "./types";
import { ConfidenceBadge } from "./ConfidenceBadge";

interface ChatMessageProps {
    message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
        >
            {/* Avatar */}
            <div
                className={`flex-shrink-0 w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center ${isUser ? "bg-yellow-200" : "bg-blue-200"
                    }`}
            >
                {isUser ? <User size={14} /> : <Bot size={14} />}
            </div>

            {/* Message bubble */}
            <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
                <div
                    className={`inline-block rounded-lg border-2 p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.08)] ${isUser
                            ? "border-slate-300 bg-yellow-50 text-slate-800"
                            : "border-slate-300 bg-white text-slate-800"
                        }`}
                    style={{ filter: "url(#squiggle)" }}
                >
                    {/* Not Found response */}
                    {message.notFound && (
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-1">
                            <span>🚫</span> Not found in your notes
                        </div>
                    )}

                    {/* Answer text */}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Confidence badge */}
                    {message.confidence && (
                        <div className="mt-3">
                            <ConfidenceBadge level={message.confidence} />
                        </div>
                    )}

                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">📎 Citations</div>
                            <div className="flex flex-wrap gap-1.5">
                                {message.citations.map((c, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center gap-1 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-mono text-blue-700"
                                    >
                                        <FileText size={10} />
                                        {c.fileName} {c.page !== null && `p.${c.page}`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Evidence snippets */}
                    {message.evidence && message.evidence.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">📝 Evidence</div>
                            <ul className="space-y-1">
                                {message.evidence.map((e, i) => (
                                    <li key={i} className="text-xs text-slate-600 bg-slate-50 rounded px-2 py-1 border-l-2 border-slate-300 italic">
                                        &ldquo;{e}&rdquo;
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Timestamp */}
                <div className={`text-[10px] text-slate-400 mt-1 ${isUser ? "text-right" : ""}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
            </div>
        </motion.div>
    );
}
