import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

export interface SessionData {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isLoggedIn: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET || 'adnan-smm-panel-super-secret-key-change-in-production-2024',
  cookieName: 'adnan_smm_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  },
};

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const sess = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return sess as unknown as SessionData;
}

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  const sess = await getIronSession<SessionData>(cookieStore, sessionOptions);
  Object.assign(sess, data);
  await sess.save();
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sess = await getIronSession<SessionData>(cookieStore, sessionOptions);
  sess.destroy();
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  const sess = await getSession();
  if (!sess.isLoggedIn || !sess.userId) return null;
  return db.user.findUnique({
    where: { id: sess.userId },
    select: {
      id: true, email: true, name: true, role: true,
      balance: true, isActive: true, createdAt: true,
    },
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new Error('Unauthorized');
  if (!user.isActive) throw new Error('Account suspended');
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden');
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireAuth();
  if (user.role !== 'SUPER_ADMIN') throw new Error('Forbidden');
  return user;
}
