import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlaylistItemInputDto } from './dto/playlist-item-input.dto';
import { PlaylistItemWithContent } from './playlist.types';

/** Satu-satunya kelas yang berbicara ke tabel `playlist_items`. */
@Injectable()
export class PlaylistRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByDevice(deviceId: string): Promise<PlaylistItemWithContent[]> {
    return this.prisma.playlistItem.findMany({
      where: { deviceId },
      orderBy: { urutan: 'asc' },
      include: { content: true },
    });
  }

  /**
   * Mengganti seluruh playlist dalam satu transaksi, jadi device tidak pernah
   * melihat playlist setengah jadi. Urutan diambil dari posisi di array.
   */
  async replace(
    deviceId: string,
    items: PlaylistItemInputDto[],
  ): Promise<PlaylistItemWithContent[]> {
    await this.prisma.$transaction([
      this.prisma.playlistItem.deleteMany({ where: { deviceId } }),
      this.prisma.playlistItem.createMany({
        data: items.map((item, index) => ({
          deviceId,
          contentId: item.contentId,
          durasiDetik: item.durasiDetik,
          urutan: index,
        })),
      }),
    ]);
    return this.findByDevice(deviceId);
  }
}
