import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createHash } from 'crypto';
import { AuthService } from '../src/auth/auth.service';

const user = {
  id: '0f43f48d-88e4-4d88-9896-1a5b2c311111',
  email: 'user@example.com',
  fullName: 'Test User',
  displayName: null,
  phone: null,
  language: 'vi',
  avatarPath: null,
  role: Role.USER,
  isLocked: false,
  creditBalance: 10,
  passwordHash: '',
  passwordChangedAt: null,
  notificationSettings: {},
  lowCreditThreshold: 2,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function setup() {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    session: { create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
  };
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const config = {
    get: jest.fn(
      (key: string, fallback: unknown) =>
        ({ JWT_REFRESH_TTL_DAYS: 30, JWT_ACCESS_TTL: '15m' })[key] ?? fallback,
    ),
    getOrThrow: jest.fn((key: string) => `${key}-a-secret-value-that-is-long-enough`),
  };
  return { service: new AuthService(prisma as never, jwt as never, config as never), prisma, jwt };
}

describe('AuthService', () => {
  it('registers and returns an access/refresh token pair', async () => {
    const { service, prisma, jwt } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => ({ ...user, ...data }));
    prisma.session.create.mockResolvedValue({ id: 'session-id' });
    prisma.session.update.mockResolvedValue({});
    jwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    const result = await service.register(
      { full_name: 'Test User', email: user.email, password: 'Password1' },
      {},
    );
    expect(result).toMatchObject({ access_token: 'access-token', refresh_token: 'refresh-token' });
    expect(prisma.session.update).toHaveBeenCalled();
  });

  it('rejects invalid login credentials', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: user.email, password: 'wrong' }, {}),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rotates a valid refresh session', async () => {
    const { service, prisma, jwt } = setup();
    const refreshToken = 'refresh-token';
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    jwt.verifyAsync.mockResolvedValue({ sub: user.id, sid: 'old-session', type: 'refresh' });
    prisma.session.findUnique.mockResolvedValue({
      id: 'old-session',
      userId: user.id,
      tokenHash,
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10000),
      user,
    });
    prisma.session.update.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({ id: 'new-session' });
    jwt.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
    await expect(service.refresh(refreshToken, {})).resolves.toMatchObject({
      access_token: 'new-access',
    });
    expect(prisma.session.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'old-session' },
        data: { revokedAt: expect.any(Date) },
      }),
    );
  });

  it('revokes the current session on logout', async () => {
    const { service, prisma } = setup();
    prisma.session.updateMany.mockResolvedValue({ count: 1 });
    await service.logout('session-id');
    expect(prisma.session.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'session-id', revokedAt: null } }),
    );
  });
});
