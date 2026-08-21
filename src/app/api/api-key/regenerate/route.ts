import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { success, error, unauthorized, forbidden, serverError } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const body = await request.json();
    const { keyId } = body;

    if (!keyId) {
      return error('Key ID is required');
    }

    const existingKey = await db.apiKey.findUnique({ where: { id: keyId } });
    if (!existingKey) return error('API key not found', 404);
    if (existingKey.userId !== user.id) return forbidden();

    // Revoke old key
    await db.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    // Generate new key
    const rawKey = `sk_${uuidv4().replace(/-/g, '')}`;
    const keyHash = await hashPassword(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const newApiKey = await db.apiKey.create({
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

    return success({ ...newApiKey, key: rawKey }, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
