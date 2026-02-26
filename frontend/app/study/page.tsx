"use client";

import React, { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, FileText, MessageSquare, Brain, BookOpen, Mic, AlertCircle, X } from "lucide-react";
import { SquiggleFilter } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SquiggleFilter";
import { GraphPaper } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/GraphPaper";
import { SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SketchButton";
import { Sidebar } from "@/src/components/dashboard/Sidebar";
import { CreateSubjectModal } from "@/src/components/dashboard/CreateSubjectModal";
import { NotesPanel } from "@/src/components/dashboard/NotesPanel";
import { ChatPanel } from "@/src/components/dashboard/ChatPanel";
import { StudyModePanel } from "@/src/components/dashboard/StudyModePanel";
import { VoicePanel } from "@/src/components/dashboard/VoicePanel";
import { cn } from "@/src/lib/utils";
import type {
  Subject,
  DashboardTab,
  UploadedFile,
  ChatMessage,
  StudyQuiz,
  MCQ,
  ShortAnswer,
} from "@/src/components/dashboard/types";
import { SUBJECT_COLORS } from "@/src/components/dashboard/types";
import {
  askNotesAction,
  getSubjectsAction,
  createSubjectAction,
  uploadFileAction,
  getSubjectFilesAction,
  generateQuizAction,
  type AskResponsePayload
} from "@/src/lib/actions";
import { getSocket } from "@/src/lib/socket";
import { authClient } from "@/src/lib/auth-client";
import { AskMyNotesLogo } from "@/src/components/AskMyNotesLogo";

// ── Helpers ──
function createId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface QueryForm {
  question: string;
  subjectId: string;
  subjectName: string;
  threadId: string;
}

function createThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Mock response generators (used for fallback or design) ──

function generateMockQuiz(subjectName: string): StudyQuiz {
  const mcqs: MCQ[] = [
    {
      id: createId(),
      question: `In ${subjectName}, what is the primary principle that governs the relationship between input and output variables?`,
      options: [
        "Direct proportionality",
        "Inverse square relationship",
        "Logarithmic scaling",
        "Exponential growth",
      ],
      correctIndex: 0,
      explanation: `As discussed in Chapter 2 of your ${subjectName} notes, the primary relationship between input and output variables follows a direct proportionality pattern, meaning doubling the input doubles the output.`,
      citation: "notes_ch2.pdf — Section 2.3, p.28",
    },
    {
      id: createId(),
      question: `Which of the following best describes the concept of equilibrium in ${subjectName}?`,
      options: [
        "A state where all forces are maximized",
        "A state where net change is zero",
        "A state requiring external energy input",
        "A state of constant acceleration",
      ],
      correctIndex: 1,
      explanation: "Equilibrium is defined as the condition where the net change in the system is zero. This means all opposing factors balance each other perfectly.",
      citation: "lecture_summary.txt — Topic 4",
    },
    {
      id: createId(),
      question: `The fundamental theorem introduced in Chapter 3 of ${subjectName} states that:`,
      options: [
        "Every bounded sequence has a convergent subsequence",
        "The total energy in an isolated system remains constant",
        "The relationship can be expressed as a linear function",
        "The rate of change is always proportional to the current value",
      ],
      correctIndex: 1,
      explanation: "The fundamental theorem establishes that within an isolated system, the total quantity is conserved — it can be transformed but never created or destroyed.",
      citation: "notes_ch3.pdf — Theorem 3.1, p.35",
    },
    {
      id: createId(),
      question: `What is the significance of the boundary conditions discussed in your ${subjectName} notes?`,
      options: [
        "They only apply to theoretical models",
        "They determine the unique solution to the problem",
        "They can be safely ignored in most cases",
        "They only affect the initial state",
      ],
      correctIndex: 1,
      explanation: "Boundary conditions are essential because they constrain the solution space. Without them, a problem may have infinitely many solutions.",
      citation: "notes_ch4.pdf — Section 4.2, p.51",
    },
    {
      id: createId(),
      question: `According to your notes, which method is most effective for solving complex ${subjectName} problems?`,
      options: [
        "Trial and error",
        "Breaking the problem into smaller sub-problems",
        "Applying a single universal formula",
        "Memorizing all possible outcomes",
      ],
      correctIndex: 1,
      explanation: "Your notes emphasize the divide-and-conquer approach: complex problems become manageable when broken into smaller, well-defined sub-problems that can be solved individually.",
      citation: "lecture_summary.txt — Problem Solving Strategies",
    },
  ];

  const shortAnswers: ShortAnswer[] = [
    {
      id: createId(),
      question: `Explain the core theorem from Chapter 3 of ${subjectName} in your own words and provide one real-world application.`,
      modelAnswer: `The core theorem states that in any closed system, the fundamental quantity is conserved through all transformations. This means that while the form may change, the total amount remains constant. A real-world application is energy conservation in mechanical systems — potential energy converts to kinetic energy and back, but the total energy stays the same (in the absence of friction).`,
      citation: "notes_ch3.pdf — Theorem 3.1, p.35-37",
    },
    {
      id: createId(),
      question: `Compare and contrast the two approaches to problem-solving discussed in your ${subjectName} notes.`,
      modelAnswer: `The analytical approach involves deriving exact solutions using mathematical formulas and theorems. It provides precise answers but may be difficult for complex systems. The numerical approach uses approximation methods and iterative calculations to find solutions. It handles complexity better but introduces small errors. Your notes recommend using analytical methods when possible and numerical methods as a fallback.`,
      citation: "lecture_summary.txt — Section: Methods Comparison",
    },
    {
      id: createId(),
      question: `What are the three key assumptions made in the simplified model presented in Chapter 4 of ${subjectName}?`,
      modelAnswer: `The three key assumptions are: (1) The system operates under ideal conditions without external interference, (2) All variables change continuously and smoothly without sudden jumps, and (3) The interactions between components follow a linear relationship within the observed range. These assumptions simplify the analysis but may limit accuracy for real-world edge cases.`,
      citation: "notes_ch4.pdf — Section 4.1, p.48-49",
    },
  ];

  return {
    mcqs,
    shortAnswers,
    generatedAt: new Date(),
  };
}

import { useStudyStore } from "@/src/store/useStudyStore";
import { useAuth } from "@/src/contexts/AuthContext";

// ── Tab Configuration ──

const TABS: { key: DashboardTab; label: string; icon: React.ElementType }[] = [
  { key: "notes", label: "Notes", icon: FileText },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "voice", label: "Voice", icon: Mic },
  { key: "study", label: "Study Mode", icon: Brain },
];

