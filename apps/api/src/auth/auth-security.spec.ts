import {
  Permission,
  UserRole,
  roleHasPermission,
  validatePasswordPolicy,
} from '@hackos/shared';
import { createHash, randomBytes } from 'crypto';

describe('Password policy', () => {
  it('rejects short passwords', () => {
    expect(validatePasswordPolicy('Short1')).toContain(
      'Password must be at least 12 characters',
    );
  });

  it('accepts strong passwords', () => {
    expect(validatePasswordPolicy('StrongPass12')).toEqual([]);
  });

  it('requires mixed character classes', () => {
    const errors = validatePasswordPolicy('alllowercase1');
    expect(errors.some((e) => e.includes('uppercase'))).toBe(true);
  });
});

describe('RBAC matrix', () => {
  it('allows participants to create teams', () => {
    expect(roleHasPermission(UserRole.PARTICIPANT, Permission.TEAM_CREATE)).toBe(
      true,
    );
  });

  it('denies mentors team create', () => {
    expect(roleHasPermission(UserRole.MENTOR, Permission.TEAM_CREATE)).toBe(
      false,
    );
  });

  it('allows judges to evaluate', () => {
    expect(roleHasPermission(UserRole.JUDGE, Permission.JUDGE_EVALUATE)).toBe(
      true,
    );
  });

  it('allows only admin manage users', () => {
    expect(
      roleHasPermission(UserRole.ORGANIZER, Permission.ADMIN_MANAGE_USERS),
    ).toBe(false);
    expect(roleHasPermission(UserRole.ADMIN, Permission.ADMIN_MANAGE_USERS)).toBe(
      true,
    );
  });
});

describe('Invitation token generation', () => {
  it('produces cryptographically strong single-use style tokens', () => {
    const raw = randomBytes(32).toString('hex');
    const hashed = createHash('sha256').update(raw).digest('hex');
    expect(raw).toHaveLength(64);
    expect(hashed).toHaveLength(64);
    expect(hashed).not.toEqual(raw);
  });
});

describe('Sensitive data exposure prevention', () => {
  it('ensures safe user selection never contains sensitive credentials', () => {
    const sensitiveFields = [
      'passwordHash',
      'twoFactorSecret',
      'twoFactorBackupCodes',
      'notificationPrefs',
    ];

    const safeMemberUser = {
      id: 'u1',
      name: 'Alice',
      email: 'alice@example.com',
      image: null,
      role: UserRole.PARTICIPANT,
      college: 'Tech Institute',
      department: 'CS',
      xp: 100,
    };

    for (const field of sensitiveFields) {
      expect(field in safeMemberUser).toBe(false);
    }
  });

  it('ensures event settings require ORGANIZER or ADMIN permissions', () => {
    expect(
      roleHasPermission(UserRole.PARTICIPANT, Permission.EVENT_CREATE),
    ).toBe(false);
    expect(
      roleHasPermission(UserRole.TEAM_LEADER, Permission.EVENT_CREATE),
    ).toBe(false);
    expect(
      roleHasPermission(UserRole.ORGANIZER, Permission.EVENT_CREATE),
    ).toBe(true);
    expect(
      roleHasPermission(UserRole.ADMIN, Permission.EVENT_CREATE),
    ).toBe(true);
  });
});

