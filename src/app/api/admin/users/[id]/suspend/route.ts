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

    if (!user.isActive) {
      return error('User is already suspended', 400);
    }

    if (user.role === 'SUPER_ADMIN') {
      return error('Cannot suspend a super admin', 403);
    }

    const updated = await db.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit(
      admin.id,
      'user.suspend',
      id,
      JSON.stringify({ isActive: true }),
      JSON.stringify({ isActive: false }),
      ip
    );

    await createNotification(
      id,
      'Account Suspended',
      'Your account has been suspended by an admin. Please contact support for assistance.',
      'warning'
    );

    return success({ id: updated.id, isActive: updated.isActive });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