// ── Dashboard Page ──

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, refetchSession } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Global Store State
  const {
    subjects,
    selectedId,
    activeTab,
    showCreateModal,
    isChatLoading,
    isQuizGenerating,
    sidebarOpen,
    setSelectedId,
    setActiveTab,
    setShowCreateModal,
    setIsChatLoading,
    setIsQuizGenerating,
    setSidebarOpen,
    addSubject,
    setSubjects,
    uploadFiles,
    updateFileStatus,
    addChatMessage,
    updateChatMessage,
    setStudyQuiz
  } = useStudyStore();

  const selectedSubject = subjects.find((s: Subject) => s.id === selectedId) ?? null;

  // ── Initialization ──
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  React.useEffect(() => {
    async function fetchSubjects() {
      const res = await getSubjectsAction();
      if (res.ok && res.data) {
        const backendSubjects = res.data.subjects;
        const mappedSubjects: Subject[] = backendSubjects.map((bs, index) => ({
          id: bs.id,
          name: bs.name,
          color: SUBJECT_COLORS[index % SUBJECT_COLORS.length]?.accent ?? "#3b82f6",
          emoji: SUBJECT_COLORS[index % SUBJECT_COLORS.length]?.emoji ?? "📘",
          files: [],
          chatMessages: [],
          studyQuiz: null,
          threadId: createThreadId(), // We generate a local thread ID for this session
        }));
        setSubjects(mappedSubjects);
      }
    }
    fetchSubjects();
  }, [setSubjects]);

  // Fetch files when a subject is selected
  React.useEffect(() => {
    if (!selectedId) return;

    // Check if we've already loaded files (simple optimization)
    const currentSubject = subjects.find((s: Subject) => s.id === selectedId);
    if (currentSubject && currentSubject.files.length > 0) return;

    async function fetchFiles() {
      const res = await getSubjectFilesAction(selectedId as string);
      if (res.ok && res.data) {
        const backendFiles = res.data.files;
        const mappedFiles: UploadedFile[] = backendFiles.map((f) => {
          const isPdf = f.fileName.toLowerCase().endsWith(".pdf");
          return {
            id: `${selectedId}-${f.fileName}`,
            name: f.fileName,
            size: 0,
            type: (isPdf ? "pdf" : "txt") as "pdf" | "txt",
            uploadedAt: f.lastIngestedAt ? new Date(f.lastIngestedAt) : new Date(),
            ingestionStatus: "done"
          };
        });
        setSubjects((prev: Subject[]) =>
          prev.map((s: Subject) => (s.id === selectedId ? { ...s, files: mappedFiles } : s))
        );
      }
    }
    fetchFiles();
  }, [selectedId, setSubjects]);

  // Socket.io streaming for chat
  React.useEffect(() => {
    const socket = getSocket();

    const handleChunk = (payload: { requestId?: string; delta: string }) => {
      if (!payload.requestId) return;
      const state = useStudyStore.getState();
      const pending = state.subjects
        .flatMap((s: Subject) => s.chatMessages.map((m: ChatMessage) => ({ subjectId: s.id, message: m })))
        .find((entry: { subjectId: string; message: ChatMessage }) => entry.message.id === payload.requestId);
      if (!pending) return;

      const nextContent = `${pending.message.content ?? ""}${payload.delta}`;
      updateChatMessage(pending.subjectId, pending.message.id, { content: nextContent });
    };

    const handleFinal = (payload: { requestId?: string; response: AskResponsePayload }) => {
      if (!payload.requestId) return;
      const state = useStudyStore.getState();
      const pending = state.subjects
        .flatMap((s: Subject) => s.chatMessages.map((m: ChatMessage) => ({ subjectId: s.id, message: m })))
        .find((entry: { subjectId: string; message: ChatMessage }) => entry.message.id === payload.requestId);
      if (!pending) return;

      updateChatMessage(pending.subjectId, pending.message.id, {
        content: payload.response.answer,
        confidence: payload.response.confidence,
        citations: payload.response.citations,
        evidence: payload.response.evidence,
        notFound: !payload.response.found
      });
      setIsChatLoading(false);
    };

    const handleError = (payload: { requestId?: string; error: string }) => {
      if (!payload.requestId) return;
      const state = useStudyStore.getState();
      const pending = state.subjects
        .flatMap((s: Subject) => s.chatMessages.map((m: ChatMessage) => ({ subjectId: s.id, message: m })))
        .find((entry: { subjectId: string; message: ChatMessage }) => entry.message.id === payload.requestId);
      if (!pending) return;

      updateChatMessage(pending.subjectId, pending.message.id, {
        content: `I'm sorry, I encountered an error: ${payload.error}`,
        notFound: true
      });
      setIsChatLoading(false);
    };

    const handleIngestionProgress = (payload: { subjectId: string; fileName: string; step: UploadedFile["ingestionStatus"] }) => {
      const { updateFileStatus } = useStudyStore.getState();
      updateFileStatus(payload.subjectId, payload.fileName, payload.step);
    };

    socket.on("ask:chunk", handleChunk);
    socket.on("ask:final", handleFinal);
    socket.on("ask:error", handleError);
    socket.on("ingestion:progress", handleIngestionProgress);

    return () => {
      socket.off("ask:chunk", handleChunk);
      socket.off("ask:final", handleFinal);
      socket.off("ask:error", handleError);
      socket.off("ingestion:progress", handleIngestionProgress);
    };
  }, [updateChatMessage, setIsChatLoading]);

  // ── Actions ──

  const handleCreateSubject = useCallback(async (name: string) => {
    const res = await createSubjectAction({ name });
    if (res.ok && res.data) {
      const bs = res.data.subject;
      const colorIndex = subjects.length;
      const newSubject: Subject = {
        id: bs.id,
        name: bs.name,
        color: SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length]?.accent ?? "#3b82f6",
        emoji: SUBJECT_COLORS[colorIndex % SUBJECT_COLORS.length]?.emoji ?? "📘",
        files: [],
        chatMessages: [],
        studyQuiz: null,
        threadId: createThreadId(),
      };
      addSubject(newSubject);
    } else {
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      alert(`Failed to create subject: ${res.error}`);
    }
  }, [subjects.length, addSubject, router]);

  const handleUploadFiles = useCallback(async (subjectId: string, droppingFiles: UploadedFile[]) => {
    // 1. Immediately add files to store with progress status
    const initialFiles = droppingFiles.map(f => ({
      ...f,
      ingestionStatus: "uploading" as const
    }));
    uploadFiles(subjectId, initialFiles);

    const currentSubject = subjects.find((s: Subject) => s.id === subjectId);

    for (const dropFile of droppingFiles) {
      if (!dropFile.file) continue;

      // 10MB limit (10 * 1024 * 1024 bytes)
      if (dropFile.file.size > 10 * 1024 * 1024) {
        setToast({ message: "You can only upload till 10 mb.", type: "error" });
        // Update status to error locally
        updateFileStatus(subjectId, dropFile.name, "error");
        continue;
      }

      try {
        const res = await uploadFileAction({
          subjectId,
          subjectName: currentSubject?.name,
          file: dropFile.file
        });

        if (res.ok) {
          updateFileStatus(subjectId, dropFile.name, "done");
        } else {
          console.error("Failed to upload file:", dropFile.name, res.error);
          setToast({ message: `Failed to upload ${dropFile.name}: ${res.error ?? "Unknown error"}`, type: "error" });
          updateFileStatus(subjectId, dropFile.name, "error");
        }
      } catch (err) {
        console.error("Failed to upload file:", dropFile.name, err);
        setToast({ message: `Failed to upload ${dropFile.name}`, type: "error" });
        updateFileStatus(subjectId, dropFile.name, "error");
      }
    }
  }, [subjects, uploadFiles, updateFileStatus]);

  const handleSendMessage = useCallback(async (subjectId: string, message: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: createId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    addChatMessage(subjectId, userMsg);

    // Call real API
    setIsChatLoading(true);
    const currentSubject = subjects.find((s: Subject) => s.id === subjectId);
    const requestId = createId();

    try {
      const socket = getSocket();
      if (socket.connected) {
        const aiMsg: ChatMessage = {
          id: requestId,
          role: "assistant",
          content: "",
          timestamp: new Date()
        };
        addChatMessage(subjectId, aiMsg);
        socket.emit("ask", {
          requestId,
          question: message,
          subjectId,
          subjectName: currentSubject?.name,
          threadId: currentSubject?.threadId || createThreadId(),
        });
      } else {
        const res = await askNotesAction({
          question: message,
          subjectId,
          subjectName: currentSubject?.name,
          threadId: currentSubject?.threadId || createThreadId(),
        });

        if (res.ok && res.data) {
          const payload = res.data;
          const aiMsg: ChatMessage = {
            id: createId(),
            role: "assistant",
            content: payload.answer,
            timestamp: new Date(),
            confidence: payload.confidence,
            citations: payload.citations,
            evidence: payload.evidence,
            notFound: !payload.found,
          };
          addChatMessage(subjectId, aiMsg);
        } else {
          const errorMsg: ChatMessage = {
            id: createId(),
            role: "assistant",
            content: `I'm sorry, I encountered an error: ${res.error}`,
            timestamp: new Date(),
            notFound: true,
          };
          addChatMessage(subjectId, errorMsg);
        }
        setIsChatLoading(false);
      }
    } catch (err) {
      console.error("Chat error:", err);
      addChatMessage(subjectId, {
        id: createId(),
        role: "assistant",
        content: "A network error occurred while trying to reach the backend.",
        timestamp: new Date(),
        notFound: true,
      });
      setIsChatLoading(false);
    }
  }, [subjects, addChatMessage, setIsChatLoading]);

  const handleGenerateQuiz = useCallback(async (subjectId: string) => {
    setIsQuizGenerating(true);
    try {
      const res = await generateQuizAction(subjectId);
      if (res.ok && res.data) {
        setStudyQuiz(subjectId, {
          ...res.data.quiz,
          generatedAt: new Date()
        });
      } else {
        alert(`Failed to generate quiz: ${res.error}`);
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      alert("An unexpected error occurred while generating the quiz.");
    } finally {
      setIsQuizGenerating(false);
    }
  }, [setStudyQuiz, setIsQuizGenerating]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fdfbf7]">
        <div className="text-xl font-bold animate-pulse text-slate-800">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <main className="relative h-screen w-full text-slate-800 overflow-hidden font-sans selection:bg-yellow-300 selection:text-black flex flex-col">
      <SquiggleFilter />
      <GraphPaper />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-6 py-5 bg-white border-b-2 border-slate-900 shadow-sm relative">
        {/* Wavy bottom decoration overlay */}
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-300" style={{ filter: "url(#squiggle)" }} />

        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-black tracking-tighter hover:scale-105 transition-transform group"
        >
          <div className="group-hover:-rotate-6 transition-transform">
            <AskMyNotesLogo />
          </div>
          <span className="group-hover:text-yellow-500 transition-colors">AskMyNotes.</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden md:flex items-center gap-2 px-3 py-1 rounded border-2 border-slate-900 bg-yellow-50 text-xs font-bold text-slate-800 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" style={{ filter: "url(#squiggle)" }}>
            <span>{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</span>
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <span>{subjects.reduce((sum: number, s: Subject) => sum + s.files.length, 0)} files</span>
          </span>
          <div onClick={async () => {
            try {
              await authClient.signOut();
              await refetchSession();
              router.replace("/");
              router.refresh();
            } catch (err) {
              console.error("Failed to sign out:", err);
              router.replace("/");
              router.refresh();
            }
          }}>
            <SketchButton className="px-3 py-1.5 text-xs text-slate-700 bg-white">
              <LogOut size={14} /> Exit
            </SketchButton>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Sidebar container */}
        <motion.div
          animate={{ width: sidebarOpen ? 280 : 0 }}
          className="flex-shrink-0 bg-[#fdfbf7] relative z-20 border-r-2 border-slate-900 overflow-hidden shadow-[4px_0px_0px_0px_rgba(15,23,42,0.05)]"
        >
          <Sidebar
            subjects={subjects}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (!sidebarOpen) setSidebarOpen(true);
            }}
            onCreateClick={() => setShowCreateModal(true)}
          />
        </motion.div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-6 h-14 bg-white border-2 border-slate-900 border-l-0 rounded-r-xl flex items-center justify-center text-slate-900 hover:text-white hover:bg-slate-900 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]"
          style={{ left: sidebarOpen ? 278 : 0 }}
          title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          <span className="text-lg font-black">{sidebarOpen ? "‹" : "›"}</span>
        </button>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* No subject selected */}
          {!selectedSubject && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
              {/* Hand-drawn subtle decorations */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Spining dashed circles */}
                <svg className="w-[500px] h-[500px] text-yellow-400 animate-[spin_60s_linear_infinite] absolute z-0 opacity-40" viewBox="0 0 200 200" fill="none">
                  <path d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0" stroke="currentColor" strokeWidth="2" strokeDasharray="10 15" />
                  <path d="M 100, 100 m -50, 0 a 50,50 0 1,0 100,0 a 50,50 0 1,0 -100,0" stroke="currentColor" strokeWidth="2" strokeDasharray="5 10" opacity="0.5" />
                </svg>

                {/* Floating Study Doodles */}
                <motion.div animate={{ y: [0, -15, 0], rotate: [-5, 5, -5] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[15%] left-[10%] text-blue-500 opacity-80 drop-shadow-sm">
                  <svg width="65" height="65" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
                </motion.div>
                <motion.div animate={{ y: [0, 10, 0], rotate: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[20%] right-[12%] text-emerald-500 opacity-80 drop-shadow-sm">
                  <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                </motion.div>
                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [10, -10, 10] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[25%] right-[20%] text-rose-500 opacity-80 drop-shadow-sm">
                  <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><path d="m9 9 12-2" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                </motion.div>
                <motion.div animate={{ x: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[30%] left-[15%] text-purple-500 opacity-80 drop-shadow-sm">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4" /><path d="m6 8-4 4 4 4" /><path d="m14.5 4-5 16" /></svg>
                </motion.div>
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative bg-white border-2 border-slate-900 p-8 md:p-12 rounded-2xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-lg w-full text-center z-10"
                style={{ filter: "url(#squiggle)" }}
              >
                {/* Decorative Pin/Tape */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-rose-200 border-2 border-slate-900 -rotate-3" />

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto w-28 h-28 bg-yellow-100 rounded-full border-2 border-slate-900 flex items-center justify-center mb-6 shadow-inner"
                >
                  <BookOpen className="w-14 h-14 text-yellow-600" />
                </motion.div>

                <h2 className="text-3xl font-black tracking-tighter text-slate-900 mb-4">
                  {subjects.length === 0 ? "Let's Get Started! ✨" : "Select a Subject"}
                </h2>

                <p className="text-slate-500 font-medium mb-10 leading-relaxed text-lg">
                  {subjects.length === 0
                    ? "Your digital notebook is empty. Create your first subject to start uploading notes and getting magical answers."
                    : "Pick a subject from the sidebar to view your notes, chat with AI, and ace your exams."}
                </p>

                {subjects.length === 0 && (
                  <div className="relative inline-block w-full sm:w-auto">
                    {/* Hand-drawn arrow pointing to button */}
                    <div className="absolute -left-20 -top-8 text-indigo-500 hidden sm:block">
                      <svg width="70" height="70" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 20 Q 50 10, 80 50 T 90 80" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
                        <path d="M75 75 L90 80 L95 65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    </div>

                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-slate-900 transition-all w-full text-lg cursor-pointer max-w-sm mx-auto"
                    >
                      {/* Button Background */}
                      <span className="absolute inset-0 rounded-xl border-2 border-slate-900 bg-yellow-300 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
                      {/* Button Shadow */}
                      <span className="absolute inset-0 -z-10 translate-x-2.5 translate-y-2.5 rounded-xl border-2 border-slate-900 bg-slate-900" />

                      {/* Button Content */}
                      <span className="relative flex items-center gap-3">
                        <BookOpen size={24} className="transition-transform group-hover:-rotate-12" />
                        Create Your First Subject
                      </span>
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}

          {/* Subject selected — show tabs + content */}
          {selectedSubject && (
            <>
              {/* Tab bar */}
              <div className="flex items-center gap-1 px-4 pt-3 bg-[#fdfbf7]/80 backdrop-blur-sm border-b border-slate-200">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-t-md border-2 border-b-0 transition-all",
                        isActive
                          ? "border-slate-300 bg-white text-slate-900 -mb-px z-10"
                          : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-white/40"
                      )}
                    >
                      <Icon size={14} />
                      {tab.label}
                      {/* Badge for notes count */}
                      {tab.key === "notes" && selectedSubject.files.length > 0 && (
                        <span className="ml-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {selectedSubject.files.length}
                        </span>
                      )}
                      {tab.key === "chat" && selectedSubject.chatMessages.length > 0 && (
                        <span className="ml-1 w-4 h-4 rounded-full bg-green-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {selectedSubject.chatMessages.length}
                        </span>
                      )}
                      {tab.key === "study" && selectedSubject.studyQuiz && (
                        <span className="ml-1 text-[9px]">✅</span>
                      )}
                    </button>
                  );
                })}

                {/* Subject name badge */}
                <div className="ml-auto flex items-center gap-2 pb-2">
                  <span className="text-lg">{selectedSubject.emoji}</span>
                  <span className="text-xs font-bold text-slate-600">{selectedSubject.name}</span>
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <AnimatePresence mode="wait">
                  {activeTab === "notes" && (
                    <motion.div
                      key="notes"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <NotesPanel
                        subject={selectedSubject}
                        onUploadFiles={handleUploadFiles}
                      />
                    </motion.div>
                  )}

                  {activeTab === "chat" && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <ChatPanel
                        subject={selectedSubject}
                        onSendMessage={handleSendMessage}
                        isLoading={isChatLoading}
                      />
                    </motion.div>
                  )}

                  {activeTab === "voice" && (
                    <motion.div
                      key="voice"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="h-full"
                    >
                      <VoicePanel />
                    </motion.div>
                  )}

                  {activeTab === "study" && (
                    <motion.div
                      key="study"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="h-full"
                    >
                      <StudyModePanel
                        subject={selectedSubject}
                        onGenerateQuiz={handleGenerateQuiz}
                        isGenerating={isQuizGenerating}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[100] min-w-[300px]"
          >
            <div className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] p-4 rounded-xl flex items-center gap-3" style={{ filter: "url(#squiggle)" }}>
              <div className="w-10 h-10 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-600" size={20} />
              </div>
              <p className="font-black text-slate-900 text-sm">
                {toast.message}
              </p>
              <button
                onClick={() => setToast(null)}
                className="ml-auto hover:bg-slate-100 p-1 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Subject Modal */}
      <CreateSubjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSubject}
        existingCount={subjects.length}
      />
    </main >
  );
}
