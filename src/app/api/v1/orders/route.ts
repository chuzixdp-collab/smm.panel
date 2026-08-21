import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { authenticateApiKey, getRateLimitKey } from '@/lib/api-auth';

export async function GET(request: Request) {
  // --- Auth ---------------------------------------------------
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  // --- Rate limit: 60/min ------------------------------------
  const rlKey = getRateLimitKey(request, auth);
  const rl = rateLimit(rlKey, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const ordersParam = searchParams.get('orders');

    if (!ordersParam) {
      return NextResponse.json({ error: 'Parameter "orders" is required' }, { status: 400 });
    }

    const orderIds = ordersParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'No valid order IDs provided' }, { status: 400 });
    }

    // Cap at 100 IDs to prevent abuse
    const cappedIds = orderIds.slice(0, 100);

    const orders = await db.order.findMany({
      where: {
        id: { in: cappedIds },
        userId: auth.user.id,
      },
      select: {
        id: true,
        charge: true,
        startCount: true,
        status: true,
        remains: true,
      },
    });

    const mapped = orders.map((o) => ({
      order: o.id,
      charge: o.charge,
      start_count: o.startCount,
      status: o.status,
      remains: o.remains,
    }));

    return NextResponse.json({ orders: mapped });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
