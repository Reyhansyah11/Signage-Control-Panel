import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';
import { AuthService } from './auth.service';

/**
 * Menambahkan middleware autentikasi ke Socket.IO.
 *
 * - Koneksi yang mengaku admin (handshake.auth.role === 'admin') wajib membawa JWT valid
 *   di handshake.auth.token; kalau tidak, koneksi ditolak sebelum gateway dijalankan.
 * - Koneksi lain (device) lolos tanpa JWT dan hanya bisa melakukan device:register.
 */
export class AdminAuthIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly auth: AuthService,
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options) as Server;

    server.use((socket, next) => {
      const { role, token } = socket.handshake.auth as { role?: string; token?: string };
      if (role !== 'admin') return next();
      if (!token) return next(new Error('Unauthorized'));

      this.auth
        .verifyToken(token)
        .then(() => next())
        .catch(() => next(new Error('Unauthorized')));
    });

    return server;
  }
}
