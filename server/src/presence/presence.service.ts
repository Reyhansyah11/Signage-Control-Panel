import {
  ConflictException,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Device } from '@prisma/client';
import { DevicesService } from '../devices/devices.service';
import { PresenceChange } from './presence.types';

/**
 * Melacak device mana yang sedang terhubung.
 *
 * Satu device bisa punya lebih dari satu socket sesaat (misalnya saat reconnect,
 * koneksi lama belum terdeteksi putus ketika yang baru sudah masuk). Karena itu
 * device dianggap offline hanya setelah SEMUA socket-nya putus.
 *
 * Kelas ini tidak mengenal Socket.IO: hanya menerima id socket dan mengembalikan
 * perubahan status yang perlu disiarkan, sehingga mudah diuji.
 */
@Injectable()
export class PresenceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PresenceService.name);
  private readonly socketsByDevice = new Map<string, Set<string>>();
  private readonly deviceBySocket = new Map<string, string>();

  constructor(private readonly devicesService: DevicesService) {}

  /** Setelah restart, semua koneksi lama sudah hilang: status online di DB pasti basi. */
  async onApplicationBootstrap(): Promise<void> {
    const count = await this.devicesService.resetAllToOffline();
    this.logger.log(`Reset ${count} device ke offline`);
  }

  /**
   * Mencatat socket sebagai koneksi milik device.
   * @returns perubahan status bila device baru saja menjadi online, selain itu null.
   * @throws NotFoundException bila device tidak terdaftar.
   * @throws ConflictException bila socket ini sudah terdaftar sebagai device lain.
   */
  async register(deviceId: string, socketId: string): Promise<PresenceChange | null> {
    const current = this.deviceBySocket.get(socketId);
    if (current === deviceId) return null;
    if (current) {
      throw new ConflictException('Socket ini sudah terdaftar sebagai device lain');
    }

    await this.devicesService.findOne(deviceId);

    const sockets = this.socketsByDevice.get(deviceId) ?? new Set<string>();
    const becameOnline = sockets.size === 0;
    sockets.add(socketId);
    this.socketsByDevice.set(deviceId, sockets);
    this.deviceBySocket.set(socketId, deviceId);

    if (!becameOnline) return null;
    return this.toChange(await this.devicesService.markOnline(deviceId));
  }

  /**
   * Melepas socket yang putus.
   * @returns perubahan status bila itu socket terakhir milik device, selain itu null.
   */
  async unregister(socketId: string): Promise<PresenceChange | null> {
    const deviceId = this.deviceBySocket.get(socketId);
    if (!deviceId) return null;

    this.deviceBySocket.delete(socketId);
    const sockets = this.socketsByDevice.get(deviceId);
    sockets?.delete(socketId);
    if (sockets && sockets.size > 0) return null;

    this.socketsByDevice.delete(deviceId);
    try {
      return this.toChange(await this.devicesService.markOffline(deviceId));
    } catch (error) {
      // Umumnya karena device sudah dihapus admin saat masih terhubung.
      this.logger.warn(`Gagal menandai device ${deviceId} offline: ${String(error)}`);
      return null;
    }
  }

  isOnline(deviceId: string): boolean {
    return (this.socketsByDevice.get(deviceId)?.size ?? 0) > 0;
  }

  private toChange(device: Device): PresenceChange {
    return { deviceId: device.id, status: device.status, lastSeen: device.lastSeen };
  }
}
