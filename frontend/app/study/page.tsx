"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, FileText, MessageSquare, Brain, BookOpen } from "lucide-react";
import { SquiggleFilter } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SquiggleFilter";
import { GraphPaper } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/GraphPaper";
import { SketchButton } from "@/src/components/CoreLandingPages/CompleteLandingPages/tsx/SketchButton";
import { Sidebar } from "@/src/components/dashboard/Sidebar";
import { CreateSubjectModal } from "@/src/components/dashboard/CreateSubjectModal";
import { NotesPanel } from "@/src/components/dashboard/NotesPanel";
import { ChatPanel } from "@/src/components/dashboard/ChatPanel";
import { StudyModePanel } from "@/src/components/dashboard/StudyModePanel";
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

// ── Helpers ──

function createId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createThreadId(): string {
  return `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Mock response generators ──

function generateMockAnswer(question: string, subjectName: string): ChatMessage {
  // Simulate "not found" for very short questions
  if (question.length < 8) {
    return {
      id: createId(),
      role: "assistant",
      content: `Not found in your notes for ${subjectName}. Your question may be too vague — try asking something more specific about your uploaded material.`,
      timestamp: new Date(),
      notFound: true,
    };
  }

  return {
    id: createId(),
    role: "assistant",
    content: `Based on your ${subjectName} notes, here's what I found:\n\n${question.includes("law")
      ? "Newton's Second Law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. This is expressed mathematically as F = ma, where F is the net force, m is the mass, and a is the acceleration."
      : question.includes("formula") || question.includes("equation")
        ? "The key formula from your notes is derived from the fundamental principles discussed in Chapter 3. It relates the variables through a direct proportional relationship, as shown in the worked examples on pages 42-45."
        : `The topic you asked about is covered in your uploaded notes. The key concept involves understanding the relationships between the fundamental principles discussed across multiple sections of your study material. According to Section 3.2, this builds on the foundational theory introduced earlier.`
      }`,
    timestamp: new Date(),
    confidence: question.length > 30 ? "High" : question.length > 15 ? "Medium" : "Low",
    citations: [
      { fileName: "notes_ch3.pdf", page: 42, chunkId: "c-001" },
      { fileName: "lecture_summary.txt", page: null, chunkId: "c-014" },
    ],
    evidence: [
      "The relationship between force, mass, and acceleration is fundamental to classical mechanics...",
      "As demonstrated in Example 3.4, applying the principle yields consistent results across varying conditions...",
    ],
  };
}

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

// ── Tab Configuration ──

const TABS: { key: DashboardTab; label: string; icon: React.ElementType }[] = [
  { key: "notes", label: "Notes", icon: FileText },
  { key: "chat", label: "Chat", icon: MessageSquare },
  { key: "study", label: "Study Mode", icon: Brain },
];

// ── Dashboard Page ──

export default function DashboardPage() {
  // State
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("notes");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const selectedSubject = subjects.find((s) => s.id === selectedId) ?? null;

  // ── Actions ──

  const handleCreateSubject = useCallback((name: string) => {
    const colorIndex = subjects.length;
    const newSubject: Subject = {
      id: createId(),
      name,
      color: SUBJECT_COLORS[colorIndex]?.accent ?? "#3b82f6",
      emoji: SUBJECT_COLORS[colorIndex]?.emoji ?? "📘",
      files: [],
      chatMessages: [],
      studyQuiz: null,
      threadId: createThreadId(),
    };
    setSubjects((prev) => [...prev, newSubject]);
    setSelectedId(newSubject.id);
    setActiveTab("notes");
  }, [subjects.length]);

  const handleUploadFiles = useCallback((subjectId: string, files: UploadedFile[]) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, files: [...s.files, ...files] } : s
      )
    );
  }, []);

  const handleDeleteFile = useCallback((subjectId: string, fileId: string) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, files: s.files.filter((f) => f.id !== fileId) }
          : s
      )
    );
  }, []);

  const handleSendMessage = useCallback((subjectId: string, message: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: createId(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, chatMessages: [...s.chatMessages, userMsg] }
          : s
      )
    );

    // Simulate AI response
    setIsChatLoading(true);
    const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "this subject";

    setTimeout(() => {
      const aiMsg = generateMockAnswer(message, subjectName);
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId
            ? { ...s, chatMessages: [...s.chatMessages, aiMsg] }
            : s
        )
      );
      setIsChatLoading(false);
    }, 1200 + Math.random() * 800);
  }, [subjects]);

  const handleGenerateQuiz = useCallback((subjectId: string) => {
    setIsQuizGenerating(true);
    const subjectName = subjects.find((s) => s.id === subjectId)?.name ?? "this subject";

    setTimeout(() => {
      const quiz = generateMockQuiz(subjectName);
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === subjectId ? { ...s, studyQuiz: quiz } : s
        )
      );
      setIsQuizGenerating(false);
    }, 2000 + Math.random() * 1000);
  }, [subjects]);

  // ── Render ──

  return (
    <main className="relative h-screen w-full text-slate-800 overflow-hidden font-sans selection:bg-yellow-300 selection:text-black flex flex-col">
      <SquiggleFilter />
      <GraphPaper />

      {/* Top Navbar */}
      <nav className="relative z-40 flex items-center justify-between px-4 md:px-6 py-3 bg-[#fdfbf7]/90 backdrop-blur-sm border-b-2 border-slate-200">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-black tracking-tighter hover:scale-105 transition-transform"
        >
          <div className="h-7 w-7 rounded border-2 border-slate-900 bg-slate-800" />
          AskMyNotes.
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline text-xs font-mono text-slate-400">
            {subjects.length} subject{subjects.length !== 1 ? "s" : ""} •{" "}
            {subjects.reduce((sum, s) => sum + s.files.length, 0)} files
          </span>
          <Link href="/">
            <SketchButton className="px-3 py-1.5 text-xs">
              <LogOut size={14} />
              Exit
            </SketchButton>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <motion.div
          animate={{ width: sidebarOpen ? 280 : 0 }}
          className="flex-shrink-0 border-r-2 border-slate-200 bg-[#fdfbf7]/80 backdrop-blur-sm overflow-hidden"
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

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-white border-2 border-slate-300 border-l-0 rounded-r-md flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-yellow-50 transition-all"
          style={{ left: sidebarOpen ? 278 : 0 }}
        >
          <span className="text-xs">{sidebarOpen ? "‹" : "›"}</span>
        </button>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* No subject selected */}
          {!selectedSubject && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-7xl mb-6"
              >
                📚
              </motion.div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">
                {subjects.length === 0 ? "Get Started" : "Select a Subject"}
              </h2>
              <p className="text-sm text-slate-500 text-center max-w-md mb-6">
                {subjects.length === 0
                  ? "Create your first subject to start uploading notes and asking questions."
                  : "Click on a subject from the sidebar to view notes, chat, or start study mode."}
              </p>
              {subjects.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-md border-2 border-slate-900 bg-yellow-300 px-6 py-3 text-sm font-bold text-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center gap-2"
                >
                  <BookOpen size={18} />
                  Create Your First Subject
                </button>
              )}
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
                        onDeleteFile={handleDeleteFile}
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

      {/* Create Subject Modal */}
      <CreateSubjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSubject}
        existingCount={subjects.length}
      />
    </main>
  );
}
