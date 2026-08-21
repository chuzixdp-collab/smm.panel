import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    balance: number;
    isActive: boolean;
  };
  apiKey: {
    id: string;
    keyPrefix: string;
  };
}

/**
 * Authenticate an API key from either query param (?key=sk_xxxx)
 * or Authorization header (Bearer sk_xxxx).
 *
 * Lookup strategy: extract prefix (first 8 chars after "sk_") → find active
 * ApiKey by prefix → bcrypt.compare the full key → return user + apiKey.
 */
export async function authenticateApiKey(
  request: Request
): Promise<AuthResult | null> {
  // --- Extract the raw API key --------------------------------
  const url = new URL(request.url);
  let rawKey = url.searchParams.get('key');

  if (!rawKey) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      rawKey = authHeader.slice(7).trim();
    }
  }

  if (!rawKey) return null;

  // API keys must start with "sk_"
  if (!rawKey.startsWith('sk_')) return null;

  // --- Derive prefix (first 8 chars after "sk_") ---------------
  const prefix = rawKey.slice(3, 11); // "sk_" is 3 chars, take next 8

  const apiKeyRow = await db.apiKey.findFirst({
    where: { keyPrefix: prefix, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          balance: true,
          isActive: true,
        },
      },
    },
  });

  if (!apiKeyRow || !apiKeyRow.isActive) return null;
  if (!apiKeyRow.user.isActive) return null;

  // --- Bcrypt compare -------------------------------------------
  const valid = await bcrypt.compare(rawKey, apiKeyRow.key);
  if (!valid) return null;

  // --- Update lastUsed (fire-and-forget) -----------------------
  db.apiKey.update({
    where: { id: apiKeyRow.id },
    data: { lastUsed: new Date() },
  }).catch(() => {});

  return {
    user: apiKeyRow.user,
    apiKey: { id: apiKeyRow.id, keyPrefix: apiKeyRow.keyPrefix },
  };
}

/**
 * Resolve the rate-limit key for an API-key-authenticated request.
 * Falls back to IP so the limiter still works without a key.
 */
export function getRateLimitKey(request: Request, auth: AuthResult | null): string {
  if (auth) return `apikey:${auth.apiKey.id}`;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return `ip:${forwarded.split(',')[0].trim()}`;
  return 'ip:unknown';
}
