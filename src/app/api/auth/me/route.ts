import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { success, unauthorized, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const sess = await getSession();
    if (!sess.isLoggedIn || !sess.userId) {
      return unauthorized();
    }

    const user = await db.user.findUnique({
      where: { id: sess.userId },
      select: {
        id: true, email: true, name: true, role: true,
        balance: true, isActive: true, createdAt: true,
      },
    });

    if (!user) {
      return unauthorized();
    }

    return success(user);
  } catch (err) {
    return serverError();
  }
}
