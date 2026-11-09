import { ConflictException, Injectable } from '@nestjs/common';
import { ContentsService } from '../contents/contents.service';
import { DevicesService } from '../devices/devices.service';
import { PresenceService } from '../presence/presence.service';
import { ServerEvent } from '../realtime/realtime.events';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PushContentDto } from './dto/push-content.dto';

/** Command yang dikirim admin ke device tertentu. */
@Injectable()
export class CommandsService {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly contentsService: ContentsService,
    private readonly presenceService: PresenceService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Menampilkan sebuah konten di device saat ini juga, tanpa mengubah playlist.
   * Ditolak bila device offline: command bersifat sesaat, jadi tidak ada gunanya
   * diantrekan untuk device yang tidak bisa menerimanya.
   * @throws NotFoundException bila device atau konten tidak ada.
   * @throws ConflictException bila device sedang offline.
   */
  async pushContent(deviceId: string, dto: PushContentDto): Promise<void> {
    await this.devicesService.findOne(deviceId);
    const content = await this.contentsService.findOne(dto.contentId);

    if (!this.presenceService.isOnline(deviceId)) {
      throw new ConflictException('Device sedang offline, command tidak dapat dikirim');
    }

    this.realtimeGateway.sendToDevice(deviceId, ServerEvent.ContentPush, {
      content,
      durasiDetik: dto.durasiDetik ?? null,
    });
  }
}
