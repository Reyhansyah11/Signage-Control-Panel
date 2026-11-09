import { DeviceStatus } from '@prisma/client';

/** Perubahan status device yang perlu disiarkan ke dashboard admin. */
export interface PresenceChange {
  deviceId: string;
  status: DeviceStatus;
  lastSeen: Date | null;
}
