import { PrismaClient, Role, TransactionStatus, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD is empty; admin seed skipped.');
    return;
  }
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must contain at least 12 characters');
  const user = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, isLocked: false },
    create: {
      email,
      fullName: process.env.ADMIN_FULL_NAME || 'VideoNova Admin',
      passwordHash: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
      creditBalance: 1000,
    },
  });
  const hasInitialCredit = await prisma.creditTransaction.findUnique({
    where: { idempotencyKey: `seed:${user.id}:initial-credit` },
  });
  if (!hasInitialCredit) {
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: TransactionType.CREDIT,
        status: TransactionStatus.COMPLETED,
        creditAmount: user.creditBalance,
        balanceAfter: user.creditBalance,
        description: 'Initial admin seed credit',
        idempotencyKey: `seed:${user.id}:initial-credit`,
      },
    });
  }
  console.log(`Admin ready: ${email}`);
}

void main().finally(() => prisma.$disconnect());
