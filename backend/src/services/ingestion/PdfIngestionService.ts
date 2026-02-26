import { createHash } from "node:crypto";
import { basename } from "node:path";
import { readFile } from "node:fs/promises";
import type { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PDFParse } from "pdf-parse";
import type { PrismaClient } from "../../../generated/prisma/client";

interface ChunkCandidate {
  page: number;
  chunkId: string;
  text: string;
  pineconeId: string;
}

export interface PdfIngestionServiceOptions {
  prisma: PrismaClient;
  pinecone: Pinecone;
  pineconeIndex: string;
  googleApiKey: string;
  chunkSize: number;
  chunkOverlap: number;
}

export interface IngestPdfInput {
  subjectId: string;
  subjectName: string;
  filePath: string;
  userId: string;
}

export interface IngestPdfResult {
  subjectId: string;
  subjectName: string;
  fileName: string;
  totalPages: number;
  chunkCount: number;
}

export class PdfIngestionService {
  private readonly prisma: PrismaClient;
  private readonly pinecone: Pinecone;
  private readonly pineconeIndex: string;
  private readonly embeddings: GoogleGenerativeAIEmbeddings;
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(options: PdfIngestionServiceOptions) {
    this.prisma = options.prisma;
    this.pinecone = options.pinecone;
    this.pineconeIndex = options.pineconeIndex;
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;

    if (this.chunkOverlap >= this.chunkSize) {
      throw new Error("CHUNK_OVERLAP must be smaller than CHUNK_SIZE.");
    }

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: options.googleApiKey,
      model: "text-embedding-004"
    });
  }

  async ingestPdf(input: IngestPdfInput): Promise<IngestPdfResult> {
    const fileName = basename(input.filePath);
    const buffer = await readFile(input.filePath);

    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const textResult = await parser.getText();
    await parser.destroy();

    const chunks = this.createChunks({
      subjectId: input.subjectId,
      fileName,
      pages: textResult.pages
    });

    if (chunks.length === 0) {
      throw new Error("No extractable text found in PDF.");
    }

    await this.prisma.subject.upsert({
      where: { id: input.subjectId },
      update: { name: input.subjectName },
      create: { id: input.subjectId, name: input.subjectName, userId: input.userId }
    });

    const vectors = await this.embeddings.embedDocuments(chunks.map((chunk) => chunk.text));
    const namespaceIndex = this.pinecone.index(this.pineconeIndex).namespace(input.subjectId);

    await namespaceIndex.upsert(
      chunks.map((chunk, idx) => ({
        id: chunk.pineconeId,
        values: vectors[idx],
        metadata: {
          text: chunk.text,
          fileName,
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
          fileName,
          page: chunk.page,
          chunkId: chunk.chunkId,
          text: chunk.text,
          metadata: {
            fileName,
            page: chunk.page,
            chunkId: chunk.chunkId,
            subjectId: input.subjectId
          }
        },
        create: {
          subjectId: input.subjectId,
          pineconeId: chunk.pineconeId,
          fileName,
          page: chunk.page,
          chunkId: chunk.chunkId,
          text: chunk.text,
          metadata: {
            fileName,
            page: chunk.page,
            chunkId: chunk.chunkId,
            subjectId: input.subjectId
          }
        }
      });
    }

    return {
      subjectId: input.subjectId,
      subjectName: input.subjectName,
      fileName,
      totalPages: textResult.total,
      chunkCount: chunks.length
    };
  }

  private createChunks(input: {
    subjectId: string;
    fileName: string;
    pages: Array<{ num: number; text: string }>;
  }): ChunkCandidate[] {
    const chunks: ChunkCandidate[] = [];

    for (const page of input.pages) {
      const normalized = page.text.replace(/\s+/g, " ").trim();
      if (normalized.length === 0) {
        continue;
      }

      const pageChunks = this.splitText(normalized);
      pageChunks.forEach((text, idx) => {
        const chunkId = `${input.fileName}-p${page.num}-c${idx + 1}`;
        const pineconeId = createHash("sha256")
          .update(`${input.subjectId}:${chunkId}:${text}`)
          .digest("hex")
          .slice(0, 40);

        chunks.push({
          page: page.num,
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
