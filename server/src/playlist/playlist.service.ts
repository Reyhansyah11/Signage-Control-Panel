import { BadRequestException, Injectable } from '@nestjs/common';
import { ContentsService } from '../contents/contents.service';
import { DevicesService } from '../devices/devices.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ServerEvent } from '../realtime/realtime.events';
import { ReplacePlaylistDto } from './dto/replace-playlist.dto';
import { PlaylistRepository } from './playlist.repository';
import { PlaylistItemWithContent } from './playlist.types';

/** Logika bisnis playlist: validasi isi, simpan, lalu kabari device-nya. */
@Injectable()
export class PlaylistService {
  constructor(
    private readonly playlistRepository: PlaylistRepository,
    private readonly devicesService: DevicesService,
    private readonly contentsService: ContentsService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /** @throws NotFoundException bila device tidak ditemukan. */
  async getPlaylist(deviceId: string): Promise<PlaylistItemWithContent[]> {
    await this.devicesService.findOne(deviceId);
    return this.playlistRepository.findByDevice(deviceId);
  }

  /**
   * Mengganti playlist device, lalu mendorong hasilnya ke device agar layar
   * langsung berubah tanpa menunggu polling.
   * @throws NotFoundException bila device atau salah satu konten tidak ada.
   * @throws BadRequestException bila ada konten yang muncul lebih dari sekali.
   */
  async replacePlaylist(
    deviceId: string,
    dto: ReplacePlaylistDto,
  ): Promise<PlaylistItemWithContent[]> {
    await this.devicesService.findOne(deviceId);

    const contentIds = dto.items.map((item) => item.contentId);
    if (new Set(contentIds).size !== contentIds.length) {
      throw new BadRequestException('Konten yang sama tidak boleh muncul dua kali dalam satu playlist');
    }
    await Promise.all(contentIds.map((id) => this.contentsService.findOne(id)));

    const items = await this.playlistRepository.replace(deviceId, dto.items);
    this.realtimeGateway.sendToDevice(deviceId, ServerEvent.PlaylistUpdated, { deviceId, items });
    return items;
  }
}
