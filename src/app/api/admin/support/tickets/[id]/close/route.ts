import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) return error('Ticket not found', 404);
    if (ticket.status === 'CLOSED') return error('Ticket is already closed');

    await db.supportTicket.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    await createNotification(
      ticket.userId,
      'Ticket Closed',
      `Your ticket "${ticket.subject}" has been closed.`,
      'info'
    );

    return success({ message: 'Ticket closed' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
