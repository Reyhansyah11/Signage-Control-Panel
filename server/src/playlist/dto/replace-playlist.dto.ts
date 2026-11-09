import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { PlaylistItemInputDto } from './playlist-item-input.dto';

/** Mengganti seluruh playlist sebuah device. Array kosong berarti mengosongkan playlist. */
export class ReplacePlaylistDto {
  @ApiProperty({ type: [PlaylistItemInputDto], maxItems: 50 })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PlaylistItemInputDto)
  items!: PlaylistItemInputDto[];
}
