import { db } from '@/lib/db';
import { success, serverError } from '@/lib/api-response';

export async function GET() {
  try {
    const settings = await db.paymentSettings.findMany({
      where: { enabled: true },
      orderBy: { method: 'asc' },
      select: {
        method: true,
        accountNumber: true,
        accountName: true,
        minDeposit: true,
        maxDeposit: true,
        instructions: true,
      },
    });

    const result: Record<string, (typeof settings)[number]> = {};
    for (const s of settings) {
      result[s.method] = s;
    }

    return success(result);
  } catch {
    return serverError();
  }
}
