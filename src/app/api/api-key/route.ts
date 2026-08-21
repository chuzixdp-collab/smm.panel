import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const keys = await db.apiKey.findMany({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: {
        id: true,
        keyPrefix: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    // Return first active key or null
    const apiKey = keys[0] || null;
    return success({ apiKey });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function POST() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    // Deactivate any existing keys first (one key per user)
    await db.apiKey.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const rawKey = `sk_${uuidv4().replace(/-/g, '')}`;
    const keyHash = await hashPassword(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const apiKey = await db.apiKey.create({
      data: {
        userId: user.id,
        key: keyHash,
        keyPrefix,
      },
      select: {
        id: true,
        keyPrefix: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    // Return the raw key only once
    return success({ apiKey: { ...apiKey, key: rawKey } }, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
