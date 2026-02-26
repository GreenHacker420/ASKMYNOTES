import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import type { BetterAuthInstance } from "../services/auth/auth";
import type { CragPipelineService } from "../services/crag/CragPipelineService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { AskRequest } from "../types/crag";
import { GoogleGenAI, Modality } from "@google/genai";

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

    let liveSession: {
      sendRealtimeInput: (input: Record<string, unknown>) => void;
      sendClientContent: (content: Record<string, unknown>) => void;
      close: () => void;
    } | null = null;
    let liveReady = false;

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

        for await (const event of options.cragPipeline.askStream(askRequest)) {
          if (event.type === "chunk") {
            socket.emit("ask:chunk", {
              requestId,
              delta: event.delta
            });
          } else if (event.type === "final") {
            socket.emit("ask:final", {
              requestId,
              response: event.response
            });
          }
        }
      } catch (error) {
        socket.emit("ask:error", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    socket.on("voice:start", async (payload) => {
      const parsed = askSchema.safeParse(payload);
      if (!parsed.success) {
        socket.emit("voice:error", { error: "Invalid request" });
        return;
      }

      try {
        const subject = await options.subjectRepository.findById(parsed.data.subjectId, userId);
        if (!subject) {
          socket.emit("voice:error", { error: "Subject not found" });
          return;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? "" });
        liveSession = await ai.live.connect({
          model: process.env.GEMINI_LIVE_AUDIO_MODEL ?? "gemini-2.5-flash-native-audio-preview-12-2025",
          config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: process.env.GEMINI_LIVE_VOICE ?? "Kore"
                }
              }
            },
            systemInstruction:
              "You are a patient teacher. Do not answer user audio directly. Wait for messages that start with 'ANSWER:' and speak that text clearly. After each answer, end with a short check-in question."
          },
          callbacks: {
            onmessage: async (message) => {
              if (message.serverContent?.inputTranscription?.text) {
                socket.emit("voice:transcript", {
                  text: message.serverContent.inputTranscription.text
                });
              }

              const parts = message.serverContent?.modelTurn?.parts ?? [];
              for (const part of parts) {
                if (part.inlineData?.data) {
                  socket.emit("voice:audio", {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType ?? "audio/pcm;rate=24000"
                  });
                }
              }

              if (message.serverContent?.turnComplete || message.serverContent?.generationComplete) {
                socket.emit("voice:final", {});
              }

              // When a transcript completes, run CRAG and send ANSWER text into live session.
              if (message.serverContent?.turnComplete && message.serverContent?.inputTranscription?.text) {
                const question = message.serverContent.inputTranscription.text.trim();
                if (!question || !liveSession) return;

                const askRequest: AskRequest = {
                  question,
                  subjectId: parsed.data.subjectId,
                  threadId: parsed.data.threadId,
                  subjectName: parsed.data.subjectName ?? subject.name
                };
                const response = await options.cragPipeline.ask(askRequest);
                const answer = `ANSWER: ${response.answer}`;
                await liveSession.sendClientContent({
                  turns: [
                    { role: "user", parts: [{ text: answer }] }
                  ],
                  turnComplete: true
                });
              }
            },
            onerror: (e) => socket.emit("voice:error", { error: e?.message ?? "Voice error" })
          }
        });

        liveReady = true;
        socket.emit("voice:ready");
      } catch (error) {
        socket.emit("voice:error", { error: error instanceof Error ? error.message : "Voice start failed" });
      }
    });

    socket.on("voice:audio", async (payload) => {
      if (!liveSession || !liveReady) return;
      if (!payload?.data) return;
      await liveSession.sendRealtimeInput({
        audio: {
          data: payload.data,
          mimeType: payload.mimeType ?? "audio/pcm;rate=16000"
        }
      });
    });

    socket.on("voice:stop", async () => {
      if (!liveSession) return;
      await liveSession.sendRealtimeInput({ audioStreamEnd: true });
      liveSession.close();
      liveSession = null;
      liveReady = false;
    });

    socket.on("disconnect", () => {
      if (liveSession) {
        liveSession.close();
      }
      liveSession = null;
      liveReady = false;
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
