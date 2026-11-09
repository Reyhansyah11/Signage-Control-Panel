import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { AdminJwtPayload, LoginResponse } from './auth.types';

/**
 * Autentikasi sederhana: satu akun admin yang kredensialnya diambil dari env.
 * Cukup untuk dashboard internal; untuk banyak user, pindahkan ke tabel users + hash password.
 */
@Injectable()
export class AuthService {
  private readonly adminUsername: string;
  private readonly adminPassword: string;
  private readonly expiresInSeconds: number;

  constructor(
    config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.adminUsername = config.getOrThrow<string>('ADMIN_USERNAME');
    this.adminPassword = config.getOrThrow<string>('ADMIN_PASSWORD');
    this.expiresInSeconds = Number(config.get<string>('JWT_EXPIRES_IN_SECONDS', '28800'));
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    // Kedua pembandingan selalu dijalankan supaya waktu respons tidak membocorkan field mana yang salah.
    const usernameOk = this.safeEqual(username, this.adminUsername);
    const passwordOk = this.safeEqual(password, this.adminPassword);
    if (!usernameOk || !passwordOk) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const payload: AdminJwtPayload = { sub: username, role: 'admin' };
    const accessToken = await this.jwt.signAsync(payload, { expiresIn: this.expiresInSeconds });
    return { accessToken, tokenType: 'Bearer', expiresIn: this.expiresInSeconds };
  }

  /** Memverifikasi tanda tangan dan masa berlaku token; melempar error kalau tidak valid. */
  async verifyToken(token: string): Promise<AdminJwtPayload> {
    const payload = await this.jwt.verifyAsync<AdminJwtPayload>(token);
    if (payload.role !== 'admin') {
      throw new UnauthorizedException('Token bukan token admin');
    }
    return payload;
  }

  /** Perbandingan waktu-konstan; di-hash dulu agar panjang kedua sisi selalu sama. */
  private safeEqual(a: string, b: string): boolean {
    const hash = (value: string): Buffer => createHash('sha256').update(value).digest();
    return timingSafeEqual(hash(a), hash(b));
  }
}
