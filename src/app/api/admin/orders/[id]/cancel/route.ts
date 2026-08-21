import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';
import { cancelProviderOrder } from '@/lib/provider';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, balance: true } },
        service: { select: { id: true, name: true, cancelAvailable: true } },
        provider: true,
      },
    });

    if (!order) {
      return error('Order not found', 404);
    }

    if (order.status === 'CANCELLED' || order.status === 'COMPLETED' || order.status === 'REFUNDED') {
      return error(`Cannot cancel order with status: ${order.status}`, 400);
    }

    // Attempt provider cancellation if provider exists
    if (order.provider && order.providerOrderId) {
      try {
        await cancelProviderOrder(
          { apiUrl: order.provider.apiUrl, apiKey: order.provider.apiKey },
          order.providerOrderId
        );
      } catch (providerErr) {
        // Log provider error but continue with local cancellation
        const msg = providerErr instanceof Error ? providerErr.message : 'Provider cancel failed';
        void msg;
      }
    }

    const refundAmount = order.charge;
    const previousStatus = order.status;

    const result = await db.$transaction(async (tx) => {
      // Update order status and set refund amount
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          refundAmount,
        },
      });

      // Refund user balance
      const newBalance = order.user.balance + refundAmount;

      await tx.user.update({
        where: { id: order.userId },
        data: { balance: newBalance },
      });

      // Create refund transaction
      await tx.transaction.create({
        data: {
          userId: order.userId,
          type: 'REFUND',
          amount: refundAmount,
          balance: newBalance,
          reference: `Order #${id} cancelled by admin`,
        },
      });

      return { updated, newBalance };
    });

    await logAudit(
      admin.id,
      'order.cancel',
      id,
      JSON.stringify({ status: previousStatus, charge: order.charge }),
      JSON.stringify({ status: 'CANCELLED', refundAmount }),
      ip
    );

    await createNotification(
      order.userId,
      'Order Cancelled',
      `Your order #${id.slice(0, 8)} for "${order.service.name}" has been cancelled by an admin. $${refundAmount.toFixed(2)} has been refunded to your balance.`,
      'warning'
    );

    return success({
      id: result.updated.id,
      status: result.updated.status,
      refundAmount,
      newBalance: result.newBalance,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
