import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { approveRejectDepositSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const { id } = await params;
    const body = await request.json();
    const parsed = approveRejectDepositSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { adminNote } = parsed.data;
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const deposit = await db.deposit.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true, balance: true } } },
    });

    if (!deposit) return error('Deposit not found', 404);
    if (deposit.status !== 'PENDING') return error(`Cannot approve deposit with status: ${deposit.status}`);

    const previousValue = JSON.stringify({ status: deposit.status, balance: deposit.user.balance });

    const result = await db.$transaction(async (tx) => {
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: {
          status: 'APPROVED',
          adminNote,
          processedAt: new Date(),
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: deposit.userId },
        data: { balance: { increment: deposit.amount } },
      });

      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          amount: deposit.amount,
          balance: updatedUser.balance,
          depositId: id,
          reference: `Deposit #${deposit.transactionId}`,
        },
      });

      return { updatedDeposit, newBalance: updatedUser.balance };
    });

    await logAudit(
      admin.id,
      'deposit.approve',
      id,
      previousValue,
      JSON.stringify({ status: 'APPROVED', balance: result.newBalance, adminNote }),
      ip
    );

    await createNotification(
      deposit.userId,
      'Deposit Approved',
      `Your deposit of $${deposit.amount} has been approved and added to your balance.`,
      'success'
    );

    return success({ message: 'Deposit approved', deposit: result.updatedDeposit, newBalance: result.newBalance });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
