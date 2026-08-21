import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { createProviderSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';

function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export async function GET() {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const providers = await db.provider.findMany({
      orderBy: { priority: 'desc' },
      select: {
        id: true,
        name: true,
        apiUrl: true,
        apiKey: true,
        status: true,
        currency: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { services: true },
        },
      },
    });

    const masked = providers.map((p) => ({
      ...p,
      apiKey: maskApiKey(p.apiKey),
    }));

    return success(masked);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const body = await request.json();
    const parsed = createProviderSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const data = parsed.data;

    const provider = await db.provider.create({
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
      'provider.create',
      provider.id,
      undefined,
      JSON.stringify({ name: data.name, apiUrl: data.apiUrl, currency: data.currency, priority: data.priority }),
      ip
    );

    return success({
      ...provider,
      apiKey: maskApiKey(provider.apiKey),
    }, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
