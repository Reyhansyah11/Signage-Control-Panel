import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';

/** Bentuk response konten, dipakai untuk dokumentasi Swagger. */
export class ContentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Banner Lobi' })
  judul!: string;

  @ApiProperty({ enum: ContentType })
  tipe!: ContentType;

  @ApiProperty({ description: 'Teks, atau URL file/halaman' })
  payload!: string;

  @ApiProperty()
  createdAt!: Date;
}
