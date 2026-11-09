import { Module } from '@nestjs/common';
import { ContentsModule } from '../contents/contents.module';
import { DevicesModule } from '../devices/devices.module';
import { PresenceModule } from '../presence/presence.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommandsController } from './commands.controller';
import { CommandsService } from './commands.service';

@Module({
  imports: [DevicesModule, ContentsModule, PresenceModule, RealtimeModule],
  controllers: [CommandsController],
  providers: [CommandsService],
})
export class CommandsModule {}
