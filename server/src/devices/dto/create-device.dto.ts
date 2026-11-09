import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Payload pembuatan device. Status dan last_seen sengaja tidak ada di sini:
 * keduanya dikelola otomatis oleh presence (WebSocket), bukan diisi manual.
 */
export class CreateDeviceDto {
  @ApiProperty({ example: 'Layar Lobi', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nama!: string;

  @ApiProperty({ example: 'Lobi Lt.1', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lokasi!: string;
}