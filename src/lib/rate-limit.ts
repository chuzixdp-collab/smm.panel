const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  ip: string,
  limit: number = 60,
  windowMs: number = 60000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimiter.get(ip);

  // No existing record or window has expired — reset
  if (!record || now > record.resetTime) {
    rateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // Within window — check limit
  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}

// Cleanup stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimiter.entries()) {
    if (now > record.resetTime) rateLimiter.delete(key);
  }
}, 5 * 60 * 1000);
