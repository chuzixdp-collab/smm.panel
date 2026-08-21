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
    // Fetch fresh balance
    const user = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { balance: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: user.balance,
      currency: 'USD',
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
