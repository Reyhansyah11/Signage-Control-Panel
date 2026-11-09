import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ReplacePlaylistDto } from './dto/replace-playlist.dto';
import { PlaylistItemResponseDto } from './dto/playlist-item-response.dto';
import { PlaylistService } from './playlist.service';
import { PlaylistItemWithContent } from './playlist.types';

/** Endpoint REST untuk playlist per device. */
@ApiTags('playlist')
@Controller('devices/:deviceId/playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ApiOperation({ summary: 'Playlist sebuah device, terurut' })
  @ApiOkResponse({ type: [PlaylistItemResponseDto] })
  @ApiNotFoundResponse({ description: 'Device tidak ditemukan' })
  get(@Param('deviceId', ParseUUIDPipe) deviceId: string): Promise<PlaylistItemWithContent[]> {
    return this.playlistService.getPlaylist(deviceId);
  }

  @Put()
  @ApiOperation({ summary: 'Ganti seluruh playlist device dan dorong ke device secara real-time' })
  @ApiOkResponse({ type: [PlaylistItemResponseDto] })
  @ApiNotFoundResponse({ description: 'Device atau konten tidak ditemukan' })
  @ApiBadRequestResponse({ description: 'Konten duplikat atau payload tidak valid' })
  replace(
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: ReplacePlaylistDto,
  ): Promise<PlaylistItemWithContent[]> {
    return this.playlistService.replacePlaylist(deviceId, dto);
  }
}
