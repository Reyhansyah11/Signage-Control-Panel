import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Satu baris playlist pada request. Urutan ditentukan oleh posisinya di array. */
export class PlaylistItemInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  contentId!: string;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 3600, description: 'Lama tampil (detik)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  durasiDetik: number = 10;
}
