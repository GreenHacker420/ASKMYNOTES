import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { CragPipelineService } from "../services/crag/CragPipelineService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { AuthenticatedRequest } from "../services/auth/requireAuth";

const askSchema = z.object({
  question: z.string().min(1),
  subjectId: z.string().min(1),
  threadId: z.string().min(1),
  subjectName: z.string().min(1).optional()
});

export interface AskControllerOptions {
  cragPipeline: CragPipelineService;
  subjectRepository: SubjectRepository;
}

export class AskController {
  private readonly options: AskControllerOptions;

  constructor(options: AskControllerOptions) {
    this.options = options;
  }

  ask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = askSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
        return;
      }

      const typedReq = req as AuthenticatedRequest;
      const userId = typedReq.authUser?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const payload = parsed.data;
      const subject = await this.options.subjectRepository.findById(payload.subjectId, userId);
      if (!subject) {
        res.status(404).json({ error: "Subject not found" });
        return;
      }

      const response = await this.options.cragPipeline.ask({
        question: payload.question,
        subjectId: payload.subjectId,
        threadId: payload.threadId,
        subjectName: payload.subjectName ?? subject.name
      });

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
