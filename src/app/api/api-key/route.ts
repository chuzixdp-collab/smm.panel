import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { success, error, unauthorized, serverError } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const keys = await db.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        keyPrefix: true,
        isActive: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    // Mask the key prefix for display (show first 10 chars of prefix)
    const maskedKeys = keys.map((k) => ({
      ...k,
      maskedKey: `${k.keyPrefix}...`,
    }));

    return success({ keys: maskedKeys });
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

    // Check max 5 API keys per user
    const keyCount = await db.apiKey.count({
      where: { userId: user.id, isActive: true },
    });
    if (keyCount >= 5) {
      return error('Maximum 5 active API keys allowed');
    }

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
        createdAt: true,
      },
    });

    // Return the raw key only once
    return success({ ...apiKey, key: rawKey }, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
