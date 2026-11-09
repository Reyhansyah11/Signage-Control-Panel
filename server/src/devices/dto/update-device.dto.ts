import { PartialType } from '@nestjs/swagger';
import { CreateDeviceDto } from './create-device.dto';

/** Semua field opsional; aturan validasinya diwarisi dari CreateDeviceDto. */
export class UpdateDeviceDto extends PartialType(CreateDeviceDto) {}