import { create } from 'zustand';
import { Subject, DashboardTab, UploadedFile, ChatMessage, StudyQuiz } from '@/src/components/dashboard/types';

interface StudyState {
    subjects: Subject[];
    selectedId: string | null;
    activeTab: DashboardTab;
    showCreateModal: boolean;
    isChatLoading: boolean;
    isQuizGenerating: boolean;
    sidebarOpen: boolean;

    // Actions
    setSubjects: (subjects: Subject[] | ((prev: Subject[]) => Subject[])) => void;
    setSelectedId: (id: string | null) => void;
    setActiveTab: (tab: DashboardTab) => void;
    setShowCreateModal: (show: boolean) => void;
    setIsChatLoading: (loading: boolean) => void;
    setIsQuizGenerating: (generating: boolean) => void;
    setSidebarOpen: (open: boolean) => void;

    addSubject: (subject: Subject) => void;
    uploadFiles: (subjectId: string, files: UploadedFile[]) => void;
    deleteFile: (subjectId: string, fileId: string) => void;
    addChatMessage: (subjectId: string, message: ChatMessage) => void;
    setStudyQuiz: (subjectId: string, quiz: StudyQuiz) => void;

    // Voice Actions
    isVoiceActive: boolean;
    setVoiceActive: (active: boolean) => void;
    voiceStatus: "idle" | "listening" | "processing" | "speaking";
    setVoiceStatus: (status: "idle" | "listening" | "processing" | "speaking") => void;
}


export const useStudyStore = create<StudyState>((set) => ({
    subjects: [],
    selectedId: null,
    activeTab: 'notes',
    showCreateModal: false,
    isChatLoading: false,
    isQuizGenerating: false,
    sidebarOpen: true,

    setSubjects: (payload) =>
        set((state) => ({
            subjects: typeof payload === 'function' ? payload(state.subjects) : payload,
        })),
    setSelectedId: (id) => set({ selectedId: id }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setShowCreateModal: (show) => set({ showCreateModal: show }),
    setIsChatLoading: (loading) => set({ isChatLoading: loading }),
    setIsQuizGenerating: (generating) => set({ isQuizGenerating: generating }),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    addSubject: (subject) =>
        set((state) => ({
            subjects: [...state.subjects, subject],
            selectedId: subject.id,
            activeTab: 'notes'
        })),

    uploadFiles: (subjectId, files) =>
        set((state) => ({
            subjects: state.subjects.map((s) =>
                s.id === subjectId ? { ...s, files: [...s.files, ...files] } : s
            ),
        })),

    deleteFile: (subjectId, fileId) =>
        set((state) => ({
            subjects: state.subjects.map((s) =>
                s.id === subjectId ? { ...s, files: s.files.filter((f) => f.id !== fileId) } : s
            ),
        })),

    addChatMessage: (subjectId, message) =>
        set((state) => ({
            subjects: state.subjects.map((s) =>
                s.id === subjectId ? { ...s, chatMessages: [...s.chatMessages, message] } : s
            ),
        })),

    setStudyQuiz: (subjectId: string, quiz: StudyQuiz) =>
        set((state) => ({
            subjects: state.subjects.map((s) =>
                s.id === subjectId ? { ...s, studyQuiz: quiz } : s
            ),
        })),

    // Voice Actions implementation
    isVoiceActive: false,
    setVoiceActive: (active) => set({ isVoiceActive: active }),
    voiceStatus: "idle",
    setVoiceStatus: (status) => set({ voiceStatus: status }),
}));
