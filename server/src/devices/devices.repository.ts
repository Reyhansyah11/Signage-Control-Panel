import { Injectable } from '@nestjs/common';
import { Device, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Satu-satunya kelas yang berbicara ke tabel `devices`.
 * Jika ORM diganti, hanya lapisan ini yang berubah.
 */
@Injectable()
export class DevicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Device[]> {
    return this.prisma.device.findMany({ orderBy: { nama: 'asc' } });
  }

  findById(id: string): Promise<Device | null> {
    return this.prisma.device.findUnique({ where: { id } });
  }

  create(data: Prisma.DeviceCreateInput): Promise<Device> {
    return this.prisma.device.create({ data });
  }

  update(id: string, data: Prisma.DeviceUpdateInput): Promise<Device> {
    return this.prisma.device.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.device.delete({ where: { id } });
  }
}