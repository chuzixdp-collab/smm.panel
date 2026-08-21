import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { success, serverError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    const user = await getCurrentUser();
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

    const where: Record<string, unknown> = {};
    if (!isAdmin) {
      where.status = 'ACTIVE';
    }
    if (platform) {
      where.platform = platform;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.name = { contains: search };
    }

    const [services, total] = await Promise.all([
      db.service.findMany({
        where,
        include: {
          provider: { select: { id: true, name: true } },
        },
        orderBy: { sortOrder: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.service.count({ where }),
    ]);

    return success({ services, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    return serverError();
  }
}
