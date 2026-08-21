import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { affiliateSettingsSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

const AFFILIATE_KEYS = ['affiliate_enabled', 'affiliate_percentage', 'affiliate_min_payout'];

export async function GET() {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const settings = await db.siteSettings.findMany({
      where: { key: { in: AFFILIATE_KEYS } },
    });

    const map: Record<string, string> = {
      affiliate_enabled: 'false',
      affiliate_percentage: '5',
      affiliate_min_payout: '10',
    };
    for (const s of settings) {
      map[s.key] = s.value;
    }

    return success({
      enabled: map.affiliate_enabled === 'true',
      commissionPercentage: Number(map.affiliate_percentage),
      minPayout: Number(map.affiliate_min_payout),
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const body = await request.json();
    const parsed = affiliateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { commissionPercentage, minPayout, enabled } = parsed.data;
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const previousSettings = await db.siteSettings.findMany({
      where: { key: { in: AFFILIATE_KEYS } },
    });
    const previousMap: Record<string, string> = {};
    for (const s of previousSettings) {
      previousMap[s.key] = s.value;
    }

    await Promise.all([
      db.siteSettings.upsert({
        where: { key: 'affiliate_enabled' },
        create: { key: 'affiliate_enabled', value: String(enabled) },
        update: { value: String(enabled) },
      }),
      db.siteSettings.upsert({
        where: { key: 'affiliate_percentage' },
        create: { key: 'affiliate_percentage', value: String(commissionPercentage) },
        update: { value: String(commissionPercentage) },
      }),
      db.siteSettings.upsert({
        where: { key: 'affiliate_min_payout' },
        create: { key: 'affiliate_min_payout', value: String(minPayout) },
        update: { value: String(minPayout) },
      }),
    ]);

    await logAudit(
      admin.id,
      'affiliate.settings.update',
      'affiliate',
      JSON.stringify(previousMap),
      JSON.stringify({ enabled, commissionPercentage, minPayout }),
      ip
    );

    return success({ message: 'Affiliate settings updated' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
