import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, setSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { success, error, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return error('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return error('Invalid email or password');
    }

    if (!user.isActive) {
      return error('Account is suspended');
    }

    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      isLoggedIn: true,
    });

    return success({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      balance: user.balance,
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch (err) {
    return serverError();
  }
}
