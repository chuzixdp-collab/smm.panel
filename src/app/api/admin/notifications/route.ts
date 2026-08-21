import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { success, error, forbidden, serverError } from '@/lib/api-response';
import { sendNotificationSchema, sendBulkNotificationSchema } from '@/lib/validations';
import { createNotification, createBulkNotifications } from '@/lib/notifications';
import { logAudit } from '@/lib/audit';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin().catch(() => null);
    if (!admin) return forbidden();

    const body = await request.json();
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';

    // Try single notification first
    if (body.userId && !body.userIds) {
      const parsed = sendNotificationSchema.safeParse(body);
      if (!parsed.success) {
        return error(parsed.error.issues[0].message);
      }

      await createNotification(
        parsed.data.userId,
        parsed.data.title,
        parsed.data.message,
        parsed.data.type || 'info'
      );

      await logAudit(
        admin.id,
        'notification.send',
        parsed.data.userId,
        undefined,
        JSON.stringify({ title: parsed.data.title, type: parsed.data.type || 'info' }),
        ip
      );

      return success({ message: 'Notification sent' });
    }

    // Try bulk notification
    if (body.userIds) {
      const parsed = sendBulkNotificationSchema.safeParse(body);
      if (!parsed.success) {
        return error(parsed.error.issues[0].message);
      }

      await createBulkNotifications(
        parsed.data.userIds,
        parsed.data.title,
        parsed.data.message,
        parsed.data.type || 'info'
      );

      await logAudit(
        admin.id,
        'notification.send_bulk',
        undefined,
        undefined,
        JSON.stringify({
          userIds: parsed.data.userIds.length,
          title: parsed.data.title,
          type: parsed.data.type || 'info',
        }),
        ip
      );

      return success({ message: `Notification sent to ${parsed.data.userIds.length} users` });
    }

    return error('Provide userId for single or userIds for bulk notification');
  } catch (err) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Account suspended' || err.message === 'Forbidden')) {
      return forbidden(err.message);
    }
    return serverError();
  }
}
