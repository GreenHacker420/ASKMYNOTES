import dotenv from "dotenv";

dotenv.config();

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }
  return value;
}

export interface AppEnv {
  databaseUrl: string;
  pineconeApiKey: string;
  pineconeEnv: string;
  pineconeIndex: string;
  googleApiKey: string;
  notFoundThreshold: number;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  rerankTopN: number;
  geminiModel: string;
  port: number;
  langGraphAutoSetup: boolean;
}

export function loadEnv(): AppEnv {
  const googleApiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!googleApiKey) {
    throw new Error("Missing GOOGLE_API_KEY (or GEMINI_API_KEY).");
  }

  return {
    databaseUrl: readEnv("DATABASE_URL"),
    pineconeApiKey: readEnv("PINECONE_API_KEY"),
    pineconeEnv: readEnv("PINECONE_ENV"),
    pineconeIndex: readEnv("PINECONE_INDEX"),
    googleApiKey,
    notFoundThreshold: readNumberEnv("NOT_FOUND_THRESHOLD", 0.35),
    chunkSize: readNumberEnv("CHUNK_SIZE", 1200),
    chunkOverlap: readNumberEnv("CHUNK_OVERLAP", 200),
    topK: readNumberEnv("TOP_K", 8),
    rerankTopN: readNumberEnv("RERANK_TOP_N", 5),
    geminiModel: readEnv("GEMINI_MODEL", "gemini-1.5-pro"),
    port: readNumberEnv("PORT", 3001),
    langGraphAutoSetup: (process.env.LANGGRAPH_AUTO_SETUP ?? "true").toLowerCase() === "true"
  };
}
