import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type { AdminJwtPayload, AuthenticatedRequest, LoginResponse } from './auth.types';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login admin, mengembalikan JWT' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Info admin yang sedang login' })
  me(@Req() request: AuthenticatedRequest): AdminJwtPayload | undefined {
    return request.admin;
  }
}
