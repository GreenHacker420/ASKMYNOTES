import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { CragPipelineService } from "../services/crag/CragPipelineService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { AuthenticatedRequest } from "../services/auth/requireAuth";
import type { AskRequest } from "../types/crag";
import type { GeminiLiveClient } from "./geminiLiveClient";

const voiceJsonSchema = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1),
  subjectId: z.string().min(1),
  threadId: z.string().min(1),
  subjectName: z.string().min(1).optional()
});

export interface VoiceControllerOptions {
  cragPipeline: CragPipelineService;
  subjectRepository: SubjectRepository;
  geminiLiveClient: GeminiLiveClient;
}

export class VoiceController {
  private readonly options: VoiceControllerOptions;

  constructor(options: VoiceControllerOptions) {
    this.options = options;
  }

  query = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.authUser?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const payload = this.resolvePayload(req);
      if (!payload) {
        res.status(400).json({ error: "Invalid request" });
        return;
      }

      const subject = await this.options.subjectRepository.findById(payload.subjectId, userId);
      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }

      const transcript = await this.options.geminiLiveClient.transcribeAudio({
        audioBuffer: payload.audioBuffer,
        mimeType: payload.mimeType
      });

      if (!transcript) {
        res.status(422).json({ error: "Unable to transcribe audio" });
        return;
      }

      const askRequest: AskRequest = {
        question: transcript,
        subjectId: payload.subjectId,
        threadId: payload.threadId,
        subjectName: payload.subjectName ?? subject.name
      };

      const response = await this.options.cragPipeline.ask(askRequest);
      const speech = await this.options.geminiLiveClient.textToSpeech(response.answer);

      res.setHeader("Content-Type", speech.mimeType);
      res.setHeader("X-Transcript", transcript);
      res.setHeader("X-Answer", response.answer);
      res.status(200).send(speech.audioBuffer);
    } catch (error) {
      next(error);
    }
  };

  speak = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.authUser?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
      if (!text) {
        res.status(400).json({ error: "text is required" });
        return;
      }

      const speech = await this.options.geminiLiveClient.textToSpeech(text);
      res.setHeader("Content-Type", speech.mimeType);
      res.setHeader("X-Answer", text);
      res.status(200).send(speech.audioBuffer);
    } catch (error) {
      next(error);
    }
  };

  private resolvePayload(req: Request): {
    audioBuffer: Buffer;
    mimeType: string;
    subjectId: string;
    threadId: string;
    subjectName?: string;
  } | null {
    if (req.is("application/json")) {
      const parsed = voiceJsonSchema.safeParse(req.body);
      if (!parsed.success) {
        return null;
      }

      const { audioBase64, mimeType, subjectId, threadId, subjectName } = parsed.data;
      return {
        audioBuffer: Buffer.from(audioBase64, "base64"),
        mimeType,
        subjectId,
        threadId,
        subjectName
      };
    }

    if (!Buffer.isBuffer(req.body)) {
      return null;
    }

    const subjectId = this.readParam(req, "subjectId");
    const threadId = this.readParam(req, "threadId");
    if (!subjectId || !threadId) {
      return null;
    }

    return {
      audioBuffer: req.body,
      mimeType: req.headers["content-type"]?.toString() ?? "application/octet-stream",
      subjectId,
      threadId,
      subjectName: this.readParam(req, "subjectName")
    };
  }

  private readParam(req: Request, name: string): string | undefined {
    const headerKey = `x-${name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`;
    const headerValue = req.headers[headerKey]?.toString();
    if (headerValue) {
      return headerValue;
    }

    const queryValue = req.query[name];
    if (typeof queryValue === "string") {
      return queryValue;
    }

    return undefined;
  }
}
