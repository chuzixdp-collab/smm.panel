import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { targetUrl: { contains: search } },
        { providerOrderId: { contains: search } },
      ];
    }

    if (status) {
      where.status = status as Prisma.EnumOrderStatusFilter['equals'];
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Prisma.DateTimeNullableFilter).gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Prisma.DateTimeNullableFilter).lte = end;
      }
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
          service: {
            select: { id: true, name: true, platform: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return success({
      orders,
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
