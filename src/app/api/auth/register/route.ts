import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, setSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { success, error, serverError } from '@/lib/api-response';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { email, password, name, referralCode } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) return error('Email already registered');

    let referrerId: string | undefined;
    if (referralCode) {
      const referrer = await db.user.findFirst({ where: { email: referralCode } });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
        role: 'USER',
        balance: 0,
        referredBy: referralCode || null,
      },
      select: {
        id: true, email: true, name: true, role: true,
        balance: true, isActive: true, createdAt: true,
      },
    });

    if (referrerId) {
      await db.affiliate.create({
        data: { referrerId, referredId: user.id, commission: 0 },
      });
      await createNotification(referrerId, 'New Referral', `Someone joined using your referral code!`);
    }

    await setSession({
      userId: user.id, email: user.email, role: user.role, isLoggedIn: true,
    });

    return success(user, 201);
  } catch (err) {
    return serverError();
  }
}
