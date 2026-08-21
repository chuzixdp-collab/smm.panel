import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return error('Service not found', 404);
    }

    const newStatus = existing.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const service = await db.service.update({
      where: { id },
      data: { status: newStatus },
    });

    await logAudit(
      admin.id,
      'service.toggle',
      id,
      JSON.stringify({ status: existing.status }),
      JSON.stringify({ status: newStatus }),
      ip
    );

    return success({ id: service.id, status: service.status });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
