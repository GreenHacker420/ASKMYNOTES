import type { Pinecone } from "@pinecone-database/pinecone"; 
import { PineconeStore } from "@langchain/pinecone"; 
import type { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export interface LangChainPineconeStoreFactoryOptions {
  pinecone: Pinecone;
  indexName: string;
  embeddings: GoogleGenerativeAIEmbeddings;
}

export class LangChainPineconeStoreFactory {
  private readonly options: LangChainPineconeStoreFactoryOptions;

  constructor(options: LangChainPineconeStoreFactoryOptions) {
    this.options = options;
  }

  async createSubjectScopedStore(subjectId: string): Promise<PineconeStore> {
    const index = this.options.pinecone.index(this.options.indexName);


    return PineconeStore.fromExistingIndex(this.options.embeddings, {
      pineconeIndex: index,
      namespace: subjectId
    });
  }
}
