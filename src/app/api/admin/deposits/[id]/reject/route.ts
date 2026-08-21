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

    const deposit = await db.deposit.findUnique({ where: { id } });
    if (!deposit) return error('Deposit not found', 404);
    if (deposit.status !== 'PENDING') return error(`Cannot reject deposit with status: ${deposit.status}`);

    const previousValue = JSON.stringify({ status: deposit.status });

    const updated = await db.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNote,
        processedAt: new Date(),
      },
    });

    await logAudit(
      admin.id,
      'deposit.reject',
      id,
      previousValue,
      JSON.stringify({ status: 'REJECTED', adminNote }),
      ip
    );

    await createNotification(
      deposit.userId,
      'Deposit Rejected',
      `Your deposit of $${deposit.amount} has been rejected.${adminNote ? ` Reason: ${adminNote}` : ''}`,
      'error'
    );

    return success({ message: 'Deposit rejected', deposit: updated });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
