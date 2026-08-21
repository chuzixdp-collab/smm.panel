import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { replyTicketSchema } from '@/lib/validations';
import { createNotification } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const { id } = await params;
    const body = await request.json();
    const parsed = replyTicketSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) return error('Ticket not found', 404);
    if (ticket.status === 'CLOSED') return error('Cannot reply to a closed ticket');

    await db.supportMessage.create({
      data: {
        ticketId: id,
        userId: admin.id,
        message: parsed.data.message,
      },
    });

    await db.supportTicket.update({
      where: { id },
      data: { status: 'ANSWERED' },
    });

    await createNotification(
      ticket.userId,
      'Ticket Reply',
      `Your ticket "${ticket.subject}" has received a new reply.`,
      'info'
    );

    return success({ message: 'Reply sent' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
