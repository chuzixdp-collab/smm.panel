import { db } from '@/lib/db';
import { success, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const platforms = await db.service.findMany({
      where: { status: 'ACTIVE' },
      select: { platform: true },
      distinct: ['platform'],
      orderBy: { platform: 'asc' },
    });

    return success(platforms.map((p) => p.platform));
  } catch (err) {
    return serverError();
  }
}
