import type { RetrievedChunk } from "../types/crag";

export interface IReranker {
  rerank(question: string, candidates: RetrievedChunk[], topN: number): RetrievedChunk[];
}
