import { GoogleGenAI } from "@google/genai";

export type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION";

export interface GeminiEmbeddingClientOptions {
  apiKey: string;
  model: string;
  outputDimensionality: number;
}

export interface EmbeddingClient {
  embedDocuments(texts: string[], taskType?: EmbeddingTaskType): Promise<number[][]>;
  embedQuery(text: string, taskType?: EmbeddingTaskType): Promise<number[]>;
}

export class GeminiEmbeddingClient implements EmbeddingClient {
  private readonly ai: GoogleGenAI;
  private readonly model: string;
  private readonly outputDimensionality: number;

  constructor(options: GeminiEmbeddingClientOptions) {
    this.ai = new GoogleGenAI({ apiKey: options.apiKey });
    this.model = options.model;
    this.outputDimensionality = options.outputDimensionality;
  }

  async embedDocuments(texts: string[], taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.ai.models.embedContent({
      model: this.model,
      contents: texts,
      config: {
        ...(taskType ? { taskType } : {}),
        outputDimensionality: this.outputDimensionality
      }
    });

    const embeddings = (response as { embeddings?: Array<{ values?: number[] }> }).embeddings ?? [];
    return embeddings.map((embedding) => this.normalizeIfNeeded(embedding.values ?? []));
  }

  async embedQuery(text: string, taskType: EmbeddingTaskType = "RETRIEVAL_QUERY"): Promise<number[]> {
    const response = await this.ai.models.embedContent({
      model: this.model,
      contents: text,
      config: {
        ...(taskType ? { taskType } : {}),
        outputDimensionality: this.outputDimensionality
      }
    });

    const direct = (response as { embedding?: { values?: number[] } }).embedding?.values;
    if (direct && direct.length > 0) {
      return this.normalizeIfNeeded(direct);
    }

    const embeddings = (response as { embeddings?: Array<{ values?: number[] }> }).embeddings ?? [];
    return this.normalizeIfNeeded(embeddings[0]?.values ?? []);
  }

  private normalizeIfNeeded(values: number[]): number[] {
    if (values.length === 0) {
      return values;
    }

    if (this.outputDimensionality === 3072) {
      return values;
    }

    let sumSquares = 0;
    for (const value of values) {
      sumSquares += value * value;
    }

    const norm = Math.sqrt(sumSquares);
    if (!norm) {
      return values;
    }

    return values.map((value) => value / norm);
  }
}
