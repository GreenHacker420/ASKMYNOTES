import type { PrismaClient } from "../../../generated/prisma/client";

export class ThreadRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async ensureThread(threadId: string, subjectId: string): Promise<void> {
    const existing = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, subjectId: true }
    });

    if (!existing) {
      await this.prisma.thread.create({
        data: { id: threadId, subjectId }
      });
      return;
    }

    if (existing.subjectId !== subjectId) {
      throw new Error("Thread does not belong to this subject.");
    }

    await this.prisma.thread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() }
    });
  }
}
