import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import type { AuthenticatedRequest } from '../auth.types';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Endpoint baca-saja yang dipakai device client (device tidak punya akun admin).
 * Device hanya perlu mengambil playlist-nya sendiri saat connect atau reconnect.
 */
const DEVICE_PLAYLIST_ROUTE = /^\/api\/devices\/[0-9a-fA-F-]{36}\/playlist\/?$/;

/**
 * Guard global (didaftarkan lewat APP_GUARD): semua route HTTP wajib JWT admin,
 * kecuali yang ditandai @Public() atau endpoint playlist untuk device.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // WebSocket diamankan di AdminAuthIoAdapter (saat handshake), bukan di sini.
    if (context.getType() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (this.isDevicePlaylistRead(request)) return true;

    const token = this.extractBearerToken(request);
    if (!token) throw new UnauthorizedException('Token tidak ditemukan');

    try {
      request.admin = await this.auth.verifyToken(token);
    } catch {
      throw new UnauthorizedException('Token tidak valid atau sudah kedaluwarsa');
    }
    return true;
  }

  private isDevicePlaylistRead(request: AuthenticatedRequest): boolean {
    const path = request.originalUrl.split('?')[0];
    return request.method === 'GET' && DEVICE_PLAYLIST_ROUTE.test(path);
  }

  private extractBearerToken(request: AuthenticatedRequest): string | undefined {
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    return scheme === 'Bearer' && token ? token : undefined;
  }
}
