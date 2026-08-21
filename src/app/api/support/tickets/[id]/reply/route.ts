import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { replyTicketSchema } from '@/lib/validations';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/api-response';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const parsed = replyTicketSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { message } = parsed.data;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) return error('Ticket not found', 404);

    if (ticket.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return forbidden();
    }

    if (ticket.status === 'CLOSED') {
      return error('Ticket is closed');
    }

    const msg = await db.supportMessage.create({
      data: {
        ticketId: id,
        userId: user.id,
        message,
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    // If user replies, set status back to OPEN
    if (user.role === 'USER') {
      await db.supportTicket.update({
        where: { id },
        data: { status: 'OPEN' },
      });
    } else {
      await db.supportTicket.update({
        where: { id },
        data: { status: 'ANSWERED' },
      });
    }

    return success(msg, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
