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
  if (!raw || raw.trim() === "") {
    return fallback;
  }
  const cleaned = raw.replace(/['"]/g, '').trim();
  const value = Number(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${name} must be a number. Got: ${raw}`);
  }
  return value;
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  return raw.toLowerCase() === "true";
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    return undefined;
  }
  return value;
}

export interface AppEnv {
  databaseUrl: string;
  pineconeApiKey: string;
  pineconeEnv: string;
  pineconeIndex: string;
  googleApiKey: string;
  embeddingModel: string;
  embeddingDimension: number;
  notFoundThreshold: number;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  rerankTopN: number;
  geminiModel: string;
  port: number;
  langGraphAutoSetup: boolean;
  langGraphSchema: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  betterAuthTrustedOrigins: string[];
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  googleOauthClientId?: string;
  googleOauthClientSecret?: string;
  frontendUrl: string;

}

export function loadAppEnv(): AppEnv {
  const googleApiKey = process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY;
  if (!googleApiKey) {
    throw new Error("Missing GOOGLE_API_KEY (or GEMINI_API_KEY).");
  }

  const betterAuthSecret =
    process.env.BETTER_AUTH_SECRET ?? "dev-only-better-auth-secret-change-before-production";

  if (!process.env.BETTER_AUTH_SECRET) {
    console.warn("BETTER_AUTH_SECRET is not set. Using a development fallback secret.");
  }

  return {
    databaseUrl: readEnv("DATABASE_URL"),
    pineconeApiKey: readEnv("PINECONE_API_KEY"),
    pineconeEnv: readEnv("PINECONE_ENV"),
    pineconeIndex: readEnv("PINECONE_INDEX"),
    googleApiKey,
    embeddingModel: readEnv("EMBEDDING_MODEL", "gemini-embedding-001"),
    embeddingDimension: readNumberEnv("EMBEDDING_DIM", 768),
    notFoundThreshold: readNumberEnv("NOT_FOUND_THRESHOLD", 0.35),
    chunkSize: readNumberEnv("CHUNK_SIZE", 1200),
    chunkOverlap: readNumberEnv("CHUNK_OVERLAP", 200),
    topK: readNumberEnv("TOP_K", 8),
    rerankTopN: readNumberEnv("RERANK_TOP_N", 5),
    geminiModel: readEnv("GEMINI_MODEL", "gemini-1.5-pro"),
    port: readNumberEnv("PORT", 3001),
    langGraphAutoSetup: readBooleanEnv("LANGGRAPH_AUTO_SETUP", true),
    langGraphSchema: readEnv("LANGGRAPH_SCHEMA", "langgraph"),
    betterAuthSecret,
    betterAuthUrl: readEnv("BETTER_AUTH_URL"),
    betterAuthTrustedOrigins: (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0),
    smtpHost: readEnv("SMTP_HOST"),
    smtpPort: readNumberEnv("SMTP_PORT", 587),
    smtpSecure: readBooleanEnv("SMTP_SECURE", false),
    smtpUser: readEnv("SMTP_USER"),
    smtpPass: readEnv("SMTP_PASS"),
    smtpFrom: readEnv("SMTP_FROM"),
    googleOauthClientId: readOptionalEnv("GOOGLE_CLIENT_ID"),
    googleOauthClientSecret: readOptionalEnv("GOOGLE_CLIENT_SECRET"),
    frontendUrl: readEnv("FRONTEND_URL", "http://localhost:3000")
  };
}

export const loadEnv = loadAppEnv;
