import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, verifyPassword, hashPassword } from '@/lib/auth';
import { updateProfileSchema, changePasswordSchema } from '@/lib/validations';
import { success, error, unauthorized, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    return success(user);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { name } = parsed.data;

    const updated = await db.user.update({
      where: { id: user.id },
      data: { name: name || null },
      select: { id: true, email: true, name: true, role: true, balance: true, isActive: true, createdAt: true },
    });

    return success(updated);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { currentPassword, newPassword } = parsed.data;

    const fullUser = await db.user.findUnique({ where: { id: user.id } });
    if (!fullUser) return unauthorized();

    const valid = await verifyPassword(currentPassword, fullUser.passwordHash);
    if (!valid) {
      return error('Current password is incorrect');
    }

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return success({ message: 'Password updated successfully' });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
