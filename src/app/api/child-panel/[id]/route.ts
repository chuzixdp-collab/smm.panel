import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;

    const panel = await db.childPanel.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, orders: true } },
      },
    });

    if (!panel) return error('Child panel not found', 404);
    if (panel.userId !== user.id) return forbidden();

    return success(panel);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const panel = await db.childPanel.findUnique({ where: { id } });
    if (!panel) return error('Child panel not found', 404);
    if (panel.userId !== user.id) return forbidden();

    const { name, title, primaryColor, markup, domain, supportInfo } = body;

    const updated = await db.childPanel.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(title !== undefined && { title }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(markup !== undefined && { markup }),
        ...(domain !== undefined && { domain }),
        ...(supportInfo !== undefined && { supportInfo }),
      },
    });

    return success(updated);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { id } = await params;

    const panel = await db.childPanel.findUnique({ where: { id } });
    if (!panel) return error('Child panel not found', 404);
    if (panel.userId !== user.id) return forbidden();

    await db.childPanel.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return success({ message: 'Child panel deactivated' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
