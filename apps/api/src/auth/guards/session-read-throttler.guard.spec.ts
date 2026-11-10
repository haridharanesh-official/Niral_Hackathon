import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { SessionReadThrottlerGuard } from './session-read-throttler.guard';
class TestGuard extends SessionReadThrottlerGuard {
  tracker(req: Record<string, unknown>) {
    return this.getTracker(req);
  }
}
describe('Session-read throttle isolation', () => {
  const jwt = new JwtService({
    secret: 'synthetic-unit-test-signature-secret',
  });
  const guard = new TestGuard(
    [],
    new ThrottlerStorageService(),
    new Reflector(),
  );
  Object.assign(guard, { jwt });
  const request = (token: string, path = '/api/auth/me') => ({
    method: 'GET',
    path,
    ip: '127.0.0.1',
    headers: { authorization: 'Bearer ' + token },
  });
  it('isolates two verified users behind one frontend without splitting a users multiple sessions', async () => {
    const a = await jwt.signAsync({ sub: 'a', nonce: 1 });
    const a2 = await jwt.signAsync({ sub: 'a', nonce: 2 });
    const b = await jwt.signAsync({ sub: 'b' });
    expect(await guard.tracker(request(a))).toBe('session-read:a');
    expect(await guard.tracker(request(a2))).toBe('session-read:a');
    expect(await guard.tracker(request(b))).toBe('session-read:b');
  });
  it('keeps forged, expired and missing identities in the IP bucket', async () => {
    const expired = await jwt.signAsync({ sub: 'a' }, { expiresIn: -1 });
    for (const token of ['forged', expired, await jwt.signAsync({})])
      expect(await guard.tracker(request(token))).toBe('127.0.0.1');
  });
  it('does not change login/recovery/other route IP budgets', async () => {
    const token = await jwt.signAsync({ sub: 'a' });
    for (const path of [
      '/api/auth/login',
      '/api/auth/forgot-password',
      '/api/payments/me',
    ])
      expect(await guard.tracker(request(token, path))).toBe('127.0.0.1');
  });
});
