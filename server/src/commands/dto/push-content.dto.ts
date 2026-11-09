import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Payload command push: konten mana yang harus tampil di device sekarang juga. */
export class PushContentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  contentId!: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 3600,
    description: 'Lama tampil (detik) sebelum kembali ke playlist. Kosong = tampil sampai ada command berikutnya.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  durasiDetik?: number;
}
