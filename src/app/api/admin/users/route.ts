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
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (role) {
      where.role = role as Prisma.EnumUserRoleFilter['equals'];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'suspended') {
      where.isActive = false;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          totalSpent: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              orders: true,
              deposits: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return success({
      users,
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
