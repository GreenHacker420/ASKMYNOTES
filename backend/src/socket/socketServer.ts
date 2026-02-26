import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import type { BetterAuthInstance } from "../services/auth/auth";
import type { CragPipelineService } from "../services/crag/CragPipelineService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { AskRequest } from "../types/crag";

const askSchema = z.object({
  question: z.string().min(1),
  subjectId: z.string().min(1),
  threadId: z.string().min(1),
  subjectName: z.string().min(1).optional(),
  requestId: z.string().min(1).optional()
});

export interface SocketServerOptions {
  httpServer: HttpServer;
  auth: BetterAuthInstance;
  cragPipeline: CragPipelineService;
  subjectRepository: SubjectRepository;
}

export function createSocketServer(options: SocketServerOptions): Server {
  const io = new Server(options.httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const sessionResult = await options.auth.api.getSession({
        headers: fromNodeHeaders({
          cookie: socket.handshake.headers.cookie ?? ""
        })
      });

      if (!sessionResult || !("session" in sessionResult) || !sessionResult.session) {
        return next(new Error("Unauthorized"));
      }

      socket.data.authUser = "user" in sessionResult ? sessionResult.user : undefined;
      socket.data.authSession = sessionResult.session;
      return next();
    } catch (error) {
      return next(error as Error);
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.authUser?.id as string | undefined;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    socket.on("ask", async (payload) => {
      const parsed = askSchema.safeParse(payload);
      const requestId = parsed.success ? parsed.data.requestId : undefined;

      if (!parsed.success) {
        socket.emit("ask:error", {
          requestId,
          error: "Invalid request"
        });
        return;
      }

      try {
        const subject = await options.subjectRepository.findById(parsed.data.subjectId, userId);
        if (!subject) {
          socket.emit("ask:error", {
            requestId,
            error: "Subject not found"
          });
          return;
        }

        const askRequest: AskRequest = {
          question: parsed.data.question,
          subjectId: parsed.data.subjectId,
          threadId: parsed.data.threadId,
          subjectName: parsed.data.subjectName ?? subject.name
        };

        const response = await options.cragPipeline.ask(askRequest);

        if (response.found) {
          const chunks = chunkText(response.answer, 80);
          for (const chunk of chunks) {
            socket.emit("ask:chunk", {
              requestId,
              delta: chunk
            });
          }
        }

        socket.emit("ask:final", {
          requestId,
          response
        });
      } catch (error) {
        socket.emit("ask:error", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
  });

  return io;
}

function chunkText(input: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < input.length; index += chunkSize) {
    chunks.push(input.slice(index, index + chunkSize));
  }
  return chunks.length === 0 ? [""] : chunks;
}
