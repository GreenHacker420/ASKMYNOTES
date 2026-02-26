import type { ILLMClient } from "../../interfaces/llmClient";
import type { IMemoryService } from "../../interfaces/memory";
import type { IReranker } from "../../interfaces/reranker";
import type { IRetriever } from "../../interfaces/retriever";
import type { AskRequest, CragResponse } from "../../types/crag";
import { buildNotFoundResponse } from "./notFound";
import type { PromptBuilder } from "../prompt/PromptBuilder";
import type { PostProcessor } from "../postprocess/PostProcessor";

export interface CragPipelineOptions {
  retriever: IRetriever;
  reranker: IReranker;
  promptBuilder: PromptBuilder;
  llmClient: ILLMClient;
  postProcessor: PostProcessor;
  memoryService: IMemoryService;
  notFoundThreshold: number;
  topK: number;
  rerankTopN: number;
}

export class CragPipelineService {
  private readonly options: CragPipelineOptions;

  constructor(options: CragPipelineOptions) {
    this.options = options;
  }

  async ask(input: AskRequest): Promise<CragResponse> {
    const retrieved = await this.options.retriever.retrieve(
      input.question,
      input.subjectId,
      this.options.topK
    );

    const reranked = this.options.reranker.rerank(
      input.question,
      retrieved,
      this.options.rerankTopN
    );

    const topScore = reranked[0]?.score ?? 0;
    if (topScore < this.options.notFoundThreshold) {
      // Mandatory short-circuit: do not call LLM if below threshold.
      return buildNotFoundResponse(input.subjectName);
    }

    const threadMemory = await this.options.memoryService.loadThreadMemory(input.threadId);

    const promptMessages = this.options.promptBuilder.build({
      question: input.question,
      subjectName: input.subjectName,
      chunks: reranked,
      threadMemory
    });

    const llmRaw = await this.options.llmClient.invoke(promptMessages);
    const notFoundResponse = buildNotFoundResponse(input.subjectName);

    if (llmRaw.trim() === notFoundResponse.answer) {
      return notFoundResponse;
    }

    const response = this.options.postProcessor.buildFoundResponse(llmRaw, reranked);

    await this.options.memoryService.appendThreadMemory(input.threadId, {
      question: input.question,
      answer: response.answer,
      subjectId: input.subjectId,
      createdAtIso: new Date().toISOString()
    });

    return response;
  }

  async *askStream(input: AskRequest): AsyncGenerator<{ type: "chunk"; delta: string } | { type: "final"; response: CragResponse }, void, unknown> {
    const retrieved = await this.options.retriever.retrieve(
      input.question,
      input.subjectId,
      this.options.topK
    );

    const reranked = this.options.reranker.rerank(
      input.question,
      retrieved,
      this.options.rerankTopN
    );

    const topScore = reranked[0]?.score ?? 0;
    if (topScore < this.options.notFoundThreshold) {
      const notFound = buildNotFoundResponse(input.subjectName);
      yield { type: "final", response: notFound };
      return;
    }

    const threadMemory = await this.options.memoryService.loadThreadMemory(input.threadId);

    const promptMessages = this.options.promptBuilder.build({
      question: input.question,
      subjectName: input.subjectName,
      chunks: reranked,
      threadMemory
    });

    let fullText = "";
    for await (const token of this.options.llmClient.invokeStream(promptMessages)) {
      fullText += token;
      yield { type: "chunk", delta: token };
    }

    const notFoundResponse = buildNotFoundResponse(input.subjectName);

    if (fullText.trim() === notFoundResponse.answer) {
      yield { type: "final", response: notFoundResponse };
      return;
    }

    const response = this.options.postProcessor.buildFoundResponse(fullText, reranked);

    await this.options.memoryService.appendThreadMemory(input.threadId, {
      question: input.question,
      answer: response.answer,
      subjectId: input.subjectId,
      createdAtIso: new Date().toISOString()
    });

    yield { type: "final", response };
  }
}
