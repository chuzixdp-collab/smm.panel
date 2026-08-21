import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createChildPanelSchema } from '@/lib/validations';
import { success, error, unauthorized, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const panels = await db.childPanel.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return success({ panels });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    // Fetch canCreateChildPanel from DB since getCurrentUser doesn't return it
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: { canCreateChildPanel: true },
    });
    if (!fullUser?.canCreateChildPanel) {
      return error('Child panel creation is not enabled for your account');
    }

    const body = await request.json();
    const parsed = createChildPanelSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { name, slug, title, primaryColor, markup, domain, supportInfo } = parsed.data;

    // Check slug uniqueness
    const existing = await db.childPanel.findUnique({ where: { slug } });
    if (existing) {
      return error('This slug is already taken');
    }

    const panel = await db.childPanel.create({
      data: {
        userId: user.id,
        name,
        slug,
        title,
        primaryColor,
        markup,
        domain: domain || null,
        supportInfo: supportInfo || null,
      },
    });

    return success(panel, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
