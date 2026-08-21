import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) return error('Ticket not found', 404);

    if (ticket.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return forbidden();
    }

    if (ticket.status === 'CLOSED') {
      return error('Ticket is already closed');
    }

    const updated = await db.supportTicket.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    return success(updated);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
