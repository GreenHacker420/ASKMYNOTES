import type { PrismaClient } from "@prisma/client";

export interface SubjectRecord {
  id: string;
  name: string;
}

export class SubjectRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findById(subjectId: string): Promise<SubjectRecord | null> {
    const row = await this.prisma.subject.findUnique({
      where: { id: subjectId },
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
