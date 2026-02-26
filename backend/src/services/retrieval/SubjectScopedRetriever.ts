import type { Pinecone } from "@pinecone-database/pinecone"; // Docs: https://docs.pinecone.io/reference/sdks/node
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; // Docs: https://docs.langchain.com/oss/javascript/integrations/text_embedding/google_generativeai
import type { IRetriever } from "../../interfaces/retriever";
import type { RetrievedChunk } from "../../types/crag";
import type { LangChainPineconeStoreFactory } from "./LangChainPineconeStoreFactory";

export interface SubjectScopedRetrieverOptions {
  pinecone: Pinecone;
  pineconeIndexName: string;
  googleApiKey: string;
  embeddingModel?: string;
  langChainStoreFactory?: LangChainPineconeStoreFactory;
}

export class SubjectScopedRetriever implements IRetriever {
  private readonly pinecone: Pinecone;
  private readonly pineconeIndexName: string;
  private readonly embeddings: GoogleGenerativeAIEmbeddings;
  private readonly langChainStoreFactory?: LangChainPineconeStoreFactory;

  constructor(options: SubjectScopedRetrieverOptions) {
    this.pinecone = options.pinecone;
    this.pineconeIndexName = options.pineconeIndexName;
    this.langChainStoreFactory = options.langChainStoreFactory;

    // Embeddings constructor usage: https://docs.langchain.com/oss/javascript/integrations/text_embedding/google_generativeai
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: options.googleApiKey,
      model: options.embeddingModel ?? "text-embedding-004"
    });
  }

  async retrieve(question: string, subjectId: string, topK: number): Promise<RetrievedChunk[]> {
    const queryVector = await this.embeddings.embedQuery(question);
    
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

    void this.langChainStoreFactory;

    return mapped;
  }
}
