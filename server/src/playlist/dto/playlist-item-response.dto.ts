import { ApiProperty } from '@nestjs/swagger';
import { ContentResponseDto } from '../../contents/dto/content-response.dto';

/** Bentuk response entri playlist, dipakai untuk dokumentasi Swagger. */
export class PlaylistItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 0, description: 'Posisi dalam playlist, dimulai dari 0' })
  urutan!: number;

  @ApiProperty({ example: 10 })
  durasiDetik!: number;

  @ApiProperty({ type: ContentResponseDto })
  content!: ContentResponseDto;
}
