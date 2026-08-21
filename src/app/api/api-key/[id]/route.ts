import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/api-response';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;

    const apiKey = await db.apiKey.findUnique({ where: { id } });
    if (!apiKey) return error('API key not found', 404);
    if (apiKey.userId !== user.id) return forbidden();

    await db.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return success({ message: 'API key revoked' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
