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
import {
  PASSWORD_POLICY,
  SUBMISSION_LOCKED_STATUSES,
  UserRole as SharedUserRole,
  validatePasswordPolicy,
} from '@hackos/shared';
import { AccountStatus, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuditService } from '../audit/audit.service';
import {
  SessionDeviceMeta,
  SessionService,
} from '../session/session.service';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly sessions: SessionService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const policyErrors = validatePasswordPolicy(dto.password);
    if (policyErrors.length) {
      throw new BadRequestException(policyErrors[0]);
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      PASSWORD_POLICY.bcryptCost,
    );
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        college: dto.college,
        department: dto.department,
        bio: dto.bio,
        role: UserRole.PARTICIPANT,
        accountStatus: AccountStatus.PENDING,
        profileRecord: {
          create: {
            displayName: dto.name,
            institution: dto.college,
            department: dto.department,
          },
        },
      },
      include: { profileRecord: true },
    });

    const verifyToken = await this.createToken(
      user.email,
      'email-verify',
      60 * 24,
    );

    await this.mail.send({
      to: user.email,
      subject: 'Verify your NIRAL 2026 account',
      eventType: 'email.verify',
      html: `<p>Welcome to NIRAL Hackathon 2026! Use token <code>${verifyToken}</code> or visit the verification page to activate your account.</p>`,
      metadata: { userId: user.id },
    });

    await this.audit.record({
      userId: user.id,
      action: 'ACCOUNT_CREATED',
      outcome: 'success',
    });

    return {
      user: this.sanitize(user),
      message: 'Registration successful. A verification link has been sent to your email.',
    };
  }

  async login(dto: LoginDto, device?: SessionDeviceMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (
      user.accountStatus === AccountStatus.SUSPENDED ||
      user.accountStatus === AccountStatus.ARCHIVED
    ) {
      await this.audit.record({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        metadata: { reason: 'account_status', status: user.accountStatus },
        outcome: 'failure',
        ip: device?.ipAddress,
      });
      throw new UnauthorizedException('Account is not active');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.audit.record({
        userId: user.id,
        action: 'LOGIN_FAILURE',
        metadata: { reason: 'password' },
        outcome: 'failure',
        ip: device?.ipAddress,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        return {
          requires2FA: true,
          message: 'Two-factor authentication required',
        };
      }

      const totpOk =
        !!user.twoFactorSecret &&
        verifySync({ token: dto.totpCode, secret: user.twoFactorSecret }).valid;

      let backupOk = false;
      if (!totpOk && user.twoFactorBackupCodes) {
        const hashes = JSON.parse(user.twoFactorBackupCodes) as string[];
        for (let i = 0; i < hashes.length; i++) {
          if (await bcrypt.compare(dto.totpCode, hashes[i])) {
            backupOk = true;
            hashes.splice(i, 1);
            await this.prisma.user.update({
              where: { id: user.id },
              data: { twoFactorBackupCodes: JSON.stringify(hashes) },
            });
            break;
          }
        }
      }

      if (!totpOk && !backupOk) {
        await this.audit.record({
          userId: user.id,
          action: 'LOGIN_FAILURE',
          metadata: { reason: '2fa' },
          outcome: 'failure',
          ip: device?.ipAddress,
        });
        throw new UnauthorizedException('Invalid two-factor code');
      }
    }

    const accessToken = await this.signAccessToken(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        accountStatus:
          user.accountStatus === AccountStatus.PENDING && user.emailVerified
            ? AccountStatus.ACTIVE
            : user.accountStatus,
      },
    });

    await this.sessions.createSession(user.id, accessToken, device ?? {});
    await this.audit.record({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      outcome: 'success',
      ip: device?.ipAddress,
    });

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
      data: {
        emailVerified: new Date(),
        accountStatus: AccountStatus.ACTIVE,
      },
    });

    await this.audit.record({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      outcome: 'success',
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

    await this.mail.send({
      to: user.email,
      subject: 'Reset your NIRAL 2026 password',
      eventType: 'password.reset',
      html: `<p>A password reset was requested for your NIRAL Hackathon account. If this was you, use token <code>${token}</code> to reset your password. This link expires in 60 minutes.</p>`,
      metadata: { userId: user.id },
    });

    await this.audit.record({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      outcome: 'success',
    });

    return {
      message: 'If that email exists, a reset link has been dispatched to your inbox.',
    };
  }

  async resetPassword(token: string, password: string) {
    const policyErrors = validatePasswordPolicy(password);
    if (policyErrors.length) {
      throw new BadRequestException(policyErrors[0]);
    }

    const record = await this.consumeToken(token, 'password-reset');
    const passwordHash = await bcrypt.hash(
      password,
      PASSWORD_POLICY.bcryptCost,
    );

    const user = await this.prisma.user.update({
      where: { email: record.identifier },
      data: { passwordHash },
    });

    await this.sessions.revokeAll(user.id);
    await this.audit.record({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETE',
      outcome: 'success',
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
      issuer: 'Niral Hackathon',
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

    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedBackups = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(hashedBackups),
      },
    });

    await this.audit.record({
      userId,
      action: '2FA_ENABLED',
      metadata: { method: 'authenticator' },
      outcome: 'success',
    });

    return {
      message: 'Two-factor authentication enabled',
      backupCodes,
    };
  }

  async regenerateBackupCodes(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    if (!verifySync({ token: code, secret: user.twoFactorSecret }).valid) {
      throw new UnauthorizedException('Invalid two-factor code');
    }

    const backupCodes = Array.from({ length: 8 }, () =>
      randomBytes(4).toString('hex'),
    );
    const hashedBackups = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: JSON.stringify(hashedBackups) },
    });

    await this.audit.record({
      userId,
      action: '2FA_BACKUP_REGENERATED',
      outcome: 'success',
    });

    return { backupCodes, message: 'Backup codes regenerated' };
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
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    await this.audit.record({
      userId,
      action: '2FA_DISABLED',
      outcome: 'success',
    });

    return { message: 'Two-factor authentication disabled' };
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      image?: string;
      college?: string;
      department?: string;
      profile?: Record<string, unknown>;
      markComplete?: boolean;
      notificationPrefs?: Record<string, unknown>;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');

    const mergedProfile =
      data.profile !== undefined
        ? {
            ...((existing.profile as Record<string, unknown> | null) ?? {}),
            ...data.profile,
          }
        : undefined;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        image: data.image,
        college: data.college,
        department: data.department,
        ...(mergedProfile !== undefined ? { profile: mergedProfile as any } : {}),
        ...(data.notificationPrefs !== undefined
          ? { notificationPrefs: data.notificationPrefs as any }
          : {}),
        ...(data.markComplete
          ? { profileCompletedAt: new Date() }
          : {}),
      },
    });

    if (data.markComplete) {
      await this.audit.record({
        userId,
        action: 'PROFILE_COMPLETED',
        outcome: 'success',
      });
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Profile completed',
          body: 'Your Niral Hackathon profile is ready. Enroll in the event next.',
          type: 'success',
          link: '/dashboard/enrollment',
        },
      });
    }

    return this.sanitize(user);
  }

  async getOnboardingStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const enrollment = await this.prisma.eventEnrollment.findFirst({
      where: { userId, status: 'CONFIRMED' },
      include: { event: true },
      orderBy: { createdAt: 'desc' },
    });

    const membership = await this.prisma.teamMember.findFirst({
      where: { userId },
      include: {
        team: { include: { submission: true } },
      },
    });

    const checklist = {
      account: true,
      email: Boolean(user.emailVerified),
      profile: Boolean(user.profileCompletedAt),
      event: Boolean(enrollment),
      team: Boolean(membership),
      project: Boolean(
        membership?.team.submission &&
          SUBMISSION_LOCKED_STATUSES.includes(
            membership.team.submission.status as (typeof SUBMISSION_LOCKED_STATUSES)[number],
          ),
      ),
      presentation: false,
    };

    const completed = Object.values(checklist).filter(Boolean).length;
    const total = Object.keys(checklist).length;

    return {
      checklist,
      percent: Math.round((completed / total) * 100),
      profile: user.profile,
      profileCompletedAt: user.profileCompletedAt,
      enrollment,
      team: membership?.team ?? null,
      notificationPrefs: user.notificationPrefs,
    };
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
      accountStatus: user.accountStatus,
      lastLoginAt: user.lastLoginAt,
      emailVerified: Boolean(user.emailVerified),
      xp: user.xp,
      bio: user.bio,
      college: user.college,
      department: user.department,
      profile: user.profile,
      profileCompletedAt: user.profileCompletedAt,
      notificationPrefs: user.notificationPrefs,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
    };
  }
}
