import type { RetrievedChunk } from "../types/crag";

export interface IRetriever {
  retrieve(question: string, subjectId: string, topK: number): Promise<RetrievedChunk[]>;
}
