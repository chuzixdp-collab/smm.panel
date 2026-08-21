import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, unauthorized, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where: { userId: user.id } }),
    ]);

    return success({ notifications, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function PUT() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    return success({ marked: true });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
