import type { CragNotFoundResponse } from "../../types/crag";

export function buildNotFoundResponse(subjectName: string): CragNotFoundResponse {
  return {
    answer: `Not found in your notes for [${subjectName}]`,
    citations: [],
    confidence: "Low",
    evidence: [],
    found: false
  };
}
