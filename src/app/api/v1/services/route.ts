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
    const services = await db.service.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        price: true,
        minQuantity: true,
        maxQuantity: true,
        category: true,
        description: true,
        refillAvailable: true,
        cancelAvailable: true,
      },
    });

    const mapped = services.map((s) => ({
      service: s.id,
      name: s.name,
      type: 'Default',
      rate: s.price,
      min: s.minQuantity,
      max: s.maxQuantity,
      category: s.category,
      description: s.description ?? '',
      refill: s.refillAvailable,
      cancel: s.cancelAvailable,
    }));

    return NextResponse.json({ services: mapped });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
