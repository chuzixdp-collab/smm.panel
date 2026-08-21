import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { getProviderOrderStatus } from '@/lib/provider';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const { id } = await params;
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const order = await db.order.findUnique({
      where: { id },
      include: {
        provider: true,
        user: { select: { id: true, email: true, balance: true } },
      },
    });

    if (!order) return error('Order not found', 404);

    if (!order.provider || !order.providerOrderId) {
      return error('Order has no provider connection or provider order ID');
    }

    const statusResult = await getProviderOrderStatus(
      { apiUrl: order.provider.apiUrl, apiKey: order.provider.apiKey },
      order.providerOrderId
    );

    const providerStatus = statusResult.status?.toUpperCase();
    const startCount = parseInt(statusResult.start_count) || 0;
    const remains = parseInt(statusResult.remains) || 0;

    let newOrderStatus = order.status;
    let refundAmount = 0;

    if (providerStatus === 'COMPLETED' || providerStatus === 'COMPLETE') {
      newOrderStatus = 'COMPLETED';
    } else if (providerStatus === 'PARTIAL') {
      newOrderStatus = 'PARTIAL';
      // Refund for the remaining quantity
      if (remains > 0) {
        const perUnitCharge = order.charge / order.quantity;
        refundAmount = Math.floor(remains * perUnitCharge * 100) / 100;
      }
    } else if (providerStatus === 'CANCELED' || providerStatus === 'CANCELLED' || providerStatus === 'ERROR' || providerStatus === 'FAILED') {
      newOrderStatus = 'FAILED';
      refundAmount = order.charge;
    } else if (providerStatus === 'IN_PROGRESS' || providerStatus === 'PROCESSING' || providerStatus === 'PENDING') {
      newOrderStatus = 'PROCESSING';
    }

    const previousValue = JSON.stringify({ status: order.status, startCount: order.startCount, remains: order.remains });

    if (refundAmount > 0) {
      await db.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
          where: { id: order.userId },
          data: { balance: { increment: refundAmount } },
        });

        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: 'REFUND',
            amount: refundAmount,
            balance: updatedUser.balance,
            reference: `Partial refund for order #${id}`,
          },
        });

        await tx.order.update({
          where: { id },
          data: {
            status: newOrderStatus,
            startCount,
            remains,
            refundAmount,
          },
        });
      });
    } else {
      await db.order.update({
        where: { id },
        data: {
          status: newOrderStatus,
          startCount,
          remains,
        },
      });
    }

    await logAudit(
      admin.id,
      'order.refresh',
      id,
      previousValue,
      JSON.stringify({ status: newOrderStatus, startCount, remains, refundAmount }),
      ip
    );

    return success({
      message: 'Order status refreshed',
      previousStatus: order.status,
      newStatus: newOrderStatus,
      providerStatus,
      startCount,
      remains,
      refundAmount,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
