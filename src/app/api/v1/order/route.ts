import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { authenticateApiKey, getRateLimitKey } from '@/lib/api-auth';
import { createProviderOrder } from '@/lib/provider';
import { createNotification } from '@/lib/notifications';

export async function POST(request: Request) {
  // --- Auth ---------------------------------------------------
  const auth = await authenticateApiKey(request);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 });
  }

  // --- Rate limit: 60/min ------------------------------------
  const rlKey = getRateLimitKey(request, auth);
  const rl = rateLimit(rlKey, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    // --- Parse params (form-encoded or JSON) ------------------
    let serviceId: string | undefined;
    let link: string | undefined;
    let quantityStr: string | undefined;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      const params = new URLSearchParams(text);
      serviceId = params.get('service') || undefined;
      link = params.get('link') || undefined;
      quantityStr = params.get('quantity') || undefined;
    } else {
      const body = await request.json();
      serviceId = body.service;
      link = body.link;
      quantityStr = body.quantity;
    }

    if (!serviceId) {
      return NextResponse.json({ error: 'Parameter "service" is required' }, { status: 400 });
    }
    if (!link) {
      return NextResponse.json({ error: 'Parameter "link" is required' }, { status: 400 });
    }
    const quantity = parseInt(quantityStr ?? '', 10);
    if (!quantityStr || isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Parameter "quantity" must be a positive integer' }, { status: 400 });
    }

    // --- Validate service --------------------------------------
    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: { provider: true },
    });
    if (!service || service.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Service not found or inactive' }, { status: 400 });
    }
    if (quantity < service.minQuantity || quantity > service.maxQuantity) {
      return NextResponse.json(
        { error: `Quantity must be between ${service.minQuantity} and ${service.maxQuantity}` },
        { status: 400 }
      );
    }

    // --- Calculate charge server-side --------------------------
    const charge = (service.price * quantity) / 1000;

    // --- Check balance -----------------------------------------
    const freshUser = await db.user.findUnique({
      where: { id: auth.user.id },
      select: { balance: true },
    });
    if (!freshUser || freshUser.balance < charge) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // --- Create order + transaction atomically -----------------
    const result = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: auth.user.id },
        data: { balance: { decrement: charge } },
      });

      const order = await tx.order.create({
        data: {
          userId: auth.user.id,
          serviceId,
          targetUrl: link,
          quantity,
          charge,
          status: 'PENDING',
        },
      });

      await tx.transaction.create({
        data: {
          userId: auth.user.id,
          type: 'ORDER_PAYMENT',
          amount: -charge,
          balance: updatedUser.balance,
          reference: order.id,
        },
      });

      await createNotification(
        auth.user.id,
        'Order Placed (API)',
        `Your order #${order.id.slice(0, 8)} for $${charge.toFixed(2)} has been placed via API.`,
        'order'
      );

      return { order, newBalance: updatedUser.balance };
    });

    // --- Call provider if configured ---------------------------
    if (service.provider && service.providerServiceId) {
      try {
        const providerResult = await createProviderOrder(
          { apiUrl: service.provider.apiUrl, apiKey: service.provider.apiKey },
          service.providerServiceId,
          link,
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
      } catch {
        // Refund on provider failure
        await db.$transaction(async (tx) => {
          const updatedUser = await tx.user.update({
            where: { id: auth.user.id },
            data: { balance: { increment: charge } },
          });

          await tx.order.update({
            where: { id: result.order.id },
            data: { status: 'FAILED' },
          });

          await tx.transaction.create({
            data: {
              userId: auth.user.id,
              type: 'REFUND',
              amount: charge,
              balance: updatedUser.balance,
              reference: result.order.id,
            },
          });
        });

        await createNotification(
          auth.user.id,
          'Order Failed (API)',
          `Your order #${result.order.id.slice(0, 8)} failed. You have been refunded $${charge.toFixed(2)}.`
        );
      }
    }

    return NextResponse.json({ order: result.order.id });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
