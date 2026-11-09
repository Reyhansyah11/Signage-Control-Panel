import type { Request } from 'express';

/** Isi (claims) JWT admin. */
export interface AdminJwtPayload {
  sub: string;
  role: 'admin';
}

/** Request HTTP yang sudah melewati JwtAuthGuard. */
export type AuthenticatedRequest = Request & { admin?: AdminJwtPayload };

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
