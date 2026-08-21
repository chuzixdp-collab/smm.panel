import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations';
import { success, error, serverError } from '@/lib/api-response';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { email } = parsed.data;

    // Find user but don't reveal if they exist
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const token = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store reset token in SiteSettings keyed by user email
      await db.siteSettings.upsert({
        where: { key: `reset_token_${user.id}` },
        update: { value: JSON.stringify({ token, expiresAt: expiresAt.toISOString() }) },
        create: { key: `reset_token_${user.id}`, value: JSON.stringify({ token, expiresAt: expiresAt.toISOString() }) },
      });

      // In production, send reset email here with the token
      // For now the token is stored and can be verified via reset-password
    }

    // Always return success to avoid email enumeration
    return success({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    return serverError();
  }
}
