import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Field teks pada request multipart upload. Filenya sendiri ditangani interceptor. */
export class UploadContentDto {
  @ApiProperty({ example: 'Banner Lobi', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  judul!: string;
}
