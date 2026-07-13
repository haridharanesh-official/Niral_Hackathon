import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { UserRole as SharedUserRole } from '@hackos/shared';
import { User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        college: dto.college,
        department: dto.department,
        bio: dto.bio,
        role: UserRole.PARTICIPANT,
      },
    });

    const verifyToken = await this.createToken(user.email, 'email-verify', 60 * 24);

    return {
      user: this.sanitize(user),
      verificationToken: verifyToken,
      message: 'Registered. Verify your email to activate full access.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        return {
          requires2FA: true,
          message: 'Two-factor authentication required',
        };
      }

      if (
        !user.twoFactorSecret ||
        !verifySync({ token: dto.totpCode, secret: user.twoFactorSecret }).valid
      ) {
        throw new UnauthorizedException('Invalid two-factor code');
      }
    }

    const accessToken = await this.signAccessToken(user);

    return {
      requires2FA: false,
      accessToken,
      user: this.sanitize(user),
    };
  }

  async verifyEmail(token: string) {
    const record = await this.consumeToken(token, 'email-verify');
    const user = await this.prisma.user.update({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    });

    return {
      user: this.sanitize(user),
      message: 'Email verified successfully',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to avoid account enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link was generated.' };
    }

    const token = await this.createToken(user.email, 'password-reset', 60);

    return {
      message: 'If that email exists, a reset link was generated.',
      resetToken: token,
    };
  }

  async resetPassword(token: string, password: string) {
    const record = await this.consumeToken(token, 'password-reset');
    const passwordHash = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { email: record.identifier },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  async setup2FA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });

    const otpauth = generateURI({
      issuer: 'HackOS',
      label: user.email,
      secret,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    return { secret, otpauth, qrCodeDataUrl };
  }

  async enable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) {
      throw new BadRequestException('Run 2FA setup first');
    }

    if (!verifySync({ token: code, secret: user.twoFactorSecret }).valid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: 'Two-factor authentication enabled' };
  }

  async disable2FA(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    if (!verifySync({ token: code, secret: user.twoFactorSecret }).valid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { message: 'Two-factor authentication disabled' };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; bio?: string; image?: string; college?: string; department?: string },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return this.sanitize(user);
  }

  async validateUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  private async signAccessToken(user: { id: string; email: string; role: UserRole }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role as SharedUserRole,
    });
  }

  private async createToken(identifier: string, purpose: string, expiresMinutes: number) {
    const raw = randomBytes(32).toString('hex');
    const token = `${purpose}.${raw}`;
    const hashed = this.hashToken(token);
    const expires = new Date(Date.now() + expiresMinutes * 60_000);

    await this.prisma.verificationToken.deleteMany({
      where: { identifier: `${purpose}:${identifier}` },
    });

    await this.prisma.verificationToken.create({
      data: {
        identifier: `${purpose}:${identifier}`,
        token: hashed,
        expires,
      },
    });

    return token;
  }

  private async consumeToken(token: string, purpose: string) {
    const [tokenPurpose] = token.split('.');
    if (tokenPurpose !== purpose) {
      throw new BadRequestException('Invalid token');
    }

    const hashed = this.hashToken(token);
    const record = await this.prisma.verificationToken.findUnique({
      where: { token: hashed },
    });

    if (!record || record.expires < new Date()) {
      throw new BadRequestException('Token expired or invalid');
    }

    if (!record.identifier.startsWith(`${purpose}:`)) {
      throw new BadRequestException('Invalid token purpose');
    }

    await this.prisma.verificationToken.delete({ where: { token: hashed } });

    return {
      identifier: record.identifier.replace(`${purpose}:`, ''),
    };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private sanitize(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role as SharedUserRole,
      emailVerified: Boolean(user.emailVerified),
      xp: user.xp,
      bio: user.bio,
      college: user.college,
      department: user.department,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }
}
