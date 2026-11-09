import { Module } from '@nestjs/common';
import { ContentsModule } from '../contents/contents.module';
import { DevicesModule } from '../devices/devices.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PlaylistController } from './playlist.controller';
import { PlaylistRepository } from './playlist.repository';
import { PlaylistService } from './playlist.service';

@Module({
  imports: [DevicesModule, ContentsModule, RealtimeModule],
  controllers: [PlaylistController],
  providers: [PlaylistService, PlaylistRepository],
  exports: [PlaylistService],
})
export class PlaylistModule {}
