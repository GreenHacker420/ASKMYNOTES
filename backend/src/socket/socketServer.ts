import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { z } from "zod";
import { fromNodeHeaders } from "better-auth/node";
import type { BetterAuthInstance } from "../services/auth/auth";
import type { CragPipelineService } from "../services/crag/CragPipelineService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { AskRequest } from "../types/crag";
import { GoogleGenAI, Modality, Type } from "@google/genai";

const askSchema = z.object({
  question: z.string().min(1),
  subjectId: z.string().min(1),
  threadId: z.string().min(1),
  subjectName: z.string().min(1).optional(),
  requestId: z.string().min(1).optional()
});

const voiceStartSchema = z.object({
  subjectId: z.string().min(1),
  threadId: z.string().min(1),
  subjectName: z.string().min(1).optional()
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

  /* ------------------------------------------------------------------ */
  /*  CRAG function declaration for Gemini Live API tool use            */
  /* ------------------------------------------------------------------ */
  const searchNotesFunction = {
    name: "search_notes",
    description: "Search the student's uploaded notes and documents to find relevant information for answering their question. Always use this tool when the student asks a question about their study material.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "The search query to find relevant information in the student's notes"
        }
      },
      required: ["query"]
    }
  };

  io.on("connection", (socket) => {
    const userId = socket.data.authUser?.id as string | undefined;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
    console.log("[socket] connected", socket.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let liveSession: any = null;
    let liveReady = false;
    let liveSessionInfo: { subjectId: string; threadId: string } | null = null;

    /* ---- Chat (text) handler ---- */
    socket.on("ask", async (payload) => {
      const parsed = askSchema.safeParse(payload);
      const requestId = parsed.success ? parsed.data.requestId : undefined;

      if (!parsed.success) {
        socket.emit("ask:error", { requestId, error: "Invalid request" });
        return;
      }

      try {
        const subject = await options.subjectRepository.findById(parsed.data.subjectId, userId);
        if (!subject) {
          socket.emit("ask:error", { requestId, error: "Subject not found" });
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
            socket.emit("ask:chunk", { requestId, delta: event.delta });
          } else if (event.type === "final") {
            socket.emit("ask:final", { requestId, response: event.response });
          }
        }
      } catch (error) {
        socket.emit("ask:error", {
          requestId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });

    /* ---- Voice session start ---- */
    socket.on("voice:start", async (payload) => {
      const parsed = voiceStartSchema.safeParse(payload);
      if (!parsed.success) {
        console.log("[voice] invalid start payload", parsed.error.flatten());
        socket.emit("voice:error", { error: "Invalid request" });
        return;
      }

      try {
        console.log("[voice] starting session", {
          socketId: socket.id,
          subjectId: parsed.data.subjectId,
          threadId: parsed.data.threadId
        });

        const subject = await options.subjectRepository.findById(parsed.data.subjectId, userId);
        if (!subject) {
          socket.emit("voice:error", { error: "Subject not found" });
          return;
        }
        liveSessionInfo = { subjectId: parsed.data.subjectId, threadId: parsed.data.threadId };
        const subjectName = parsed.data.subjectName ?? subject.name;

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
            tools: [{ functionDeclarations: [searchNotesFunction] }],
            systemInstruction:
              `You are a voice tutor for the subject "${subjectName}". ` +
              "CRITICAL RULES: " +
              "1. You MUST call the search_notes tool for EVERY question the student asks. No exceptions. " +
              "2. You are FORBIDDEN from answering any question using your own knowledge. You can ONLY use information returned by search_notes. " +
              "3. If search_notes returns no results or an error, say: 'I couldn't find that in your notes. Could you rephrase your question?' " +
              "4. After EVERY answer, you MUST ask: 'Did that make sense? Would you like me to go deeper into any part?' " +
              "5. Explain the search results clearly and naturally as spoken language. Keep answers concise. " +
              "6. Always speak in English. " +
              "7. For greetings and casual conversation, respond naturally without calling the tool."
          },
          callbacks: {
            onopen: () => {
              console.log("[voice] live session opened", socket.id);
            },
            onmessage: async (message: any) => {
              /* ---------- Handle tool calls (CRAG function calling) ---------- */
              if (message.toolCall) {
                console.log("[voice] toolCall received", {
                  socketId: socket.id,
                  calls: message.toolCall.functionCalls?.map((fc: any) => ({
                    name: fc.name,
                    args: fc.args
                  }))
                });

                const functionResponses: Array<{
                  id: string;
                  name: string;
                  response: Record<string, unknown>;
                }> = [];

                for (const fc of message.toolCall.functionCalls ?? []) {
                  if (fc.name === "search_notes" && liveSessionInfo) {
                    const query = fc.args?.query ?? "";
                    console.log("[voice] running CRAG for:", query);

                    try {
                      const askRequest: AskRequest = {
                        question: query,
                        subjectId: liveSessionInfo.subjectId,
                        threadId: liveSessionInfo.threadId,
                        subjectName
                      };
                      const response = await options.cragPipeline.ask(askRequest);
                      console.log("[voice] CRAG result length:", response.answer.length);

                      socket.emit("voice:answer", {
                        text: response.answer,
                        citations: response.citations,
                        confidence: response.confidence,
                        evidence: response.evidence,
                        found: response.found
                      });

                      functionResponses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { result: response.answer }
                      });
                    } catch (err) {
                      console.error("[voice] CRAG failed:", err);
                      functionResponses.push({
                        id: fc.id,
                        name: fc.name,
                        response: { error: "Failed to search notes. Please try again." }
                      });
                    }
                  }
                }

                if (functionResponses.length > 0 && liveSession) {
                  console.log("[voice] sending tool response");
                  liveSession.sendToolResponse({ functionResponses });
                }
                return;
              }

              /* ---------- Handle regular server content ---------- */
              const transcriptChunk = message.serverContent?.inputTranscription?.text ?? "";
              const outputTranscriptChunk = message.serverContent?.outputTranscription?.text ?? "";
              const audioParts = (message.serverContent?.modelTurn?.parts ?? []).filter(
                (p: any) => p.inlineData?.data
              );
              const hasTurnComplete = !!message.serverContent?.turnComplete;
              const hasGenComplete = !!message.serverContent?.generationComplete;

              // Log only when there's meaningful content
              if (transcriptChunk || outputTranscriptChunk || audioParts.length || hasTurnComplete || hasGenComplete) {
                console.log("[voice] onmessage", {
                  socketId: socket.id,
                  transcript: transcriptChunk || undefined,
                  outputTranscript: outputTranscriptChunk || undefined,
                  audioChunks: audioParts.length,
                  turnComplete: hasTurnComplete || undefined,
                  genComplete: hasGenComplete || undefined
                });
              }

              if (transcriptChunk) {
                socket.emit("voice:transcript", { text: transcriptChunk });
              }

              if (outputTranscriptChunk) {
                socket.emit("voice:output-transcript", { text: outputTranscriptChunk });
              }

              for (const part of audioParts) {
                if (part.inlineData?.data) {
                  socket.emit("voice:audio", {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType ?? "audio/pcm;rate=24000"
                  });
                }
              }

              if (message.serverContent?.interrupted) {
                console.log("[voice] interrupted");
                socket.emit("voice:interrupted", {});
              }

              if (hasTurnComplete || hasGenComplete) {
                socket.emit("voice:final", {});
              }
            },
            onerror: (e: any) => {
              console.error("[voice] live API error", e);
              socket.emit("voice:error", { error: e?.message ?? "Voice error" });
            },
            onclose: (e: any) => {
              console.log("[voice] live session closed", e?.reason ?? "no reason");
              liveReady = false;
            }
          }
        });

        liveReady = true;
        console.log("[voice] session ready with search_notes tool");
        socket.emit("voice:ready");

        // Greeting — model will speak naturally
        if (liveSession) {
          liveSession.sendClientContent({
            turns: [{
              role: "user",
              parts: [{ text: `Greet the student briefly. Tell them you are their ${subjectName} tutor and you'll search their notes to answer questions. Keep it to one sentence.` }]
            }],
            turnComplete: true
          });
        }
      } catch (error) {
        console.error("[voice] start failed", error);
        socket.emit("voice:error", {
          error: error instanceof Error ? error.message : "Voice start failed"
        });
      }
    });

    /* ---- Voice audio streaming ---- */
    socket.on("voice:audio", (payload) => {
      if (!liveSession || !liveReady) return;

      if (payload?.audioStreamEnd) {
        console.log("[voice] audioStreamEnd", socket.id);
        liveSession.sendRealtimeInput({ audioStreamEnd: true });
        return;
      }

      if (!payload?.data) return;
      liveSession.sendRealtimeInput({
        audio: {
          data: payload.data,
          mimeType: payload.mimeType ?? "audio/pcm;rate=16000"
        }
      });
    });

    /* ---- Voice session stop ---- */
    socket.on("voice:stop", () => {
      console.log("[voice] stop session", socket.id);
      if (liveSession) {
        try { liveSession.close(); } catch { /* ignore */ }
      }
      liveSession = null;
      liveReady = false;
      liveSessionInfo = null;
      socket.emit("voice:ended");
    });

    /* ---- Socket disconnect ---- */
    socket.on("disconnect", () => {
      console.log("[socket] disconnected", socket.id);
      if (liveSession) {
        try { liveSession.close(); } catch { /* ignore */ }
      }
      liveSession = null;
      liveReady = false;
      liveSessionInfo = null;
    });
  });

  return io;
}
