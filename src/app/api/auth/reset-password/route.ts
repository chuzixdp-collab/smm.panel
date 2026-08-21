import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validations';
import { success, error, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { token, password } = parsed.data;

    // Find the setting that contains this token
    const settings = await db.siteSettings.findMany({
      where: { key: { startsWith: 'reset_token_' } },
    });

    let userId: string | null = null;

    for (const setting of settings) {
      try {
        const data = JSON.parse(setting.value) as { token: string; expiresAt: string };
        if (data.token === token) {
          const expiresAt = new Date(data.expiresAt);
          if (expiresAt > new Date()) {
            userId = setting.key.replace('reset_token_', '');
            break;
          }
        }
      } catch {
        // skip invalid JSON
      }
    }

    if (!userId) {
      return error('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(password);

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      db.siteSettings.delete({
        where: { key: `reset_token_${userId}` },
      }),
    ]);

    return success({ message: 'Password has been reset successfully.' });
  } catch (err) {
    return serverError();
  }
}
