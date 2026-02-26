import type { IReranker } from "../../interfaces/reranker";
import type { RetrievedChunk } from "../../types/crag";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export class Reranker implements IReranker {
  rerank(question: string, candidates: RetrievedChunk[], topN: number): RetrievedChunk[] {
    if (candidates.length === 0) {
      return [];
    }

    const questionTokens = new Set(tokenize(question));
    const scored = candidates.map((candidate) => {
      const chunkTokens = new Set(tokenize(candidate.text));
      let overlap = 0;

      for (const token of questionTokens) {
        if (chunkTokens.has(token)) {
          overlap += 1;
        }
      }

      const lexicalScore = questionTokens.size > 0 ? overlap / questionTokens.size : 0;
      const blendedScore = (candidate.score * 0.75) + (lexicalScore * 0.25);

      return {
        ...candidate,
        score: Number(blendedScore.toFixed(6))
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, topN));
  }
}
