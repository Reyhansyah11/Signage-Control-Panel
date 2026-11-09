import { IsUUID } from 'class-validator';

/** Payload event `device:register`. */
export class RegisterDeviceDto {
  @IsUUID()
  deviceId!: string;
}
