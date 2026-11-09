import { Test } from '@nestjs/testing';
import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Server } from 'http';
import { AddressInfo } from 'net';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
describe('HTTP authentication contracts and rate limits (service mocked; no database)', () => {
  let app: INestApplication;
  let base: string;
  const service = {
    login: jest
      .fn()
      .mockRejectedValue(new UnauthorizedException('Invalid credentials')),
    register: jest.fn().mockResolvedValue({
      message: 'Account created',
      emailDelivery: 'failed',
    }),
  };
  async function post(path: string, body: unknown) {
    const response = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    await response.text();
    return response.status;
  }
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{ name: 'default', ttl: 60000, limit: 120 }]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: service },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => false })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => false })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => false })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen(0, '127.0.0.1');
    const server = app.getHttpServer() as Server;
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(async () => app?.close());
  it('rejects frontend role assignment', async () => {
    expect(
      await post('/auth/register', {
        name: 'Unit Test',
        email: 'unit@example.test',
        password: 'StrongPassword123',
        accountPolicyAccepted: true,
        role: 'ADMIN',
      }),
    ).toBe(400);
    expect(service.register).not.toHaveBeenCalled();
  });
  it('requires a declaration and valid email/password fields', async () => {
    expect(
      await post('/auth/register', {
        name: 'U',
        email: 'not-email',
        password: 'short',
      }),
    ).toBe(400);
  });
  it('normalizes email before invoking registration', async () => {
    expect(
      await post('/auth/register', {
        student: {
          firstName: 'Unit',
          lastName: 'Test',
          displayName: 'Unit Test',
          phone: '+91 9876543210',
          institution: 'Test College',
          department: 'ECE',
          degree: 'B.E. / B.Tech',
          yearOfStudy: 'Third year',
          skills: [],
          rulesAccepted: true,
          privacyAccepted: true,
          codeOfConductAccepted: true,
          eligibilityConfirmed: true,
        },
        name: ' Unit Test ',
        email: ' UNIT@EXAMPLE.TEST ',
        password: 'StrongPassword123',
        accountPolicyAccepted: true,
      }),
    ).toBe(201);
    expect(
      (
        service.register.mock.calls[0] as unknown as [Record<string, unknown>]
      )[0],
    ).toMatchObject({ name: 'Unit Test', email: 'unit@example.test' });
  });
  it('does not accept obsolete authenticator inputs', async () => {
    expect(
      await post('/auth/login', {
        email: 'unit@example.test',
        password: 'password',
        totpCode: '123456',
      }),
    ).toBe(400);
  });
  it('rate-limits repeated failed sign-ins on the actual HTTP controller', async () => {
    let limited = false;
    for (let i = 0; i < 10; i++) {
      const status = await post('/auth/login', {
        email: 'unit@example.test',
        password: 'password',
      });
      if (status === 429) {
        limited = true;
        break;
      }
      expect(status).toBe(401);
    }
    expect(limited).toBe(true);
  });
  it('does not allow unauthenticated self/profile access', async () => {
    const result = await fetch(base + '/auth/me');
    expect(result.status).toBe(403);
    await result.text();
  });
});
