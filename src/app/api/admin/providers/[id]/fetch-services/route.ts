import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, unauthorized, serverError } from '@/lib/api-response';
import { getProviderServices } from '@/lib/provider';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;

    const provider = await db.provider.findUnique({ where: { id } });
    if (!provider) {
      return error('Provider not found', 404);
    }

    if (provider.status !== 'ACTIVE') {
      return error('Provider is not active', 400);
    }

    const services = await getProviderServices({
      apiUrl: provider.apiUrl,
      apiKey: provider.apiKey,
    });

    return success({
      providerId: provider.id,
      providerName: provider.name,
      count: services.length,
      services,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    const msg = err instanceof Error ? err.message : 'Failed to fetch provider services';
    return error(msg, 500);
  }
}
