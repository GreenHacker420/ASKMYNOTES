import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { toNodeHandler } from "better-auth/node";
import { buildCragConfig } from "./config/cragConfig";
import type { AppEnv } from "./config/env";
import { loadAppEnv } from "./config/env";
import { AskController } from "./controllers/AskController";
import { IngestionController } from "./controllers/IngestionController";
import { QuizController } from "./controllers/QuizController";
import { MeController } from "./controllers/MeController";
import { SubjectController } from "./controllers/SubjectController";
import { CragPipelineService } from "./services/crag/CragPipelineService";
import { NotesIngestionService } from "./services/ingestion/NotesIngestionService";
import { QuizGenerationService } from "./services/quiz/QuizGenerationService";
import { GeminiLangChainClient } from "./services/llm/GeminiLangChainClient";
import { LangGraphPostgresMemoryService } from "./services/memory/LangGraphPostgresMemoryService";
import { PineconeClientFactory } from "./services/pinecone/PineconeClientFactory";
import { PostProcessor } from "./services/postprocess/PostProcessor";
import { PromptBuilder } from "./services/prompt/PromptBuilder";
import { SubjectRepository } from "./services/prisma/SubjectRepository";
import { ThreadRepository } from "./services/prisma/ThreadRepository";
import { PrismaClientProvider } from "./services/prisma/PrismaClientProvider";
import { Reranker } from "./services/retrieval/Reranker";
import { SubjectScopedRetriever } from "./services/retrieval/SubjectScopedRetriever";
import { GeminiEmbeddingClient } from "./services/embeddings/GeminiEmbeddingClient";
import { createApiRoutes } from "./routes/apiRoutes";
import { createBetterAuth, type BetterAuthInstance } from "./services/auth/auth";
import { createRequireAuth } from "./services/auth/requireAuth";
import { GeminiLiveClient } from "./voice/geminiLiveClient";
import { VoiceController } from "./voice/voiceController";
import { createVoiceRouter } from "./voice/voiceRouter";

export interface AppBootstrap {
  app: Express;
  stop: () => Promise<void>;
  services: {
    auth: BetterAuthInstance;
    cragPipeline: CragPipelineService;
    subjectRepository: SubjectRepository;
    threadRepository: ThreadRepository;
  };
}

export function createApp(envInput?: AppEnv): AppBootstrap {
  const env = envInput ?? loadAppEnv();
  const config = buildCragConfig(env);

  const prismaProvider = new PrismaClientProvider(env.databaseUrl);
  const subjectRepository = new SubjectRepository(prismaProvider.getClient());
  const threadRepository = new ThreadRepository(prismaProvider.getClient());
  const auth = createBetterAuth(prismaProvider.getClient(), env);
  const requireAuth = createRequireAuth(auth);

  const pinecone = new PineconeClientFactory({ apiKey: env.pineconeApiKey }).createClient();
  const embeddingClient = new GeminiEmbeddingClient({
    apiKey: env.googleApiKey,
    model: env.embeddingModel,
    outputDimensionality: env.embeddingDimension
  });

  const retriever = new SubjectScopedRetriever({
    pinecone,
    pineconeIndexName: env.pineconeIndex,
    embeddingClient
  });

  const reranker = new Reranker();
  const promptBuilder = new PromptBuilder();
  const llmClient = new GeminiLangChainClient({
    apiKey: env.googleApiKey,
    model: config.geminiModel,
    temperature: 0
  });

  const memoryService = new LangGraphPostgresMemoryService({
    connectionString: env.databaseUrl,
    autoSetup: env.langGraphAutoSetup
  });

  const postProcessor = new PostProcessor();

  const cragPipeline = new CragPipelineService({
    retriever,
    reranker,
    promptBuilder,
    llmClient,
    postProcessor,
    memoryService,
    notFoundThreshold: config.notFoundThreshold,
    topK: config.topK,
    rerankTopN: config.rerankTopN
  });

  const askController = new AskController({
    cragPipeline,
    subjectRepository,
    threadRepository
  });
  const meController = new MeController();
  const geminiLiveClient = new GeminiLiveClient({
    apiKey: env.googleApiKey,
    transcriptionModel: process.env.GEMINI_LIVE_TRANSCRIBE_MODEL,
    audioModel: process.env.GEMINI_LIVE_AUDIO_MODEL,
    voiceName: process.env.GEMINI_LIVE_VOICE
  });
  const voiceController = new VoiceController({
    cragPipeline,
    subjectRepository,
    threadRepository,
    geminiLiveClient
  });
  const subjectController = new SubjectController({ subjectRepository });
  const ingestionController = new IngestionController({
    subjectRepository,
    notesIngestionService: new NotesIngestionService({
      prisma: prismaProvider.getClient(),
      pinecone,
      pineconeIndex: env.pineconeIndex,
      embeddingClient,
      chunkSize: env.chunkSize,
      chunkOverlap: env.chunkOverlap
    })
  });

  const quizController = new QuizController({
    subjectRepository,
    quizGenerationService: new QuizGenerationService({
      subjectRepository,
      llmClient
    })
  });

  const app = express();

  // ── Security middleware ──
  app.use(helmet());
  app.use(cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["X-Transcript", "X-Answer"]
  }));



  // ── Routes ──
  app.all("/api/auth/{*any}", toNodeHandler(auth));
  app.use(express.json({ limit: "25mb" }));
  app.use(
    "/api/voice",
    createVoiceRouter(
      {
        voiceController
      },
      requireAuth
    )
  );
  app.use(
    "/api",
    createApiRoutes(
      {
        askController,
        subjectController,
        ingestionController,
        quizController,
        meController
      },
      requireAuth
    )
  );

  app.get(["/api", "/"], (_req: Request, res: Response) => {
    res.status(200).json({
      service: "askmynotes-backend",
      routes: [
        "GET /api/health",
        "GET /api/subjects",
        "POST /api/subjects",
        "GET /api/subjects/:subjectId/files",
        "POST /api/subjects/:subjectId/files",
        "GET /api/me",
        "POST /api/ask",
        "POST /api/ask/stream",
        "ALL /api/auth/*"
      ]
    });
  });

  app.get(["/health", "/api/health"], (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      service: "askmynotes-backend",
      timestamp: new Date().toISOString()
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ error: message });
  });

  return {
    app,
    stop: async () => {
      await prismaProvider.disconnect();
    },
    services: {
      auth,
      cragPipeline,
      subjectRepository,
      threadRepository
    }
  };
}

const { app } = createApp();
export default app;
