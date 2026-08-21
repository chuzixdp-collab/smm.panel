import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';
import { createProviderSchema } from '@/lib/validations';
import { testProviderConnection } from '@/lib/provider';

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const { id } = await params;

    const provider = await db.provider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { services: true },
        },
      },
    });

    if (!provider) {
      return error('Provider not found', 404);
    }

    return success({
      ...provider,
      apiKey: maskApiKey(provider.apiKey),
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const existing = await db.provider.findUnique({ where: { id } });
    if (!existing) {
      return error('Provider not found', 404);
    }

    const body = await request.json();
    const parsed = createProviderSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const data = parsed.data;
    const previousValues = JSON.stringify({ name: existing.name, apiUrl: existing.apiUrl, currency: existing.currency, priority: existing.priority });

    const provider = await db.provider.update({
      where: { id },
      data: {
        name: data.name,
        apiUrl: data.apiUrl,
        apiKey: data.apiKey,
        currency: data.currency,
        priority: data.priority,
      },
    });

    await logAudit(
      admin.id,
      'provider.update',
      id,
      previousValues,
      JSON.stringify({ name: data.name, apiUrl: data.apiUrl, currency: data.currency, priority: data.priority }),
      ip
    );

    return success({
      ...provider,
      apiKey: maskApiKey(provider.apiKey),
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const provider = await db.provider.findUnique({
      where: { id },
      include: { _count: { select: { services: true } } },
    });

    if (!provider) {
      return error('Provider not found', 404);
    }

    if (provider._count.services > 0) {
      return error('Cannot delete provider with associated services. Remove or reassign services first.', 400);
    }

    await db.provider.delete({ where: { id } });

    await logAudit(
      admin.id,
      'provider.delete',
      id,
      JSON.stringify({ name: provider.name }),
      undefined,
      ip
    );

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const { id } = await params;

    const provider = await db.provider.findUnique({ where: { id } });
    if (!provider) {
      return error('Provider not found', 404);
    }

    const result = await testProviderConnection({
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
    });

    return success(result);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
