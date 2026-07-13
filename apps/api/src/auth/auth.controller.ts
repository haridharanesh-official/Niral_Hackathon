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
import { UpdateProfileDto } from './dto/update-profile.dto';

type AuthRequest = Request & { user: { userId: string; email: string; role: string } };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

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
}
