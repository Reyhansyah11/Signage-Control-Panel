import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { PresenceService } from './presence.service';

@Module({
  imports: [DevicesModule],
  providers: [PresenceService],
  exports: [PresenceService],
})
export class PresenceModule {}
