import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, serverError, unauthorized } from '@/lib/api-response';
import { headers } from 'next/headers';
import { logAudit } from '@/lib/audit';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    void (await headers()).get('x-forwarded-for');

    const { id } = await params;

    const service = await db.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!service) {
      return error('Service not found', 404);
    }

    return success(service);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return error('Service not found', 404);
    }

    const body = await request.json();
    const previousValues = JSON.stringify(existing);

    const { platform, category, name, description, providerId, providerServiceId, providerCost, price, resellerPrice, minQuantity, maxQuantity, refillAvailable, cancelAvailable, sortOrder } = body;

    const updateData: Record<string, unknown> = {};
    if (platform !== undefined) updateData.platform = platform;
    if (category !== undefined) updateData.category = category;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (providerId !== undefined) updateData.providerId = providerId;
    if (providerServiceId !== undefined) updateData.providerServiceId = providerServiceId;
    if (providerCost !== undefined) updateData.providerCost = providerCost;
    if (price !== undefined) updateData.price = price;
    if (resellerPrice !== undefined) updateData.resellerPrice = resellerPrice;
    if (minQuantity !== undefined) updateData.minQuantity = minQuantity;
    if (maxQuantity !== undefined) updateData.maxQuantity = maxQuantity;
    if (refillAvailable !== undefined) updateData.refillAvailable = refillAvailable;
    if (cancelAvailable !== undefined) updateData.cancelAvailable = cancelAvailable;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const service = await db.service.update({
      where: { id },
      data: updateData,
    });

    await logAudit(
      admin.id,
      'service.update',
      id,
      previousValues,
      JSON.stringify(service),
      ip
    );

    return success(service);
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { id } = await params;

    const existing = await db.service.findUnique({ where: { id } });
    if (!existing) {
      return error('Service not found', 404);
    }

    // Check if service has existing orders
    const orderCount = await db.order.count({ where: { serviceId: id } });
    if (orderCount > 0) {
      // Soft delete if orders exist
      const service = await db.service.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      await logAudit(
        admin.id,
        'service.delete',
        id,
        JSON.stringify({ status: existing.status }),
        JSON.stringify({ status: 'INACTIVE' }),
        ip
      );
      return success({ id: service.id, status: service.status, warning: 'Service has orders, deactivated instead of deleted' });
    }

    // Hard delete if no orders
    await db.service.delete({ where: { id } });

    await logAudit(
      admin.id,
      'service.delete',
      id,
      JSON.stringify(existing),
      undefined,
      ip
    );

    return success({ id, deleted: true });
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return unauthorized(err.message);
    }
    return serverError();
  }
}
