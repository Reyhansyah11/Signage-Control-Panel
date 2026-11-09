import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentsModule } from './contents/contents.module';
import { DevicesModule } from './devices/devices.module';
import { PrismaModule } from './prisma/prisma.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DevicesModule,
    ContentsModule,
    RealtimeModule,
  ],
})
export class AppModule {}
