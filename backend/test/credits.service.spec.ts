import { TransactionType } from '@prisma/client';
import { CreditsService } from '../src/credits/credits.service';

describe('CreditsService atomic ledger', () => {
  it('returns an existing transaction for the same idempotency key without charging twice', async () => {
    const existing = { id: 'tx-1', creditAmount: -1 };
    const tx = {
      creditTransaction: { findUnique: jest.fn().mockResolvedValue(existing), create: jest.fn() },
      user: { updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const result = await new CreditsService(prisma as never).debit('user', 1, 'same-key', 'test');
    expect(result).toBe(existing);
    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });

  it('updates balance and ledger in one serializable transaction', async () => {
    const tx = {
      creditTransaction: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(({ data }) => data),
      },
      user: { update: jest.fn().mockResolvedValue({ creditBalance: 15 }) },
    };
    const prisma = { $transaction: jest.fn((callback) => callback(tx)) };
    const result = await new CreditsService(prisma as never).credit(
      'user',
      5,
      'key',
      'refund',
      TransactionType.REFUND,
    );
    expect(result).toMatchObject({
      creditAmount: 5,
      balanceAfter: 15,
      type: TransactionType.REFUND,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
