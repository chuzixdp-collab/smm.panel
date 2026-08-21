import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const { id } = await params;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        service: {
          select: { id: true, name: true, platform: true, category: true },
        },
        provider: {
          select: { id: true, name: true },
        },
      },
    });

    if (!order) {
      return error('Order not found', 404);
    }

    return success(order);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
