import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ContentsController } from './contents.controller';
import { ContentsRepository } from './contents.repository';
import { ContentsService } from './contents.service';

@Module({
  imports: [StorageModule],
  controllers: [ContentsController],
  providers: [ContentsService, ContentsRepository],
  exports: [ContentsService], // dipakai modul playlist nanti
})
export class ContentsModule {}
