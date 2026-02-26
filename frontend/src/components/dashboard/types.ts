// Shared TypeScript interfaces for the AskMyNotes dashboard

export interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: "pdf" | "txt";
    uploadedAt: Date;
    file?: File;
}

export interface Citation {
    fileName: string;
    page: number | null;
    chunkId: string;
}

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    citations?: Citation[];
    confidence?: "High" | "Medium" | "Low";
    evidence?: string[];
    notFound?: boolean;
}

export interface MCQ {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    citation: string;
}

export interface ShortAnswer {
    id: string;
    question: string;
    modelAnswer: string;
    citation: string;
}

export interface StudyQuiz {
    mcqs: MCQ[];
    shortAnswers: ShortAnswer[];
    generatedAt: Date;
}

export interface Subject {
    id: string;
    name: string;
    color: string;
    emoji: string;
    files: UploadedFile[];
    chatMessages: ChatMessage[];
    studyQuiz: StudyQuiz | null;
    threadId: string;
}

export type DashboardTab = "notes" | "chat" | "voice" | "study";

export const SUBJECT_COLORS = [
    { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700", accent: "#3b82f6", emoji: "📘" },
    { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700", accent: "#10b981", emoji: "📗" },
    { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700", accent: "#8b5cf6", emoji: "📕" },
] as const;

export const MAX_SUBJECTS = 3;
