import { ApiProperty } from '@nestjs/swagger';
import { ContentType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Payload untuk konten teks atau attach URL. Kecocokan tipe dengan isi payload
 * (URL harus valid untuk selain teks) diperiksa di ContentsService.
 */
export class CreateContentDto {
  @ApiProperty({ example: 'Promo Akhir Tahun', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  judul!: string;

  @ApiProperty({ enum: ContentType, example: ContentType.text })
  @IsEnum(ContentType)
  tipe!: ContentType;

  @ApiProperty({
    description: 'Isi teks bila tipe = text, selain itu URL (http/https)',
    example: 'Diskon 50% semua menu!',
  })
  @IsString()
  @IsNotEmpty()
  payload!: string;
}
