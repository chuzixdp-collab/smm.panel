import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { createOrderSchema } from '@/lib/validations';
import { createProviderOrder } from '@/lib/provider';
import { createNotification } from '@/lib/notifications';
import { success, error, unauthorized, serverError } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return error(parsed.error.issues[0].message);
    }

    const { serviceId, targetUrl, quantity } = parsed.data;

    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: { provider: true },
    });
    if (!service) return error('Service not found');
    if (service.status !== 'ACTIVE') return error('Service is not available');
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return error(`Quantity must be between ${service.minQuantity} and ${service.maxQuantity}`);
    }

    // Calculate price server-side — NEVER trust client-sent prices
    const charge = (service.price * quantity) / 1000;

    // Fetch fresh balance
    const freshUser = await db.user.findUnique({ where: { id: user.id }, select: { balance: true } });
    if (!freshUser || freshUser.balance < charge) {
      return error('Insufficient balance');
    }

    const result = await db.$transaction(async (tx) => {
      // Deduct balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: charge } },
      });

      // Create order
      const order = await tx.order.create({
        data: {
          userId: user.id,
          serviceId,
          targetUrl,
          quantity,
          charge,
          status: 'PENDING',
        },
        include: {
          service: { select: { id: true, name: true, platform: true, category: true } },
        },
      });

      // Create ORDER_PAYMENT transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'ORDER_PAYMENT',
          amount: -charge,
          balance: updatedUser.balance,
          reference: order.id,
        },
      });

      // Create notification
      await createNotification(
        user.id,
        'Order Placed',
        `Your order #${order.id.slice(0, 8)} for $${charge.toFixed(2)} has been placed.`,
        'order'
      );

      return { order, newBalance: updatedUser.balance };
    });

    // Try provider order if configured
    if (service.provider && service.providerServiceId) {
      try {
        const providerResult = await createProviderOrder(
          { apiUrl: service.provider.apiUrl, apiKey: service.provider.apiKey },
          service.providerServiceId,
          targetUrl,
          quantity
        );
        await db.order.update({
          where: { id: result.order.id },
          data: {
            providerId: service.provider.id,
            providerOrderId: String(providerResult.order),
            status: 'PROCESSING',
            startCount: providerResult.start_count || 0,
          },
        });
        result.order.status = 'PROCESSING';
        result.order.providerOrderId = String(providerResult.order);
      } catch (providerErr) {
        // Refund on provider failure
        await db.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: user.id },
            data: { balance: { increment: charge } },
          });

          await tx.order.update({
            where: { id: result.order.id },
            data: { status: 'FAILED' },
          });

          await tx.transaction.create({
            data: {
              userId: user.id,
              type: 'REFUND',
              amount: charge,
              balance: updatedUser.balance,
              reference: result.order.id,
            },
          });
        });

        result.order.status = 'FAILED';

        await createNotification(
          user.id,
          'Order Failed',
          `Your order #${result.order.id.slice(0, 8)} failed. You have been refunded $${charge.toFixed(2)}.`
        );
      }
    }

    return success(result.order, 201);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth().catch(() => null);
    if (!user) return unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const countOnly = searchParams.get('count') === 'true';

    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { targetUrl: { contains: search } },
      ];
    }

    // count=true param for dashboard quick count
    if (countOnly) {
      const total = await db.order.count({ where });
      return success({ count: total });
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          service: { select: { id: true, name: true, platform: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return success({ orders, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
