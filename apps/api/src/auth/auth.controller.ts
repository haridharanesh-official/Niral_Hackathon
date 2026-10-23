import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { Permission, UserRole } from '@hackos/shared';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/password.dto';
import { Disable2FaDto, Enable2FaDto } from './dto/two-factor.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

type AuthRequest = Request & {
  user: { userId: string; email: string; role: string };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ua = req.headers['user-agent'] ?? '';
    return this.authService.login(dto, {
      userAgent: ua,
      ipAddress: req.ip,
      browser: /Edg\//.test(ua)
        ? 'Edge'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : /Safari\//.test(ua)
              ? 'Safari'
              : 'Unknown',
      operatingSystem: /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X/.test(ua)
          ? 'macOS'
          : /Android/.test(ua)
            ? 'Android'
            : /iPhone|iPad/.test(ua)
              ? 'iOS'
              : /Linux/.test(ua)
                ? 'Linux'
                : 'Unknown',
      deviceName: 'Web client',
      approximateLocation: 'Approximate',
    });
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthRequest) {
    return this.authService.me(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('onboarding')
  onboarding(@Req() req: AuthRequest) {
    return this.authService.getOnboardingStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.PROFILE_EDIT)
  @Patch('me')
  updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  setup2FA(@Req() req: AuthRequest) {
    return this.authService.setup2FA(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  enable2FA(@Req() req: AuthRequest, @Body() dto: Enable2FaDto) {
    return this.authService.enable2FA(req.user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  disable2FA(@Req() req: AuthRequest, @Body() dto: Disable2FaDto) {
    return this.authService.disable2FA(req.user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/backup-codes')
  regenerateBackupCodes(@Req() req: AuthRequest, @Body() dto: Enable2FaDto) {
    return this.authService.regenerateBackupCodes(req.user.userId, dto.code);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @Get('admin/ping')
  adminPing() {
    return { ok: true, message: 'RBAC role guard active' };
  }
}
