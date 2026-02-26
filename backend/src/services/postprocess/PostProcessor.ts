import type { ConfidenceLevel, CragFoundResponse, RetrievedChunk } from "../../types/crag";

interface ParsedModelPayload {
  answer?: unknown;
  confidence?: unknown;
  evidence?: unknown;
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

function toConfidence(value: unknown, topScore: number): ConfidenceLevel {
  if (value === "High" || value === "Medium" || value === "Low") {
    return value;
  }
  if (topScore > 0.85) {
    return "High";
  }
  if (topScore > 0.65) {
    return "Medium";
  }
  return "Low";
}

export class PostProcessor {
  buildFoundResponse(rawLlmOutput: string, rerankedChunks: RetrievedChunk[]): CragFoundResponse {
    const sanitized = stripCodeFence(rawLlmOutput);
    let parsed: ParsedModelPayload = {};

    try {
      parsed = JSON.parse(sanitized) as ParsedModelPayload;
    } catch {
      parsed = {};
    }

    const topScore = rerankedChunks[0]?.score ?? 0;
    const citations = rerankedChunks.slice(0, 3).map((chunk) => ({
      fileName: chunk.metadata.fileName ?? "UnknownFile",
      page: typeof chunk.metadata.page === "number" ? chunk.metadata.page : null,
      chunkId: chunk.metadata.chunkId ?? chunk.id
    }));

    const evidenceFromModel = Array.isArray(parsed.evidence)
      ? parsed.evidence.filter((item): item is string => typeof item === "string")
      : [];

    const evidence = evidenceFromModel.length > 0
      ? evidenceFromModel
      : rerankedChunks.slice(0, 3).map((chunk) => chunk.text).filter((text) => text.length > 0);

    const answer = typeof parsed.answer === "string" && parsed.answer.trim().length > 0
      ? parsed.answer.trim()
      : sanitized;

    // Citations are always derived from retrieved chunk metadata, not from model output.
    return {
      answer,
      citations,
      confidence: toConfidence(parsed.confidence, topScore),
      evidence,
      found: true
    };
  }
}
