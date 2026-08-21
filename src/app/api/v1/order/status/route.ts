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

  // --- Rate limit: 120/min ------------------------------------
  const rlKey = getRateLimitKey(request, auth);
  const rl = rateLimit(rlKey, 120, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order');

    if (!orderId) {
      return NextResponse.json({ error: 'Parameter "order" is required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId, userId: auth.user.id },
      select: {
        id: true,
        charge: true,
        startCount: true,
        status: true,
        remains: true,
        targetUrl: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      order: order.id,
      charge: order.charge,
      start_count: order.startCount,
      status: order.status,
      remains: order.remains,
      link: order.targetUrl,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
