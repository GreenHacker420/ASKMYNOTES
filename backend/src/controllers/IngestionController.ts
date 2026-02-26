import type { NextFunction, Request, Response } from "express";
import type { Server as SocketIOServer } from "socket.io";
import { z } from "zod";
import type { NotesIngestionService } from "../services/ingestion/NotesIngestionService";
import type { SubjectRepository } from "../services/prisma/SubjectRepository";
import type { AuthenticatedRequest } from "../services/auth/requireAuth";

const paramsSchema = z.object({
  subjectId: z.string().min(1)
});

const uploadSchema = z.object({
  subjectName: z.string().min(1).max(120).optional(),
  fileName: z.string().min(1),
  mimeType: z.string().optional(),
  contentBase64: z.string().min(1)
});

export interface IngestionControllerOptions {
  subjectRepository: SubjectRepository;
  notesIngestionService: NotesIngestionService;
  maxUploadBytes?: number;
}

export class IngestionController {
  private readonly subjectRepository: SubjectRepository;
  private readonly notesIngestionService: NotesIngestionService;
  private readonly maxUploadBytes: number;

  constructor(options: IngestionControllerOptions) {
    this.subjectRepository = options.subjectRepository;
    this.notesIngestionService = options.notesIngestionService;
    this.maxUploadBytes = options.maxUploadBytes ?? 20 * 1024 * 1024;
  }

  uploadFile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const typedReq = req as AuthenticatedRequest;
      const userId = typedReq.authUser?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const parsedParams = paramsSchema.safeParse(req.params);
      if (!parsedParams.success) {
        res.status(400).json({ error: "Invalid subject id", details: parsedParams.error.flatten() });
        return;
      }

      const parsedBody = uploadSchema.safeParse(req.body);
      if (!parsedBody.success) {
        res.status(400).json({ error: "Invalid request", details: parsedBody.error.flatten() });
        return;
      }

      const subjectId = parsedParams.data.subjectId;
      const existingSubject = await this.subjectRepository.findById(subjectId, userId);
      const subjectName = parsedBody.data.subjectName?.trim() ?? existingSubject?.name;

      if (!subjectName) {
        res.status(400).json({ error: "subjectName is required when uploading into a new subject." });
        return;
      }

      const fileBuffer = this.decodeBase64(parsedBody.data.contentBase64);
      if (fileBuffer.length > this.maxUploadBytes) {
        res.status(413).json({ error: `File too large. Max size is ${this.maxUploadBytes} bytes.` });
        return;
      }

      const io: SocketIOServer | undefined = req.app.locals.io;

      const ingestion = await this.notesIngestionService.ingestFile({
        subjectId,
        subjectName,
        userId,
        fileName: parsedBody.data.fileName,
        mimeType: parsedBody.data.mimeType,
        content: fileBuffer,
        onProgress: (step) => {
          if (io) {
            io.emit("ingestion:progress", {
              subjectId,
              fileName: parsedBody.data.fileName,
              step
            });
          }
        }
      });

      res.status(201).json({ ingestion });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[ingestion] upload failed", error);
      next(error);
    }
  };

  private decodeBase64(encoded: string): Buffer {
    const normalized = encoded.includes(",")
      ? encoded.slice(encoded.indexOf(",") + 1)
      : encoded;

    return Buffer.from(normalized, "base64");
  }
}
