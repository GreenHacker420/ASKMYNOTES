import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { CragPipelineService } from "../services/crag/CragPipelineService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { ThreadRepository } from "../services/prisma/ThreadRepository";
import type { AuthenticatedRequest } from "../services/auth/requireAuth";
import type { AskRequest } from "../types/crag";

const askSchema = z.object({
  question: z.string().min(1),
  subjectId: z.string().min(1),
  threadId: z.string().min(1),
  subjectName: z.string().min(1).optional()
});

export interface AskControllerOptions {
  cragPipeline: CragPipelineService;
  subjectRepository: SubjectRepository;
  threadRepository: ThreadRepository;
}

// Text enters: /api/ask and /api/ask/stream -> AskController -> CragPipelineService.ask
// Text leaves: JSON response (ask) or SSE chunks + final event (askStream) -> HTTP response
// Best voice injection point: call CragPipelineService.ask with AskRequest (after auth + subject validation)
export class AskController {
  private readonly options: AskControllerOptions;

  constructor(options: AskControllerOptions) {
    this.options = options;
  }

  ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.resolveAskRequest(req, res);
      if (!request) {
        return;
      }

      const response = await this.options.cragPipeline.ask(request);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  askStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const request = await this.resolveAskRequest(req, res);
      if (!request) {
        return;
      }

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const response = await this.options.cragPipeline.ask(request);

      if (!response.found) {
        res.write(`event: final\ndata: ${JSON.stringify(response)}\n\n`);
        res.end();
        return;
      }

      const chunks = this.chunkText(response.answer, 80);
      for (const chunk of chunks) {
        res.write(`event: chunk\ndata: ${JSON.stringify({ delta: chunk })}\n\n`);
      }

      res.write(`event: final\ndata: ${JSON.stringify(response)}\n\n`);
      res.end();
    } catch (error) {
      try {
        res.write(`event: error\ndata: ${JSON.stringify({ error: "Streaming failed." })}\n\n`);
        res.end();
      } catch {
        // no-op
      }
      next(error);
    }
  };

  private async resolveAskRequest(req: Request, res: Response): Promise<AskRequest | null> {
    const parsed = askSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
      return null;
    }

    const typedReq = req as AuthenticatedRequest;
    const userId = typedReq.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return null;
    }

    const payload = parsed.data;
    const subject = await this.options.subjectRepository.findById(payload.subjectId, userId);
    if (!subject) {
      res.status(404).json({ error: "Subject not found" });
      return null;
    }

    await this.options.threadRepository.ensureThread(payload.threadId, payload.subjectId);

    return {
      question: payload.question,
      subjectId: payload.subjectId,
      threadId: payload.threadId,
      subjectName: payload.subjectName ?? subject.name
    };
  }

  private chunkText(input: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let index = 0; index < input.length; index += chunkSize) {
      chunks.push(input.slice(index, index + chunkSize));
    }
    return chunks.length === 0 ? [""] : chunks;
  }
}
