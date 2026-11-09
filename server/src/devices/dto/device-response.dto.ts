import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DeviceStatus } from '@prisma/client';

/** Bentuk response device, dipakai khusus untuk dokumentasi Swagger. */
export class DeviceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Layar Lobi' })
  nama!: string;

  @ApiProperty({ example: 'Lobi Lt.1' })
  lokasi!: string;

  @ApiProperty({ enum: DeviceStatus, example: DeviceStatus.offline })
  status!: DeviceStatus;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastSeen!: Date | null;
}