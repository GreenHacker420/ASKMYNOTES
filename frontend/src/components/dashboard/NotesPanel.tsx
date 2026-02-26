"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Trash2, FileType, AlertCircle } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Subject, UploadedFile } from "./types";

interface NotesPanelProps {
    subject: Subject;
    onUploadFiles: (subjectId: string, files: UploadedFile[]) => void;
    onDeleteFile: (subjectId: string, fileId: string) => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function NotesPanel({ subject, onUploadFiles, onDeleteFile }: NotesPanelProps) {
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
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                    📎 Notes for {subject.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                    {subject.files.length} file{subject.files.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                    "relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-all mb-4",
                    dragOver
                        ? "border-blue-400 bg-blue-50 scale-[1.02]"
                        : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
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
                    animate={dragOver ? { scale: 1.1 } : { scale: 1 }}
                    className="flex flex-col items-center gap-2"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
                        <Upload size={20} className={dragOver ? "text-blue-500" : "text-slate-400"} />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                        {dragOver ? "Drop your files here!" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-xs text-slate-400">
                        PDF and TXT files only • Multiple files supported
                    </p>
                </motion.div>
            </div>

            {/* Error */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 rounded border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 mb-4"
                    >
                        <AlertCircle size={14} />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* File list */}
            <div className="flex-1 overflow-y-auto space-y-2">
                <AnimatePresence>
                    {subject.files.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-8 text-slate-400"
                        >
                            <FileText size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No files uploaded yet</p>
                            <p className="text-xs">Upload your study notes to get started</p>
                        </motion.div>
                    ) : (
                        subject.files.map((file) => (
                            <motion.div
                                key={file.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20, height: 0 }}
                                className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-white px-4 py-3 group hover:border-slate-400 transition-colors"
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded flex items-center justify-center border",
                                    file.type === "pdf"
                                        ? "bg-red-50 border-red-200 text-red-500"
                                        : "bg-blue-50 border-blue-200 text-blue-500"
                                )}>
                                    <FileType size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{formatSize(file.size)} • {file.type.toUpperCase()}</p>
                                </div>
                                <button
                                    onClick={() => onDeleteFile(subject.id, file.id)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
