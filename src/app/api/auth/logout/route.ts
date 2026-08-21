import { destroySession } from '@/lib/auth';
import { success, serverError } from '@/lib/api-response';

export async function POST() {
  try {
    await destroySession();
    return success({ message: 'Logged out' });
  } catch (err) {
    return serverError();
  }
}
