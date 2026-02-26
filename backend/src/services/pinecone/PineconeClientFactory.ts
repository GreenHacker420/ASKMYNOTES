import { Pinecone } from "@pinecone-database/pinecone"; // Docs: https://docs.pinecone.io/reference/sdks/node

export interface PineconeClientFactoryOptions {
  apiKey: string;
}

export class PineconeClientFactory {
  private readonly options: PineconeClientFactoryOptions;

  constructor(options: PineconeClientFactoryOptions) {
    this.options = options;
  }

  createClient(): Pinecone {
    return new Pinecone({ apiKey: this.options.apiKey });
  }
}
