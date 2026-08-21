import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

const DEFAULT_SETTINGS: Record<string, string> = {
  site_name: 'ADNAN SMM Panel',
  currency: 'USD',
  affiliate_enabled: 'false',
  affiliate_percentage: '5',
  min_deposit: '1',
  maintenance_mode: 'false',
  announcement: '',
  whatsapp_number: '',
  whatsapp_message: '',
  whatsapp_enabled: 'false',
  support_email: '',
  support_info: '',
};

export async function GET() {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const allSettings = await db.siteSettings.findMany();
    const settingsMap: Record<string, string> = { ...DEFAULT_SETTINGS };

    for (const s of allSettings) {
      settingsMap[s.key] = s.value;
    }

    // Parse boolean/number values
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settingsMap)) {
      if (value === 'true' || value === 'false') {
        result[key] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '') {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }

    return success(result);
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
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return error('Settings object is required');
    }

    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const previousSettings = await db.siteSettings.findMany();
    const previousMap: Record<string, string> = {};
    for (const s of previousSettings) {
      previousMap[s.key] = s.value;
    }

    const upserts = Object.entries(settings).map(([key, value]) =>
      db.siteSettings.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    );

    await Promise.all(upserts);

    await logAudit(
      admin.id,
      'settings.update',
      'site_settings',
      JSON.stringify(previousMap),
      JSON.stringify(settings),
      ip
    );

    return success({ message: 'Settings updated successfully' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
