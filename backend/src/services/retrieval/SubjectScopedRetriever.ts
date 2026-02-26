import type { Pinecone } from "@pinecone-database/pinecone";
import type { IRetriever } from "../../interfaces/retriever";
import type { RetrievedChunk } from "../../types/crag";
import type { EmbeddingClient } from "../embeddings/GeminiEmbeddingClient";

export interface SubjectScopedRetrieverOptions {
  pinecone: Pinecone;
  pineconeIndexName: string;
  embeddingClient: EmbeddingClient;
}

export class SubjectScopedRetriever implements IRetriever {
  private readonly pinecone: Pinecone;
  private readonly pineconeIndexName: string;
  private readonly embeddingClient: EmbeddingClient;

  constructor(options: SubjectScopedRetrieverOptions) {
    this.pinecone = options.pinecone;
    this.pineconeIndexName = options.pineconeIndexName;
    this.embeddingClient = options.embeddingClient;
  }

  async retrieve(question: string, subjectId: string, topK: number): Promise<RetrievedChunk[]> {
    const queryVector = await this.embeddingClient.embedQuery(question, "RETRIEVAL_QUERY");
    
    const namespaceIndex = this.pinecone
      .index(this.pineconeIndexName)
      .namespace(subjectId);

    const queryResponse = await namespaceIndex.query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      includeValues: false
    });

    const mapped = (queryResponse.matches ?? []).map((match) => {
      const metadata = (match.metadata ?? {}) as Record<string, unknown>;
      const textFromMetadata = typeof metadata.text === "string" ? metadata.text : "";

      return {
        id: String(match.id),
        score: match.score ?? 0,
        text: textFromMetadata,
        metadata: {
          ...metadata,
          fileName: typeof metadata.fileName === "string" ? metadata.fileName : undefined,
          page: typeof metadata.page === "number" ? metadata.page : undefined,
          chunkId: typeof metadata.chunkId === "string" ? metadata.chunkId : undefined
        }
      } satisfies RetrievedChunk;
    });

    return mapped;
  }
}
