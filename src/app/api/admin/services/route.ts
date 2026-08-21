import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { createServiceSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { category: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (platform) {
      where.platform = { contains: platform, mode: Prisma.QueryMode.insensitive };
    }

    if (status) {
      where.status = status as Prisma.EnumServiceStatusFilter['equals'];
    }

    const [services, total] = await Promise.all([
      db.service.findMany({
        where,
        include: {
          provider: {
            select: { id: true, name: true, status: true },
          },
        },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: limit,
      }),
      db.service.count({ where }),
    ]);

    return success({
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
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
    const parsed = createServiceSchema.safeParse(body);

    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const data = parsed.data;

    const service = await db.service.create({
      data: {
        platform: data.platform,
        category: data.category,
        name: data.name,
        description: data.description,
        providerId: data.providerId,
        providerServiceId: data.providerServiceId,
        providerCost: data.providerCost,
        price: data.price,
        resellerPrice: data.resellerPrice,
        minQuantity: data.minQuantity,
        maxQuantity: data.maxQuantity,
        refillAvailable: data.refillAvailable ?? false,
        cancelAvailable: data.cancelAvailable ?? false,
      },
    });

    await logAudit(
      admin.id,
      'service.create',
      service.id,
      undefined,
      JSON.stringify(data),
      ip
    );

    return success(service, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
