import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalOrders,
      totalRevenueResult,
      pendingDeposits,
      activeServices,
      pendingOrders,
      todayOrders,
      totalProviders,
    ] = await Promise.all([
      db.user.count(),
      db.order.count(),
      db.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { charge: true },
      }),
      db.deposit.count({ where: { status: 'PENDING' } }),
      db.service.count({ where: { status: 'ACTIVE' } }),
      db.order.count({ where: { status: 'PENDING' } }),
      db.order.count({ where: { createdAt: { gte: todayStart } } }),
      db.provider.count(),
    ]);

    void admin;
    void ip;

    return success({
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenueResult._sum.charge || 0,
      pendingDeposits,
      activeServices,
      pendingOrders,
      todayOrders,
      totalProviders,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
