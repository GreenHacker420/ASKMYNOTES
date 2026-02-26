export type ConfidenceLevel = "High" | "Medium" | "Low";

export interface Citation {
  fileName: string;
  page: number | null;
  chunkId: string;
}

export interface RetrievedChunk {
  id: string;
  score: number;
  text: string;
  metadata: {
    fileName?: string;
    page?: number;
    chunkId?: string;
    [key: string]: unknown;
  };
}

export interface MemoryTurn {
  question: string;
  answer: string;
  subjectId: string;
  createdAtIso: string;
}

export interface CragFoundResponse {
  answer: string;
  citations: Citation[];
  confidence: ConfidenceLevel;
  evidence: string[];
  found: true;
}

export interface CragNotFoundResponse {
  answer: string;
  citations: [];
  confidence: "Low";
  evidence: [];
  found: false;
}

export type CragResponse = CragFoundResponse | CragNotFoundResponse;

export interface AskRequest {
  question: string;
  subjectId: string;
  subjectName: string;
  threadId: string;
}
