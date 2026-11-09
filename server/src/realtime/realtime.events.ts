/** Room Socket.IO tempat semua dashboard admin berkumpul. */
export const ADMINS_ROOM = 'admins';

/** Room khusus satu device; dipakai untuk mengirim command ke device tertentu. */
export const deviceRoom = (deviceId: string): string => `device:${deviceId}`;

/** Event yang dikirim client (device/admin) ke server. */
export enum ClientEvent {
  DeviceRegister = 'device:register',
}

/** Event yang dikirim server ke client. */
export enum ServerEvent {
  DeviceStatus = 'device:status',
}

/** Balasan (acknowledgement) untuk `device:register`. */
export type RegisterAck = { ok: true; deviceId: string } | { ok: false; error: string };
