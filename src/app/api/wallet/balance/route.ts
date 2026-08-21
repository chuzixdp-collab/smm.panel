import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, unauthorized, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    // Fetch fresh balance from DB
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });

    return success({ balance: freshUser?.balance ?? 0 });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
