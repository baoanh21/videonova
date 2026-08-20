import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtStrategy } from '../src/auth/jwt.strategy';

describe('JwtStrategy authentication', () => {
  const config = {
    getOrThrow: jest.fn().mockReturnValue('access-secret-at-least-thirty-two-characters'),
  };

  it('rejects an access token whose session was revoked or missing', async () => {
    const prisma = { session: { findUnique: jest.fn().mockResolvedValue(null) } };
    const strategy = new JwtStrategy(config as never, prisma as never);
    await expect(
      strategy.validate({
        sub: 'user-id',
        sid: 'session-id',
        email: 'user@example.com',
        role: Role.USER,
        type: 'access',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the minimal authenticated principal for a live session', async () => {
    const prisma = {
      session: {
        findUnique: jest.fn().mockResolvedValue({
          revokedAt: null,
          expiresAt: new Date(Date.now() + 60_000),
          user: { isLocked: false },
        }),
      },
    };
    const strategy = new JwtStrategy(config as never, prisma as never);
    await expect(
      strategy.validate({
        sub: 'user-id',
        sid: 'session-id',
        email: 'user@example.com',
        role: Role.USER,
        type: 'access',
      }),
    ).resolves.toEqual({
      id: 'user-id',
      sessionId: 'session-id',
      email: 'user@example.com',
      role: Role.USER,
    });
  });
});
