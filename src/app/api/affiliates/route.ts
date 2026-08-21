import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { success, unauthorized, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const [referralCount, totalEarned, pendingPayout] = await Promise.all([
      db.affiliate.count({
        where: { referrerId: user.id },
      }),
      db.affiliateCommission.aggregate({
        where: { userId: user.id },
        _sum: { amount: true },
      }),
      db.affiliateCommission.aggregate({
        where: { userId: user.id, status: 'PENDING' },
        _sum: { amount: true },
      }),
    ]);

    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL || ''}/?ref=${user.email}`;

    return success({
      referralCode: user.email,
      referralLink,
      referralCount,
      totalEarned: totalEarned._sum.amount || 0,
      pendingPayout: pendingPayout._sum.amount || 0,
    });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
