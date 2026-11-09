import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommandsModule } from './commands/commands.module';
import { ContentsModule } from './contents/contents.module';
import { DevicesModule } from './devices/devices.module';
import { PlaylistModule } from './playlist/playlist.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DevicesModule,
    ContentsModule,
    RealtimeModule,
    PlaylistModule,
    CommandsModule,
  ],
})
export class AppModule {}
