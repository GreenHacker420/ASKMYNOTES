"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, FileType, AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Subject, UploadedFile } from "./types";

interface NotesPanelProps {
    subject: Subject;
    onUploadFiles: (subjectId: string, files: UploadedFile[]) => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function NotesPanel({ subject, onUploadFiles }: NotesPanelProps) {
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList) return;
            setError("");

            const accepted: UploadedFile[] = [];
            const rejected: string[] = [];

            Array.from(fileList).forEach((file) => {
                const ext = file.name.split(".").pop()?.toLowerCase();
                if (ext === "pdf" || ext === "txt") {
                    accepted.push({
                        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        name: file.name,
                        size: file.size,
                        type: ext as "pdf" | "txt",
                        uploadedAt: new Date(),
                        file: file,
                        ingestionStatus: "extracting"
                    });
                } else {
                    rejected.push(file.name);
                }
            });

            if (rejected.length > 0) {
                setError(`Unsupported: ${rejected.join(", ")}. Only PDF & TXT allowed.`);
            }

            if (accepted.length > 0) {
                onUploadFiles(subject.id, accepted);
            }
        },
        [subject.id, onUploadFiles]
    );

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        processFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    return (
        <div className="flex flex-col h-full relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b-2 border-slate-900 pb-4 relative">
                {/* Decorative Squiggle Underline */}
                <div className="absolute -bottom-1 left-0 right-0 h-2 bg-yellow-300 -z-10" style={{ filter: "url(#squiggle)" }} />

                <h3 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
                    <span className="text-3xl">📎</span> Notes for {subject.name}
                </h3>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-slate-900 bg-yellow-100 px-3 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" style={{ filter: "url(#squiggle)" }}>
                        {subject.files.length} file{subject.files.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col min-h-0">
                {/* Drop zone */}
                <div className="relative mb-8 group shrink-0">
                    {/* Background Shadow */}
                    <div className="absolute inset-0 bg-slate-900 rounded-xl translate-x-2 translate-y-2 blur-[2px] opacity-10" />

                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={() => setDragOver(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "relative z-10 rounded-xl border-dashed p-10 text-center cursor-pointer transition-all border-[3px]",
                            dragOver
                                ? "border-blue-500 bg-blue-50 scale-[1.02] shadow-[8px_8px_0px_0px_rgba(59,130,246,0.3)]"
                                : "border-slate-300 bg-white hover:border-slate-800 hover:bg-yellow-50 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                        )}
                        style={{ filter: "url(#squiggle)" }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                processFiles(e.target.files);
                                e.target.value = "";
                            }}
                        />

                        <motion.div
                            animate={dragOver ? { y: -5, scale: 1.1 } : { y: 0, scale: 1 }}
                            className="flex flex-col items-center gap-3"
                        >
                            <motion.div
                                animate={{ rotate: dragOver ? [-10, 10, -10] : 0 }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className={cn(
                                    "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm",
                                    dragOver ? "border-blue-500 bg-blue-100" : "border-slate-900 bg-yellow-200"
                                )}
                            >
                                <Upload size={28} className={dragOver ? "text-blue-600" : "text-slate-900"} />
                            </motion.div>
                            <div>
                                <p className="text-lg font-black text-slate-800 tracking-tight">
                                    {dragOver ? "Drop 'em right here!" : "Drag & drop or click to upload"}
                                </p>
                                <p className="text-sm font-medium text-slate-500 mt-1 font-mono">
                                    PDF and TXT files only • Multiple files supported
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="flex items-center gap-3 rounded-lg border-2 border-slate-900 bg-red-200 p-4 text-sm font-bold text-red-900 mb-6 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                            style={{ filter: "url(#squiggle)" }}
                        >
                            <AlertCircle size={20} className="shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* File list */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <AnimatePresence mode="popLayout">
                        {subject.files.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50"
                            >
                                <motion.div
                                    animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="mb-4 text-6xl opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer"
                                >
                                    📄
                                </motion.div>
                                <h4 className="text-xl font-black text-slate-700 tracking-tight mb-2">It's a little empty here...</h4>
                                <p className="text-slate-500 font-medium max-w-sm">
                                    Toss some study material in the dropzone above to get start generating smart answers and quizzes.
                                </p>

                                {/* Hand-drawn arrow decoration */}
                                <div className="absolute top-1/2 left-10 md:left-24 opacity-20 hidden lg:block pointer-events-none">
                                    <svg width="80" height="120" viewBox="0 0 100 150" fill="none">
                                        <path d="M90 140 Q 10 120, 20 20 T 50 10" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray="8 8" />
                                        <path d="M35 25 L50 10 L65 25" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-3">
                                {subject.files.map((file, i) => (
                                    <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, x: -20, y: 10 }}
                                        animate={{ opacity: 1, x: 0, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border-2 border-slate-900 bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
                                    >
                                        <div className={cn(
                                            "w-12 h-12 rounded-lg flex items-center justify-center border-2 border-slate-900 shadow-sm shrink-0",
                                            file.type === "pdf"
                                                ? "bg-rose-100 text-rose-600"
                                                : "bg-sky-100 text-sky-600"
                                        )}>
                                            <FileType size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-bold text-slate-900 truncate tracking-tight">{file.name}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono">
                                                    {file.type.toUpperCase()}
                                                </span>
                                                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                                                    {formatSize(file.size)}
                                                </span>
                                                {file.ingestionStatus && file.ingestionStatus !== "done" && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 animate-pulse border border-blue-200 uppercase whitespace-nowrap">
                                                        {file.ingestionStatus}...
                                                    </span>
                                                )}
                                                {file.ingestionStatus === "done" && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase whitespace-nowrap">
                                                        Indexed ✓
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
