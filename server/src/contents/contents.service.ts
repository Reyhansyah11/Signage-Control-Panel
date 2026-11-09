import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Content, ContentType } from '@prisma/client';
import { StorageService } from '../storage/storage.service';
import { ContentsRepository } from './contents.repository';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UploadContentDto } from './dto/upload-content.dto';

/** Logika bisnis konten, termasuk aturan kecocokan tipe dan payload. */
@Injectable()
export class ContentsService {
  constructor(
    private readonly contentsRepository: ContentsRepository,
    private readonly storageService: StorageService,
  ) {}

  findAll(): Promise<Content[]> {
    return this.contentsRepository.findAll();
  }

  /** @throws NotFoundException bila konten tidak ditemukan. */
  async findOne(id: string): Promise<Content> {
    const content = await this.contentsRepository.findById(id);
    if (!content) {
      throw new NotFoundException(`Konten dengan id ${id} tidak ditemukan`);
    }
    return content;
  }

  create(dto: CreateContentDto): Promise<Content> {
    this.assertPayloadMatchesType(dto.tipe, dto.payload);
    return this.contentsRepository.create(dto);
  }

  /** Mengunggah file ke storage lalu menyimpan URL-nya sebagai payload. */
  async upload(file: Express.Multer.File | undefined, dto: UploadContentDto): Promise<Content> {
    if (!file) {
      throw new BadRequestException('File wajib diunggah pada field "file"');
    }
    const tipe = this.resolveTypeFromMime(file.mimetype);
    const url = await this.storageService.upload(file);
    return this.contentsRepository.create({ judul: dto.judul, tipe, payload: url });
  }

  async update(id: string, dto: UpdateContentDto): Promise<Content> {
    const existing = await this.findOne(id);
    // Digabung dulu dengan data lama: mengubah tipe saja bisa membuat payload tidak valid.
    this.assertPayloadMatchesType(dto.tipe ?? existing.tipe, dto.payload ?? existing.payload);
    return this.contentsRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.contentsRepository.delete(id);
    if (content.tipe !== ContentType.text) {
      await this.storageService.removeByUrl(content.payload);
    }
  }

  private resolveTypeFromMime(mimetype: string): ContentType {
    if (mimetype.startsWith('image/')) return ContentType.image;
    if (mimetype.startsWith('video/')) return ContentType.video;
    throw new BadRequestException('Hanya file gambar atau video yang diperbolehkan');
  }

  /** Selain teks, payload harus berupa URL http/https yang valid. */
  private assertPayloadMatchesType(tipe: ContentType, payload: string): void {
    if (tipe === ContentType.text) return;
    try {
      const { protocol } = new URL(payload);
      if (protocol === 'http:' || protocol === 'https:') return;
    } catch {
      // jatuh ke exception di bawah
    }
    throw new BadRequestException(
      `Payload untuk tipe "${tipe}" harus berupa URL http/https yang valid`,
    );
  }
}
