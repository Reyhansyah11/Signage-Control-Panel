import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CommandsService } from './commands.service';
import { PushContentDto } from './dto/push-content.dto';

/** Endpoint REST untuk command ke device. */
@ApiTags('commands')
@Controller('devices/:deviceId/push')
export class CommandsController {
  constructor(private readonly commandsService: CommandsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Push konten ke device tertentu agar tampil saat itu juga' })
  @ApiAcceptedResponse({ description: 'Command dikirim ke device' })
  @ApiNotFoundResponse({ description: 'Device atau konten tidak ditemukan' })
  @ApiConflictResponse({ description: 'Device sedang offline' })
  push(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: PushContentDto,
  ): Promise<void> {
    return this.commandsService.pushContent(deviceId, dto);
  }
}
