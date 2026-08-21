import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;

    const result = await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });

    if (result.count === 0) {
      return error('Notification not found', 404);
    }

    return success({ marked: true });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
