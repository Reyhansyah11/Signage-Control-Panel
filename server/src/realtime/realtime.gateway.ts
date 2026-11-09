import { HttpException, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PresenceService } from '../presence/presence.service';
import { PresenceChange } from '../presence/presence.types';
import { RegisterDeviceDto } from './dto/register-device.dto';
import {
  ADMINS_ROOM,
  ClientEvent,
  RegisterAck,
  ServerEvent,
  deviceRoom,
} from './realtime.events';

/** Pipe validasi global tidak berlaku di gateway, jadi dipasang di sini. */
const wsValidationPipe = new ValidationPipe({
  whitelist: true,
  exceptionFactory: (errors) =>
    new WsException(errors.flatMap((error) => Object.values(error.constraints ?? {}))),
});

/**
 * Gerbang WebSocket. Sengaja tipis: hanya menerjemahkan event socket ke
 * PresenceService dan menyiarkan hasilnya ke dashboard admin.
 *
 * Ping/pong Socket.IO dipercepat agar device yang mati mendadak (kabel dicabut,
 * tab ditutup paksa) terdeteksi dalam kurang dari 15 detik.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  pingInterval: 10_000,
  pingTimeout: 5_000,
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(private readonly presenceService: PresenceService) {}

  /** Client yang menyatakan `auth.role = "admin"` masuk ke room admin untuk menerima status device. */
  handleConnection(client: Socket): void {
    const { role } = client.handshake.auth as { role?: string };
    if (role === 'admin') {
      void client.join(ADMINS_ROOM);
      this.logger.log(`Admin terhubung: ${client.id}`);
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.publish(await this.presenceService.unregister(client.id));
  }

  @SubscribeMessage(ClientEvent.DeviceRegister)
  @UsePipes(wsValidationPipe)
  async handleRegister(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: RegisterDeviceDto,
  ): Promise<RegisterAck> {
    try {
      const change = await this.presenceService.register(dto.deviceId, client.id);

      if (!client.connected) {
        // Socket putus selagi register berjalan, jadi handleDisconnect sudah lewat.
        this.publish(await this.presenceService.unregister(client.id));
        return { ok: false, error: 'Koneksi terputus saat registrasi' };
      }

      await client.join(deviceRoom(dto.deviceId));
      this.publish(change);
      return { ok: true, deviceId: dto.deviceId };
    } catch (error) {
      if (error instanceof HttpException) {
        return { ok: false, error: error.message };
      }
      throw error;
    }
  }

  private publish(change: PresenceChange | null): void {
    if (change) {
      this.server.to(ADMINS_ROOM).emit(ServerEvent.DeviceStatus, change);
    }
  }
}
