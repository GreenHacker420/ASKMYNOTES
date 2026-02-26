import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import { buildCragConfig } from "../config/cragConfig";
import { loadAppEnv } from "../config/env";
import { CragPipelineService } from "../services/crag/CragPipelineService";
import { GeminiLangChainClient } from "../services/llm/GeminiLangChainClient";
import { LangGraphPostgresMemoryService } from "../services/memory/LangGraphPostgresMemoryService";
import { PineconeClientFactory } from "../services/pinecone/PineconeClientFactory";
import { PostProcessor } from "../services/postprocess/PostProcessor";
import { PromptBuilder } from "../services/prompt/PromptBuilder";
import { PrismaClientProvider } from "../services/prisma/PrismaClientProvider";
import { Reranker } from "../services/retrieval/Reranker";
import { SubjectScopedRetriever } from "../services/retrieval/SubjectScopedRetriever";
import { PdfIngestionService } from "../services/ingestion/PdfIngestionService";

dotenv.config();

interface CliArgs {
  file: string;
  question: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  threadId: string;
}

function parseArgs(argv: string[]): CliArgs {
  const map = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key.startsWith("--") || !value) {
      continue;
    }
    map.set(key.slice(2), value);
  }

  const file = map.get("file");
  const question = map.get("question");
  const userId = map.get("userId") ?? "demo-user";
  const subjectId = map.get("subjectId") ?? "demo-subject";
  const subjectName = map.get("subjectName") ?? "Demo Subject";
  const threadId = map.get("threadId") ?? `thread-${randomUUID()}`;

  if (!file) {
    throw new Error("Missing required argument --file /absolute/path/to/file.pdf");
  }

  if (!question) {
    throw new Error("Missing required argument --question \"your question\"");
  }

  return {
    file,
    question,
    userId,
    subjectId,
    subjectName,
    threadId
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = loadAppEnv();
  const config = buildCragConfig(env);

  const prismaProvider = new PrismaClientProvider(env.databaseUrl);
  const prisma = prismaProvider.getClient();

  await prisma.user.upsert({
    where: { id: args.userId },
    update: {},
    create: {
      id: args.userId,
      name: "Demo User",
      email: `${args.userId}@example.com`
    }
  });

  const pinecone = new PineconeClientFactory({ apiKey: env.pineconeApiKey }).createClient();

  const ingestionService = new PdfIngestionService({
    prisma,
    pinecone,
    pineconeIndex: env.pineconeIndex,
    googleApiKey: env.googleApiKey,
    chunkSize: env.chunkSize,
    chunkOverlap: env.chunkOverlap
  });

  const ingestion = await ingestionService.ingestPdf({
    filePath: args.file,
    userId: args.userId,
    subjectId: args.subjectId,
    subjectName: args.subjectName
  });

  const retriever = new SubjectScopedRetriever({
    pinecone,
    pineconeIndexName: env.pineconeIndex,
    googleApiKey: env.googleApiKey
  });

  const pipeline = new CragPipelineService({
    retriever,
    reranker: new Reranker(),
    promptBuilder: new PromptBuilder(),
    llmClient: new GeminiLangChainClient({
      apiKey: env.googleApiKey,
      model: config.geminiModel,
      temperature: 0
    }),
    postProcessor: new PostProcessor(),
    memoryService: new LangGraphPostgresMemoryService({
      connectionString: env.databaseUrl,
      autoSetup: env.langGraphAutoSetup
    }),
    notFoundThreshold: config.notFoundThreshold,
    topK: config.topK,
    rerankTopN: config.rerankTopN
  });

  const response = await pipeline.ask({
    question: args.question,
    subjectId: args.subjectId,
    subjectName: args.subjectName,
    threadId: args.threadId
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ingestion, response }, null, 2));

  await prismaProvider.disconnect();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
