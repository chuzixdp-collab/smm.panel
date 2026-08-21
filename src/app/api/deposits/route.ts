import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createDepositSchema } from '@/lib/validations';
import { success, error, unauthorized, serverError } from '@/lib/api-response';

// Server-side minimum deposit constant — enforced regardless of frontend
const MIN_DEPOSIT = 1.00;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createDepositSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { amount, paymentMethod, transactionId, screenshot } = parsed.data;

    // Hard server-side minimum enforcement
    if (amount < MIN_DEPOSIT) {
      return error(`Minimum deposit is $${MIN_DEPOSIT.toFixed(2)}`);
    }

    // Verify payment method exists and is enabled
    const paymentSetting = await db.paymentSettings.findUnique({
      where: { method: paymentMethod as 'JAZZCASH' | 'EASYPAISA' },
    });
    if (!paymentSetting || !paymentSetting.enabled) {
      return error('This payment method is not available');
    }
    // Also enforce the payment method's own min (if higher than global MIN_DEPOSIT)
    const effectiveMin = Math.max(MIN_DEPOSIT, paymentSetting.minDeposit);
    if (amount < effectiveMin) {
      return error(`Minimum deposit is $${effectiveMin.toFixed(2)}`);
    }
    if (amount > paymentSetting.maxDeposit) {
      return error(`Maximum deposit for ${paymentMethod} is $${paymentSetting.maxDeposit}`);
    }

    // Duplicate transaction ID protection
    const existing = await db.deposit.findUnique({ where: { transactionId } });
    if (existing) {
      return error('This transaction ID has already been submitted');
    }

    const deposit = await db.deposit.create({
      data: {
        userId: user.id,
        amount,
        paymentMethod: paymentMethod as 'JAZZCASH' | 'EASYPAISA',
        transactionId,
        screenshot: screenshot || null,
        status: 'PENDING',
      },
    });

    return success(deposit, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = { userId: user.id };

    const [deposits, total] = await Promise.all([
      db.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.deposit.count({ where }),
    ]);

    return success({ deposits, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
