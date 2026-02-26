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

  io.on("connection", (socket) => {
    const userId = socket.data.authUser?.id as string | undefined;
    if (!userId) {
      socket.disconnect(true);
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[voice] socket connected", socket.id);

    let liveSession: {
      sendRealtimeInput: (input: Record<string, unknown>) => void;
      sendClientContent: (content: Record<string, unknown>) => void;
      close: () => void;
    } | null = null;
    let liveReady = false;
    let liveSessionInfo: { subjectId: string; threadId: string } | null = null;

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

        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? "" });

        // Accumulate input transcript chunks across messages
        let pendingTranscript = "";

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
              `You are a friendly, patient voice tutor for the subject "${parsed.data.subjectName ?? subject.name}". ` +
              "When the user speaks, you will receive their question as text. " +
              "Read the provided answer text naturally and clearly as spoken language. " +
              "After each answer, ask a brief follow-up question to check understanding."
          },
          callbacks: {
            onopen: () => {
              console.log("[voice] live session opened", socket.id);
            },
            onmessage: async (message) => {
              const transcriptChunk = message.serverContent?.inputTranscription?.text ?? "";
              const outputTranscriptChunk = message.serverContent?.outputTranscription?.text ?? "";
              const audioParts = message.serverContent?.modelTurn?.parts?.filter(
                (p) => p.inlineData?.data
              ) ?? [];
              const hasTurnComplete = !!message.serverContent?.turnComplete;
              const hasGenComplete = !!message.serverContent?.generationComplete;

              console.log("[voice] onmessage", {
                socketId: socket.id,
                transcriptChunk: transcriptChunk || "(none)",
                outputChunk: outputTranscriptChunk || "(none)",
                audioChunks: audioParts.length,
                turnComplete: hasTurnComplete,
                genComplete: hasGenComplete,
                pendingTranscript: pendingTranscript || "(empty)"
              });

              // Accumulate input transcription chunks
              if (transcriptChunk) {
                pendingTranscript += transcriptChunk;
                socket.emit("voice:transcript", { text: pendingTranscript });
              }

              // Forward output transcription (strip "ANSWER:" prefix if present)
              if (outputTranscriptChunk) {
                socket.emit("voice:output-transcript", {
                  text: outputTranscriptChunk
                });
              }

              // Forward audio chunks
              for (const part of audioParts) {
                if (part.inlineData?.data) {
                  socket.emit("voice:audio", {
                    data: part.inlineData.data,
                    mimeType: part.inlineData.mimeType ?? "audio/pcm;rate=24000"
                  });
                }
              }

              // Handle interruptions
              if (message.serverContent?.interrupted) {
                console.log("[voice] interrupted, clearing playback");
                pendingTranscript = "";
                socket.emit("voice:interrupted", {});
              }

              if (hasTurnComplete || hasGenComplete) {
                socket.emit("voice:final", {});
              }

              // When the user's turn completes, run CRAG with accumulated transcript
              if (hasTurnComplete && pendingTranscript.trim()) {
                const question = pendingTranscript.trim();
                pendingTranscript = ""; // Reset for next turn

                if (!liveSession) return;

                console.log("[voice] running CRAG for:", question);

                try {
                  const askRequest: AskRequest = {
                    question,
                    subjectId: parsed.data.subjectId,
                    threadId: parsed.data.threadId,
                    subjectName: parsed.data.subjectName ?? subject.name
                  };
                  const response = await options.cragPipeline.ask(askRequest);
                  socket.emit("voice:answer", { text: response.answer });
                  console.log("[voice] sending CRAG answer to live session, length:", response.answer.length);

                  // Feed the CRAG answer to the model so it speaks it
                  if (liveSession) {
                    liveSession.sendClientContent({
                      turns: [
                        { role: "user", parts: [{ text: `Here is the answer to read to the student: ${response.answer}` }] }
                      ],
                      turnComplete: true
                    });
                  }
                } catch (err) {
                  console.error("[voice] CRAG failed:", err);
                  socket.emit("voice:error", { error: "Failed to get answer from notes" });
                }
              }
            },
            onerror: (e) => {
              console.error("[voice] live API error", e);
              socket.emit("voice:error", { error: e?.message ?? "Voice error" });
            },
            onclose: (e) => {
              console.log("[voice] live session closed", e?.reason ?? "no reason");
            }
          }
        });

        liveReady = true;
        console.log("[voice] session ready, sending greeting");
        socket.emit("voice:ready");

        // Send initial greeting for the model to speak
        if (liveSession) {
          liveSession.sendClientContent({
            turns: [{ role: "user", parts: [{ text: `Greet the student briefly. Tell them you're their ${parsed.data.subjectName ?? subject.name} tutor and they can ask questions about their notes.` }] }],
            turnComplete: true
          });
        }
      } catch (error) {
        console.error("[voice] start failed", error);
        socket.emit("voice:error", { error: error instanceof Error ? error.message : "Voice start failed" });
      }
    });

    socket.on("voice:audio", (payload) => {
      if (!liveSession || !liveReady) return;

      // Handle audioStreamEnd (user stopped recording, flush buffered audio)
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

    socket.on("voice:stop", () => {
      if (!liveSession) return;
      console.log("[voice] stop session", socket.id);
      liveSession.sendRealtimeInput({ audioStreamEnd: true });
      liveSession.close();
      liveSession = null;
      liveReady = false;
    });

    socket.on("disconnect", () => {
      console.log("[voice] socket disconnected", socket.id);
      if (liveSession) {
        liveSession.close();
      }
      liveSession = null;
      liveReady = false;
    });
  });

  return io;
}
