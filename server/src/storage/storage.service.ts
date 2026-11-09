import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

/**
 * Pembungkus Supabase Storage. Dipisah dari ContentsService agar penyedia
 * penyimpanan bisa diganti tanpa menyentuh logika bisnis konten.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(config: ConfigService) {
    this.client = createClient(
      config.getOrThrow<string>('SUPABASE_URL'),
      config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    );
    this.bucket = config.get<string>('SUPABASE_BUCKET', 'contents');
  }

  /** Mengunggah file dan mengembalikan URL publiknya. */
  async upload(file: Express.Multer.File): Promise<string> {
    // Nama acak mencegah tabrakan dan menghindari karakter aneh dari nama asli.
    const path = `${randomUUID()}${extname(file.originalname).toLowerCase()}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype });

    if (error) {
      this.logger.error(`Upload gagal: ${error.message}`);
      throw new InternalServerErrorException('Gagal mengunggah file ke storage');
    }

    return this.client.storage.from(this.bucket).getPublicUrl(path).data.publicUrl;
  }

  /**
   * Menghapus file berdasarkan URL publiknya. Bersifat best-effort: kegagalan
   * hanya dicatat, supaya penghapusan konten di database tidak ikut gagal.
   * URL yang bukan milik bucket ini (konten attach dari luar) diabaikan.
   */
  async removeByUrl(publicUrl: string): Promise<void> {
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const index = publicUrl.indexOf(marker);
    if (index === -1) return;

    const path = decodeURIComponent(publicUrl.slice(index + marker.length));
    const { error } = await this.client.storage.from(this.bucket).remove([path]);
    if (error) {
      this.logger.warn(`Gagal menghapus file ${path}: ${error.message}`);
    }
  }
}
