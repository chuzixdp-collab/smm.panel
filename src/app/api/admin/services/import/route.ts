import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, unauthorized, serverError } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';

interface ImportService {
  service: number;
  name: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  category: string;
  refill: boolean;
  cancel: boolean;
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const body = await request.json();
    const { providerId, services, markupPercent = 0, platform } = body;

    if (!providerId || !Array.isArray(services) || services.length === 0) {
      return error('providerId and services array are required');
    }

    if (services.length > 500) {
      return error('Maximum 500 services can be imported at once');
    }

    // Verify provider exists
    const provider = await db.provider.findUnique({ where: { id: providerId } });
    if (!provider) {
      return error('Provider not found', 404);
    }

    const markup = Number(markupPercent) || 0;
    const markupMultiplier = 1 + (markup / 100);

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const svc of services as ImportService[]) {
      try {
        // Skip services with no valid data
        if (!svc.service || !svc.name || !svc.rate) {
          skipped++;
          continue;
        }

        const providerCost = Number(svc.rate) / 1000; // rate is per 1000
        const sellingPrice = providerCost * markupMultiplier;

        // Determine platform from category or use the one provided
        const detectedPlatform = platform || detectPlatform(svc.category);

        await db.service.create({
          data: {
            platform: detectedPlatform,
            category: svc.category || 'General',
            name: svc.name,
            providerId: providerId,
            providerServiceId: String(svc.service),
            providerCost,
            price: Math.round(sellingPrice * 10000) / 10000, // 4 decimal places
            minQuantity: Number(svc.min) || 1,
            maxQuantity: Number(svc.max) || 10000,
            refillAvailable: Boolean(svc.refill),
            cancelAvailable: Boolean(svc.cancel),
            status: 'ACTIVE',
          },
        });
        created++;
      } catch (err) {
        skipped++;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Service ${svc.service}: ${msg}`);
      }
    }

    await logAudit(
      admin.id,
      'services.import',
      providerId,
      undefined,
      JSON.stringify({ providerName: provider.name, created, skipped, total: services.length }),
      ip
    );

    return success({
      providerName: provider.name,
      created,
      skipped,
      total: services.length,
      errors: errors.slice(0, 10), // Return first 10 errors only
    }, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

function detectPlatform(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('instagram') || cat.includes('ig ')) return 'Instagram';
  if (cat.includes('tiktok') || cat.includes('tik')) return 'TikTok';
  if (cat.includes('youtube') || cat.includes('yt ')) return 'YouTube';
  if (cat.includes('facebook') || cat.includes('fb ')) return 'Facebook';
  if (cat.includes('telegram') || cat.includes('tg ')) return 'Telegram';
  if (cat.includes('twitter') || cat.includes('tweet')) return 'Twitter';
  if (cat.includes('twitch')) return 'Twitch';
  if (cat.includes('snapchat')) return 'Snapchat';
  if (cat.includes('threads')) return 'Threads';
  if (cat.includes('pinterest')) return 'Pinterest';
  if (cat.includes('reddit')) return 'Reddit';
  if (cat.includes('linkedin')) return 'LinkedIn';
  if (cat.includes('spotify')) return 'Spotify';
  if (cat.includes('discord')) return 'Discord';
  if (cat.includes('soundcloud')) return 'SoundCloud';
  return 'Other';
}
