import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { createNotification } from '@/lib/notifications';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const user = await db.user.findUnique({ where: { id } });
    if (!user) {
      return error('User not found', 404);
    }

    if (user.isActive) {
      return error('User is already active', 400);
    }

    const updated = await db.user.update({
      where: { id },
      data: { isActive: true },
    });

    await logAudit(
      admin.id,
      'user.activate',
      id,
      JSON.stringify({ isActive: false }),
      JSON.stringify({ isActive: true }),
      ip
    );

    await createNotification(
      id,
      'Account Activated',
      'Your account has been reactivated. You can now log in and use all features.',
      'success'
    );

    return success({ id: updated.id, isActive: updated.isActive });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
