import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, unauthorized, serverError } from '@/lib/api-response';

export async function POST() {
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
