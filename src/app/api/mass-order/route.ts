import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { massOrderSchema } from '@/lib/validations';
import { createProviderOrder } from '@/lib/provider';
import { success, error, unauthorized, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = massOrderSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { orders: orderLines } = parsed.data;

    // Fetch fresh balance
    const freshUser = await db.user.findUnique({
      where: { id: user.id },
      select: { balance: true },
    });
    if (!freshUser) return unauthorized();

    // Validate ALL lines first and calculate total charge
    const validatedLines: Array<{
      line: number;
      serviceId: string;
      link: string;
      quantity: number;
      charge: number;
      error?: string;
      service?: { providerId: string | null; providerServiceId: string | null; provider: { apiUrl: string; apiKey: string; id: string } | null };
    }> = [];

    let totalCharge = 0;

    for (let i = 0; i < orderLines.length; i++) {
      const line = orderLines[i];
      const service = await db.service.findUnique({
        where: { id: line.serviceId },
        include: { provider: true },
      });

      if (!service) {
        validatedLines.push({ line: i + 1, serviceId: line.serviceId, link: line.link, quantity: line.quantity, charge: 0, error: 'Service not found' });
        continue;
      }

      if (service.status !== 'ACTIVE') {
        validatedLines.push({ line: i + 1, serviceId: line.serviceId, link: line.link, quantity: line.quantity, charge: 0, error: 'Service is not available' });
        continue;
      }

      if (line.quantity < service.minQuantity || line.quantity > service.maxQuantity) {
        validatedLines.push({ line: i + 1, serviceId: line.serviceId, link: line.link, quantity: line.quantity, charge: 0, error: `Quantity must be between ${service.minQuantity} and ${service.maxQuantity}` });
        continue;
      }

      const charge = (service.price * line.quantity) / 1000;
      totalCharge += charge;

      validatedLines.push({
        line: i + 1,
        serviceId: line.serviceId,
        link: line.link,
        quantity: line.quantity,
        charge,
        service: service as NonNullable<typeof service>,
      });
    }

    const failedLines = validatedLines.filter((l) => l.error);
    const successLines = validatedLines.filter((l) => !l.error);

    if (successLines.length === 0) {
      return error('All orders have validation errors');
    }

    if (freshUser.balance < totalCharge) {
      return error(`Insufficient balance. Required: $${totalCharge.toFixed(2)}, Available: $${freshUser.balance.toFixed(2)}`);
    }

    // Execute in transaction
    const results = await db.$transaction(async (tx) => {
      const output: Array<{ line: number; success: boolean; orderId?: string; error?: string }> = [];

      for (const vl of validatedLines) {
        if (vl.error) {
          output.push({ line: vl.line, success: false, error: vl.error });
          continue;
        }

        const newBalance = freshUser.balance - totalCharge + successLines
          .filter((sl) => sl.line <= vl.line)
          .reduce((sum, sl) => sum + sl.charge, 0);

        const order = await tx.order.create({
          data: {
            userId: user.id,
            serviceId: vl.serviceId,
            targetUrl: vl.link,
            quantity: vl.quantity,
            charge: vl.charge,
            status: 'PENDING',
          },
          include: { service: { select: { id: true, name: true, platform: true, category: true } } },
        });

        await tx.transaction.create({
          data: {
            userId: user.id,
            type: 'ORDER_PAYMENT',
            amount: -vl.charge,
            balance: newBalance,
            reference: order.id,
          },
        });

        output.push({ line: vl.line, success: true, orderId: order.id });
      }

      // Deduct total balance once at the end
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: totalCharge }, totalSpent: { increment: totalCharge } },
      });

      return output;
    });

    // Async: call provider APIs for successful orders
    for (let i = 0; i < validatedLines.length; i++) {
      const vl = validatedLines[i];
      if (vl.error || !vl.service?.provider || !vl.service?.providerServiceId) continue;

      const orderId = results[i]?.orderId;
      if (!orderId) continue;

      try {
        const providerResult = await createProviderOrder(
          { apiUrl: vl.service.provider.apiUrl, apiKey: vl.service.provider.apiKey },
          vl.service.providerServiceId,
          vl.link,
          vl.quantity
        );
        await db.order.update({
          where: { id: orderId },
          data: {
            providerId: vl.service.provider.id,
            providerOrderId: String(providerResult.order),
            status: 'PROCESSING',
            startCount: providerResult.start_count || 0,
          },
        });
      } catch {
        // Provider failure — don't block other orders
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return success({ successCount, failedCount, totalCharge, results });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
