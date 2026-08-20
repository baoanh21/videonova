import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from '../src/health/health.controller';

describe('HealthController', () => {
  it('returns liveness without external dependencies', () => {
    const controller = new HealthController({} as never);
    expect(controller.live()).toMatchObject({ status: 'ok', service: 'videonova-api' });
  });

  it('returns readiness when the database responds', async () => {
    const prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    await expect(new HealthController(prisma as never).ready()).resolves.toMatchObject({
      database: 'up',
    });
  });

  it('reports unavailable when the database fails', async () => {
    const prisma = { $queryRaw: jest.fn().mockRejectedValue(new Error('offline')) };
    await expect(new HealthController(prisma as never).ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
