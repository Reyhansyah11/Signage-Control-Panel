import { Module } from '@nestjs/common';
import { PresenceModule } from '../presence/presence.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [PresenceModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway], // dipakai modul playlist untuk push konten
})
export class RealtimeModule {}
