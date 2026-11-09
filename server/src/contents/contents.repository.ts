import { Injectable } from '@nestjs/common';
import { Content, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Satu-satunya kelas yang berbicara ke tabel `contents`. */
@Injectable()
export class ContentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Content[]> {
    return this.prisma.content.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findById(id: string): Promise<Content | null> {
    return this.prisma.content.findUnique({ where: { id } });
  }

  create(data: Prisma.ContentCreateInput): Promise<Content> {
    return this.prisma.content.create({ data });
  }

  update(id: string, data: Prisma.ContentUpdateInput): Promise<Content> {
    return this.prisma.content.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.content.delete({ where: { id } });
  }
}
