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

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        balance: true,
        totalSpent: true,
        isActive: true,
        canCreateChildPanel: true,
        referredBy: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            deposits: true,
            transactions: true,
          },
        },
      },
    });

    if (!user) {
      return error('User not found', 404);
    }

    return success(user);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
