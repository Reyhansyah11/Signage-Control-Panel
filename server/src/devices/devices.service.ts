import { Injectable, NotFoundException } from '@nestjs/common';
import { Device, DeviceStatus } from '@prisma/client';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DevicesRepository } from './devices.repository';

/** Logika bisnis device. Tidak tahu apa-apa soal HTTP maupun Prisma. */
@Injectable()
export class DevicesService {
  constructor(private readonly devicesRepository: DevicesRepository) {}

  findAll(): Promise<Device[]> {
    return this.devicesRepository.findAll();
  }

  /** @throws NotFoundException bila device tidak ditemukan. */
  async findOne(id: string): Promise<Device> {
    const device = await this.devicesRepository.findById(id);
    if (!device) {
      throw new NotFoundException(`Device dengan id ${id} tidak ditemukan`);
    }
    return device;
  }

  create(dto: CreateDeviceDto): Promise<Device> {
    return this.devicesRepository.create(dto);
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<Device> {
    await this.findOne(id); // memastikan 404 yang jelas, bukan error Prisma P2025
    return this.devicesRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.devicesRepository.delete(id);
  }

  /**
   * Operasi status di bawah ini hanya dipanggil PresenceService. Sengaja tidak
   * lewat REST: status adalah fakta koneksi, bukan data yang boleh diisi admin.
   */
  markOnline(id: string): Promise<Device> {
    return this.devicesRepository.update(id, {
      status: DeviceStatus.online,
      lastSeen: new Date(),
    });
  }

  /** `lastSeen` diisi saat putus, sehingga berarti "terakhir terlihat online". */
  markOffline(id: string): Promise<Device> {
    return this.devicesRepository.update(id, {
      status: DeviceStatus.offline,
      lastSeen: new Date(),
    });
  }

  /** Dipanggil saat server start agar tidak ada status online "zombie". */
  resetAllToOffline(): Promise<number> {
    return this.devicesRepository.markAllOffline();
  }
}
