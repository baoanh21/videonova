import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';

function context(role?: Role): ExecutionContext {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Test {},
    switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows an admin', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) };
    expect(new RolesGuard(reflector as never).canActivate(context(Role.ADMIN))).toBe(true);
  });

  it('forbids a regular user and unauthenticated request', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN]) };
    const guard = new RolesGuard(reflector as never);
    expect(guard.canActivate(context(Role.USER))).toBe(false);
    expect(guard.canActivate(context())).toBe(false);
  });
});
