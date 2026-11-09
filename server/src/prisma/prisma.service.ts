import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Pembungkus tunggal PrismaClient.
 * Seluruh akses database lewat repository memakai service ini,
 * sehingga koneksi dikelola di satu tempat.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_DELAY_MS = 2000;

  private readonly logger = new Logger(PrismaService.name);

  /**
   * Mencoba terhubung beberapa kali sebelum menyerah. Koneksi ke database
   * cloud bisa gagal sesaat (jaringan tidak stabil), dan itu tidak perlu
   * mematikan aplikasi pada percobaan pertama.
   */
  async onModuleInit(): Promise<void> {
    for (let attempt = 1; attempt <= PrismaService.MAX_RETRIES; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Terhubung ke database');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message.split('\n')[0] : String(error);
        this.logger.warn(
          `Gagal terhubung (percobaan ${attempt}/${PrismaService.MAX_RETRIES}): ${message}`,
        );
        if (attempt === PrismaService.MAX_RETRIES) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, PrismaService.RETRY_DELAY_MS));
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}