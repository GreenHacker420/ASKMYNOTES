import { createHash } from "node:crypto";
import { extname } from "node:path";
import type { Pinecone } from "@pinecone-database/pinecone";
import { PDFParse } from "pdf-parse";
import type { PrismaClient } from "../../../generated/prisma/client";
import type { EmbeddingClient } from "../embeddings/GeminiEmbeddingClient";

interface ChunkCandidate {
  page: number;
  chunkId: string;
  text: string;
  pineconeId: string;
}

interface SourcePage {
  page: number;
  text: string;
}

export interface NotesIngestionServiceOptions {
  prisma: PrismaClient;
  pinecone: Pinecone;
  pineconeIndex: string;
  embeddingClient: EmbeddingClient;
  chunkSize: number;
  chunkOverlap: number;
}

export interface IngestFileInput {
  subjectId: string;
  subjectName: string;
  userId: string;
  fileName: string;
  mimeType?: string;
  content: Buffer;
  onProgress?: (step: "extracting" | "chunking" | "vectorizing" | "saving" | "done") => void;
}

export interface IngestFileResult {
  subjectId: string;
  subjectName: string;
  fileName: string;
  totalPages: number;
  chunkCount: number;
}

export class NotesIngestionService {
  private readonly prisma: PrismaClient;
  private readonly pinecone: Pinecone;
  private readonly pineconeIndex: string;
  private readonly embeddingClient: EmbeddingClient;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(options: NotesIngestionServiceOptions) {
    this.prisma = options.prisma;
    this.pinecone = options.pinecone;
    this.pineconeIndex = options.pineconeIndex;
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error("CHUNK_OVERLAP must be smaller than CHUNK_SIZE.");
    }

    this.embeddingClient = options.embeddingClient;
  }

  async ingestFile(input: IngestFileInput): Promise<IngestFileResult> {
    input.onProgress?.("extracting");
    const pages = await this.extractPages(input.fileName, input.mimeType, input.content);

    input.onProgress?.("chunking");

    const rawTextLength = pages.reduce((sum, page) => sum + page.text.length, 0);
    // eslint-disable-next-line no-console
    console.log(
      `[ingestion] Extracted ${pages.length} pages, total text length=${rawTextLength} for ${input.fileName}`
    );

    const chunks = this.createChunks({
      subjectId: input.subjectId,
      fileName: input.fileName,
      pages
    });

    if (chunks.length === 0) {
      throw new Error("No extractable text found in file.");
    }


    input.onProgress?.("saving");

    // eslint-disable-next-line no-console
    console.log(`[ingestion] Created ${chunks.length} chunks for ${input.fileName}`);


    await this.prisma.subject.upsert({
      where: { id: input.subjectId },
      update: { name: input.subjectName, userId: input.userId },
      create: {
        id: input.subjectId,
        name: input.subjectName,
        userId: input.userId
      }
    });

    input.onProgress?.("vectorizing");
    const vectors = await this.embeddingClient.embedDocuments(
      chunks.map((chunk) => chunk.text),
      "RETRIEVAL_DOCUMENT"
    );
    const expectedDim = vectors[0]?.length ?? 0;
    // eslint-disable-next-line no-console
    console.log(
      `[ingestion] Embedding vectors=${vectors.length}, dimension=${expectedDim} for ${input.fileName}`
    );
    if (expectedDim === 0) {
      throw new Error("Embedding generation failed (empty vectors). Check GOOGLE_API_KEY and embedding model access.");
    }
    for (const vec of vectors) {
      if (vec.length !== expectedDim) {
        throw new Error(`Embedding dimension mismatch: expected ${expectedDim}, got ${vec.length}.`);
      }
    }
    const namespaceIndex = this.pinecone.index(this.pineconeIndex).namespace(input.subjectId);

    input.onProgress?.("saving");
    await namespaceIndex.upsert(
      chunks.map((chunk, idx) => ({
        id: chunk.pineconeId,
        values: vectors[idx],
        metadata: {
          text: chunk.text,
          fileName: input.fileName,
          page: chunk.page,
          chunkId: chunk.chunkId,
          subjectId: input.subjectId
        }
      }))
    );

    for (const chunk of chunks) {
      await this.prisma.noteChunk.upsert({
        where: { pineconeId: chunk.pineconeId },
        update: {
          fileName: input.fileName,
          page: chunk.page,
          chunkId: chunk.chunkId,
          text: chunk.text,
          metadata: {
            fileName: input.fileName,
            page: chunk.page,
            chunkId: chunk.chunkId,
            subjectId: input.subjectId
          }
        },
        create: {
          subjectId: input.subjectId,
          pineconeId: chunk.pineconeId,
          fileName: input.fileName,
          page: chunk.page,
          chunkId: chunk.chunkId,
          text: chunk.text,
          metadata: {
            fileName: input.fileName,
            page: chunk.page,
            chunkId: chunk.chunkId,
            subjectId: input.subjectId
          }
        }
      });
    }

    input.onProgress?.("done");
    return {
      subjectId: input.subjectId,
      subjectName: input.subjectName,
      fileName: input.fileName,
      totalPages: Math.max(...pages.map((page) => page.page), 1),
      chunkCount: chunks.length
    };
  }

  private async extractPages(fileName: string, mimeType: string | undefined, content: Buffer): Promise<SourcePage[]> {
    const normalizedMime = (mimeType ?? "").toLowerCase();
    const extension = extname(fileName).toLowerCase();
    const isPdf = normalizedMime.includes("pdf") || extension === ".pdf";
    const isTxt =
      normalizedMime.includes("text/plain") ||
      extension === ".txt" ||
      extension === ".md";

    if (isPdf) {
      const parser = new PDFParse({ data: content });
      try {
        const textResult = await parser.getText();
        return textResult.pages.map((page) => ({
          page: page.num,
          text: page.text
        }));
      } finally {
        await parser.destroy();
      }
    }

    if (!isTxt) {
      throw new Error("Unsupported file type. Only PDF and TXT are supported.");
    }

    return [
      {
        page: 1,
        text: content.toString("utf8")
      }
    ];
  }

  private createChunks(input: {
    subjectId: string;
    fileName: string;
    pages: SourcePage[];
  }): ChunkCandidate[] {
    const chunks: ChunkCandidate[] = [];

    for (const page of input.pages) {
      const normalized = page.text.replace(/\s+/g, " ").trim();
      if (normalized.length === 0) {
        continue;
      }

      const pageChunks = this.splitText(normalized);
      pageChunks.forEach((text, idx) => {
        const chunkId = `${input.fileName}-p${page.page}-c${idx + 1}`;
        const pineconeId = createHash("sha256")
          .update(`${input.subjectId}:${chunkId}:${text}`)
          .digest("hex")
          .slice(0, 40);

        chunks.push({
          page: page.page,
          chunkId,
          text,
          pineconeId
        });
      });
    }

    return chunks;
  }

  private splitText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + this.chunkSize, text.length);
      const slice = text.slice(start, end).trim();
      if (slice.length > 0) {
        chunks.push(slice);
      }

      if (end >= text.length) {
        break;
      }

      start = end - this.chunkOverlap;
    }

    return chunks;
  }
}
