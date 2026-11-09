import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Content } from '@prisma/client';
import { ContentsService } from './contents.service';
import { ContentResponseDto } from './dto/content-response.dto';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { UploadContentDto } from './dto/upload-content.dto';

/** Batas ukuran upload; sejalan dengan limit file paket Free Supabase (50 MB). */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Endpoint REST untuk manajemen konten. */
@ApiTags('contents')
@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar semua konten' })
  @ApiOkResponse({ type: [ContentResponseDto] })
  findAll(): Promise<Content[]> {
    return this.contentsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu konten' })
  @ApiOkResponse({ type: ContentResponseDto })
  @ApiNotFoundResponse({ description: 'Konten tidak ditemukan' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Content> {
    return this.contentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat konten teks, atau attach URL gambar/video/halaman' })
  @ApiCreatedResponse({ type: ContentResponseDto })
  @ApiBadRequestResponse({ description: 'Payload tidak cocok dengan tipe' })
  create(@Body() dto: CreateContentDto): Promise<Content> {
    return this.contentsService.create(dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  @ApiOperation({ summary: 'Upload file gambar/video ke storage dan simpan sebagai konten' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'judul'],
      properties: {
        judul: { type: 'string', example: 'Banner Lobi' },
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiCreatedResponse({ type: ContentResponseDto })
  @ApiBadRequestResponse({ description: 'File tidak ada atau bukan gambar/video' })
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadContentDto,
  ): Promise<Content> {
    return this.contentsService.upload(file, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Ubah judul, tipe, atau payload konten' })
  @ApiOkResponse({ type: ContentResponseDto })
  @ApiNotFoundResponse({ description: 'Konten tidak ditemukan' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContentDto,
  ): Promise<Content> {
    return this.contentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hapus konten (beserta filenya di storage bila ada)' })
  @ApiNoContentResponse({ description: 'Konten terhapus' })
  @ApiNotFoundResponse({ description: 'Konten tidak ditemukan' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.contentsService.remove(id);
  }
}
