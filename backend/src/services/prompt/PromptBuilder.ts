import type { MemoryTurn, RetrievedChunk } from "../../types/crag";

export interface PromptBuilderInput {
  subjectName: string;
  question: string;
  chunks: RetrievedChunk[];
  threadMemory: MemoryTurn[];
}

export class PromptBuilder {
  build(input: PromptBuilderInput): Array<["system" | "human", string]> {
    const contextBlock = input.chunks
      .map((chunk) => {
        const fileName = chunk.metadata.fileName ?? "UnknownFile";
        const page = chunk.metadata.page ?? "UnknownPage";
        const chunkId = chunk.metadata.chunkId ?? chunk.id;

        return [
          "[CHUNK_START]",
          `chunkId: ${chunkId}`,
          `fileName: ${fileName}`,
          `page: ${page}`,
          `score: ${chunk.score.toFixed(6)}`,
          "text:",
          chunk.text,
          "[CHUNK_END]"
        ].join("\n");
      })
      .join("\n\n");

    const memoryBlock = input.threadMemory.length === 0
      ? "No prior thread memory."
      : input.threadMemory
          .map((turn, idx) => {
            return [
              `[MEMORY_TURN_${idx + 1}]`,
              `question: ${turn.question}`,
              `answer: ${turn.answer}`,
              `createdAtIso: ${turn.createdAtIso}`,
              "[/MEMORY_TURN]"
            ].join("\n");
          })
          .join("\n\n");

    const systemMessage = [
      "You must answer ONLY using the provided context.",
      "Return EXACTLY one of the following outputs:",
      `1) A strict JSON object with schema: {\"answer\": string, \"citations\": [{\"fileName\": string, \"page\": number | null, \"chunkId\": string}], \"confidence\": \"High\"|\"Medium\"|\"Low\", \"evidence\": string[], \"found\": true }`,
      `2) The exact string: \"Not found in your notes for [${input.subjectName}]\"`,
      "Never include markdown fences or any additional keys.",
      "If evidence is insufficient, output the exact Not found string."
    ].join("\n");

    const humanMessage = [
      `Subject: ${input.subjectName}`,
      `Question: ${input.question}`,
      "THREAD_MEMORY_START",
      memoryBlock,
      "THREAD_MEMORY_END",
      "CONTEXT_CHUNKS_START",
      contextBlock,
      "CONTEXT_CHUNKS_END"
    ].join("\n\n");

    return [
      ["system", systemMessage],
      ["human", humanMessage]
    ];
  }
}
