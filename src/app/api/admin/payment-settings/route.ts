import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { updatePaymentSettingsSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const settings = await db.paymentSettings.findMany({
      orderBy: { method: 'asc' },
    });

    return success(settings);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const body = await request.json();
    const { method, ...settingsData } = body;

    if (!method) return error('Payment method is required');

    const parsed = updatePaymentSettingsSchema.safeParse(settingsData);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const existing = await db.paymentSettings.findUnique({ where: { method } });
    const previousValue = existing ? JSON.stringify(existing) : undefined;

    const settings = await db.paymentSettings.upsert({
      where: { method },
      create: { method, ...parsed.data },
      update: parsed.data,
    });

    await logAudit(admin.id, 'payment_settings.update', method, previousValue, JSON.stringify(settings), ip);

    return success(settings);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
