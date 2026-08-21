import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { adjustBalanceSchema } from '@/lib/validations';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const body = await request.json();
    const parsed = adjustBalanceSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { amount, reason } = parsed.data;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return error('User not found', 404);
    }

    if (amount < 0 && user.balance + amount < 0) {
      return error('Insufficient balance for this deduction', 400);
    }

    const previousBalance = user.balance;
    const newBalance = previousBalance + amount;

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          userId: id,
          type: 'ADMIN_ADJUSTMENT',
          amount,
          balance: newBalance,
          reference: reason,
        },
      });

      return updated;
    });

    await logAudit(
      admin.id,
      'user.adjust_balance',
      id,
      JSON.stringify({ balance: previousBalance }),
      JSON.stringify({ balance: newBalance, amount, reason }),
      ip
    );

    const adjustmentType = amount >= 0 ? 'added to' : 'deducted from';
    await createNotification(
      id,
      'Balance Adjusted',
      `An admin has ${adjustmentType} your balance: $${Math.abs(amount).toFixed(2)}. Reason: ${reason}. Your new balance is $${newBalance.toFixed(2)}.`,
      amount >= 0 ? 'success' : 'warning'
    );

    return success({
      id: result.id,
      balance: result.balance,
      previousBalance,
      adjustment: amount,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
