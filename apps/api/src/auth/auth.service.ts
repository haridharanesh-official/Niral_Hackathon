import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  GoneException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import {
  PASSWORD_POLICY,
  SUBMISSION_LOCKED_STATUSES,
  UserRole as SharedUserRole,
  validatePasswordPolicy,
} from '@hackos/shared';
import { AccountStatus, Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccountRecoveryDto } from './dto/password.dto';
import { AuditService } from '../audit/audit.service';
import { SessionDeviceMeta, SessionService } from '../session/session.service';

import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly sessions: SessionService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.accountPolicyAccepted !== true)
      throw new BadRequestException('Accept the account declaration.');
    if (
      !dto.student ||
      !dto.student.rulesAccepted ||
      !dto.student.privacyAccepted ||
      !dto.student.codeOfConductAccepted ||
      !dto.student.eligibilityConfirmed
    )
      throw new BadRequestException(
        'Complete student details and accept the required rules, privacy, conduct and eligibility declarations.',
      );
    const policyErrors = validatePasswordPolicy(dto.password);
    if (policyErrors.length) {
      throw new BadRequestException(policyErrors[0]);
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      PASSWORD_POLICY.bcryptCost,
    );
    const user = await this.prisma.user
      .create({
        data: {
          email: dto.email.trim().toLowerCase(),
          name: `${dto.student.firstName.trim()} ${dto.student.lastName.trim()}`,
          passwordHash,
          college: dto.student.institution,
          department: dto.student.department,
          profile: {
            degree: dto.student.degree,
            yearOfStudy: dto.student.yearOfStudy,
            phoneNumber: dto.student.phone,
            studentId: dto.student.studentId ?? '',
            skillsList: dto.student.skills,
            experience: dto.student.experience ?? '',
            track: dto.student.track ?? '',
            github: dto.student.github ?? '',
            registrationConsents: {
              version: 'niral-student-2026-v1',
              recordedAt: new Date().toISOString(),
              rules: true,
              privacy: true,
              codeOfConduct: true,
              eligibility: true,
            },
          },
          registrationConsents: {
            create: {
              version: 'niral-student-2026-v1',
              rulesAccepted: true,
              privacyAccepted: true,
              codeOfConductAccepted: true,
              eligibilityConfirmed: true,
            },
          },
          auditLogs: {
            create: {
              action: 'ACCOUNT_CREATED',
              resource: 'account',
              metadata: {
                accountPolicyAccepted: true,
                accountPolicyVersion: 'niral-student-2026-v1',
              },
            },
          },
          role: UserRole.PARTICIPANT,
          accountStatus: AccountStatus.PENDING,
          profileRecord: {
            create: {
              firstName: dto.student.firstName,
              lastName: dto.student.lastName,
              displayName: dto.student.displayName,
              institution: dto.student.institution,
              department: dto.student.department,
              degree: dto.student.degree,
              yearOfStudy: dto.student.yearOfStudy,
              phoneNumber: dto.student.phone,
              githubUrl: dto.student.github,
            },
          },
        },
        include: { profileRecord: true },
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          throw new ConflictException('Email already registered');
        throw error;
      });

    const delivery = await this.sendVerification(user.email, user.id);

    return {
      user: this.sanitize(user),
      emailDelivery: delivery.success ? 'accepted' : 'failed',
      message: delivery.success
        ? 'Account created. Check your inbox for the verification link.'
        : 'Account created, but the verification email could not be sent. Retry from Verify Email.',
    };
  }

  async login(dto: LoginDto, device?: SessionDeviceMeta) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
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

    if (!user.emailVerified) {
      throw new ForbiddenException({
        code: 'EMAIL_UNVERIFIED',
        message: 'Verify your email before signing in.',
      });
    }
    if (user.twoFactorEnabled) {
      const token = await this.createToken(user.email, 'auth-transition', 15);
      const delivery = await this.sendLink(
        user.email,
        user.id,
        token,
        '/verify-email',
        'Confirm your NIRAL sign-in transition',
        'auth.transition',
        'You entered the correct password for your account. Confirm this link to replace your previous authenticator requirement with password and email-link recovery. All existing sessions will be revoked. If this was not you, do not follow this link.',
      );
      if (!delivery.success)
        throw new ServiceUnavailableException(
          'The secure account transition email could not be sent. Try again later or contact the organizers.',
        );
      throw new ForbiddenException({
        code: 'SECURITY_TRANSITION_REQUIRED',
        message:
          'Confirm the secure transition link sent to your registered email before signing in.',
      });
    }

    const accessToken = await this.signAccessToken(user);

    await this.prisma.user.update({
      where: { id: user.id, accountStatus: user.accountStatus },
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
    const user = await this.prisma.$transaction(async (tx) => {
      const record = await this.consumeToken(token, 'email-verify', tx);
      const existing = await tx.user.findUnique({
        where: { email: record.identifier },
      });
      if (
        !existing ||
        ['SUSPENDED', 'ARCHIVED'].includes(existing.accountStatus)
      )
        throw new ForbiddenException(
          'Account cannot be activated. Contact the organizers.',
        );
      const activated = await tx.user.update({
        where: { id: existing.id, accountStatus: existing.accountStatus },
        data: {
          emailVerified: new Date(),
          accountStatus: AccountStatus.ACTIVE,
        },
      });
      await tx.paymentNotification.upsert({
        where: { deduplicationKey: `email-verified:${existing.id}` },
        update: {},
        create: {
          deduplicationKey: `email-verified:${existing.id}`,
          userId: existing.id,
          eventType: 'account.verified',
          subject: 'Your NIRAL email is verified',
          body: 'Your email is verified. Sign in and complete event enrollment. Account verification alone is not event registration.',
        },
      });
      return activated;
    });
    await this.audit.record({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      outcome: 'success',
    });
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async completeTransition(token: string) {
    const user = await this.prisma.$transaction(async (tx) => {
      const record = await this.consumeToken(token, 'auth-transition', tx);
      const existing = await tx.user.findUnique({
        where: { email: record.identifier },
      });
      if (
        !existing ||
        !existing.emailVerified ||
        ['SUSPENDED', 'ARCHIVED'].includes(existing.accountStatus)
      )
        throw new ForbiddenException(
          'Account transition unavailable. Contact the organizers.',
        );
      await tx.session.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return tx.user.update({
        where: { id: existing.id, accountStatus: existing.accountStatus },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null,
        },
      });
    });
    await this.audit.record({
      userId: user.id,
      action: 'AUTH_LINK_TRANSITION_CONFIRMED',
      outcome: 'success',
    });
    return {
      message:
        'Account transition confirmed. Existing sessions were revoked. Sign in with your password.',
    };
  }

  async resendVerification(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (
      user &&
      !user.emailVerified &&
      !['SUSPENDED', 'ARCHIVED'].includes(user.accountStatus)
    ) {
      const delivery = await this.sendVerification(user.email, user.id);
      if (!delivery.success)
        throw new ServiceUnavailableException(
          'Verification email could not be sent. Try again later.',
        );
    }
    return {
      message:
        'If an eligible account needs verification, a link has been requested. Check your inbox.',
      retryAfter: 60,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (user && !['SUSPENDED', 'ARCHIVED'].includes(user.accountStatus)) {
      let token: string;
      try {
        token = await this.createToken(user.email, 'password-reset', 60);
      } catch (error) {
        if (error instanceof HttpException && error.getStatus() === 429)
          return {
            message:
              'If an eligible account exists, recovery has been requested. Check your inbox or try again later.',
          };
        throw error;
      }
      const delivery = await this.sendLink(
        user.email,
        user.id,
        token,
        '/reset-password',
        'Reset your NIRAL 2026 password',
        'password.reset',
        'Use this one-time link to choose a new password. It expires in 60 minutes. Ignore this email if you did not request it.',
      );
      await this.audit.record({
        userId: user.id,
        action: 'PASSWORD_RESET_REQUEST',
        outcome: delivery.success ? 'success' : 'failure',
      });
    }
    // Identical public response for unknown addresses and provider failures. No delivery claim.
    return {
      message:
        'If an eligible account exists, recovery has been requested. Check your inbox or try again later.',
    };
  }

  async accountRecovery(dto: AccountRecoveryDto, ip?: string) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    await this.audit.record({
      userId: user?.id ?? null,
      action: 'ACCOUNT_RECOVERY_REQUEST',
      resource: 'auth',
      ip,
      metadata: {
        fullName: dto.fullName.trim(),
        email: normalizedEmail,
        alternateContact: dto.alternateContact.trim(),
        reasonSnippet: dto.reason.trim().slice(0, 150),
        userExists: !!user,
      },
    });

    try {
      await this.mail.send({
        to: 'iotclub.siet@gmail.com',
        subject: `[NIRAL 2026] Account Recovery Ticket: ${dto.fullName.trim()}`,
        eventType: 'account.recovery',
        html: `
          <h2>NIRAL 2026 Account Recovery Request</h2>
          <p>A participant has submitted an account recovery request:</p>
          <ul>
            <li><strong>Full Name:</strong> ${dto.fullName.trim()}</li>
            <li><strong>Registered Email:</strong> ${normalizedEmail}</li>
            <li><strong>Alternate Contact:</strong> ${dto.alternateContact.trim()}</li>
            <li><strong>Account Exists:</strong> ${user ? 'Yes' : 'No'}</li>
            <li><strong>Description:</strong> ${dto.reason.trim()}</li>
          </ul>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `,
      });
    } catch {
      // Mail delivery error does not block the recovery confirmation
    }

    return {
      success: true,
      message:
        'Your recovery ticket has been submitted to the NIRAL organizing team. We will review your account and reach out via your alternate contact within 1–2 business days.',
    };
  }

  async resetPassword(token: string, password: string) {
    const policyErrors = validatePasswordPolicy(password);
    if (policyErrors.length) throw new BadRequestException(policyErrors[0]);
    const passwordHash = await bcrypt.hash(
      password,
      PASSWORD_POLICY.bcryptCost,
    );
    const user = await this.prisma.$transaction(async (tx) => {
      const record = await this.consumeToken(token, 'password-reset', tx);
      const existing = await tx.user.findUnique({
        where: { email: record.identifier },
      });
      if (
        !existing ||
        ['SUSPENDED', 'ARCHIVED'].includes(existing.accountStatus)
      )
        throw new ForbiddenException('Account recovery unavailable.');
      const updated = await tx.user.update({
        where: { id: existing.id, accountStatus: existing.accountStatus },
        data: { passwordHash },
      });
      await tx.session.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await tx.verificationToken.deleteMany({
        where: {
          identifier: {
            in: [
              `password-reset:${existing.email}`,
              `auth-transition:${existing.email}`,
            ],
          },
        },
      });
      return updated;
    });
    await this.audit.record({
      userId: user.id,
      action: 'PASSWORD_RESET_COMPLETE',
      outcome: 'success',
    });
    const delivery = await this.mail.send({
      to: user.email,
      subject: 'Your NIRAL password was changed',
      eventType: 'password.changed',
      html: '<p>Your NIRAL password was changed and existing sessions revoked. Contact the organizers if this was not you.</p>',
    });
    return {
      message: 'Password updated successfully. Sign in with your new password.',
      emailDelivery: delivery.success ? 'accepted' : 'failed',
    };
  }

  async logout(authorization: string) {
    const token = authorization.replace(/^Bearer\s+/i, '');
    await this.prisma.session.updateMany({
      where: { sessionToken: this.hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Signed out' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  obsoleteAuthenticatorAction(): never {
    throw new GoneException(
      'Authenticator enrollment is retired. Existing accounts transition through a secure email link after password verification.',
    );
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
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
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
        ...(mergedProfile !== undefined
          ? { profile: mergedProfile as Prisma.InputJsonValue }
          : {}),
        ...(data.notificationPrefs !== undefined
          ? {
              notificationPrefs:
                data.notificationPrefs as Prisma.InputJsonValue,
            }
          : {}),
        ...(data.markComplete ? { profileCompletedAt: new Date() } : {}),
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
          membership.team.submission
            .status as (typeof SUBMISSION_LOCKED_STATUSES)[number],
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

  private async signAccessToken(user: {
    id: string;
    email: string;
    role: UserRole;
  }) {
    return this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role as SharedUserRole,
      jti: randomUUID(),
    });
  }

  private async createToken(
    identifier: string,
    purpose: string,
    expiresMinutes: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Serialize issuing links for this inbox/purpose, including requests from different IPs.
      const key = `${purpose}:${identifier}`;
      await tx.$queryRaw(
        Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${key}))::text AS locked`,
      );
      const recent = await tx.verificationToken.findFirst({
        where: {
          identifier: key,
          expires: {
            gt: new Date(Date.now() + expiresMinutes * 60_000 - 60_000),
          },
        },
      });
      if (recent)
        throw new HttpException(
          'Please wait 60 seconds before requesting another link.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      const token = `${purpose}.${randomBytes(32).toString('hex')}`;
      await tx.verificationToken.deleteMany({ where: { identifier: key } });
      await tx.verificationToken.create({
        data: {
          identifier: key,
          token: this.hashToken(token),
          expires: new Date(Date.now() + expiresMinutes * 60_000),
        },
      });
      return token;
    });
  }

  private async consumeToken(
    token: string,
    purpose: string,
    db: Pick<PrismaService, 'verificationToken'> = this.prisma,
  ) {
    const [tokenPurpose] = token.split('.');
    if (tokenPurpose !== purpose) {
      throw new BadRequestException('Invalid token');
    }

    const hashed = this.hashToken(token);
    const record = await db.verificationToken.findUnique({
      where: { token: hashed },
    });

    if (!record || record.expires < new Date()) {
      throw new BadRequestException('Token expired or invalid');
    }

    if (!record.identifier.startsWith(`${purpose}:`)) {
      throw new BadRequestException('Invalid token purpose');
    }

    const consumed = await db.verificationToken.deleteMany({
      where: { token: hashed, expires: { gt: new Date() } },
    });
    if (consumed.count !== 1)
      throw new BadRequestException('Link expired or already used.');

    return {
      identifier: record.identifier.replace(`${purpose}:`, ''),
    };
  }

  private async sendVerification(email: string, userId: string) {
    const token = await this.createToken(email, 'email-verify', 60 * 24);
    return this.sendLink(
      email,
      userId,
      token,
      '/verify-email',
      'Verify your NIRAL 2026 account',
      'email.verify',
      'Your NIRAL student account has been created. Confirm ownership of your email using this one-time link. It expires in 24 hours. Event enrollment and any required payment are completed separately after sign-in.',
    );
  }

  private async sendLink(
    email: string,
    userId: string,
    token: string,
    path: string,
    subject: string,
    eventType: string,
    explanation: string,
  ) {
    const base =
      this.config.get<string>('WEB_URL') ??
      this.config.get<string>('NEXTAUTH_URL') ??
      (this.config.get('NODE_ENV') === 'production'
        ? ''
        : 'http://localhost:3000');
    if (!base)
      return { success: false, error: 'Public web URL is not configured.' };
    const url = new URL(path, base);
    // Fragments keep bearer links out of HTTP access logs and referrer headers.
    url.hash = new URLSearchParams({ token }).toString();
    const delivery = await this.mail.send({
      to: email,
      subject,
      eventType,
      html: `<p>${explanation}</p><p><a href="${url.toString()}">Continue securely</a></p>`,
      text: `${explanation} ${url.toString()}`,
      metadata: { userId },
    });
    if (!delivery.success)
      await this.prisma.verificationToken.deleteMany({
        where: { token: this.hashToken(token) },
      });
    return delivery;
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
