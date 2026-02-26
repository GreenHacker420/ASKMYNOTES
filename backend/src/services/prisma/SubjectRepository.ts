import type { PrismaClient } from "../../../generated/prisma/client";

export interface SubjectRecord {
  id: string;
  name: string;
}

export class SubjectRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(subjectId: string, userId: string): Promise<SubjectRecord | null> {
    const row = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
      select: { id: true, name: true }
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name
    };
  }
}
