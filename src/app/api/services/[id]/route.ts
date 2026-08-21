import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { success, error, serverError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = await db.service.findUnique({
      where: { id },
      include: {
        provider: { select: { id: true, name: true } },
      },
    });

    if (!service) {
      return error('Service not found', 404);
    }

    return success(service);
  } catch (err) {
    return serverError();
  }
}
