import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        service: { select: { id: true, name: true, platform: true, category: true, price: true } },
      },
    });

    if (!order) {
      return error('Order not found', 404);
    }

    if (order.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return forbidden();
    }

    return success(order);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
