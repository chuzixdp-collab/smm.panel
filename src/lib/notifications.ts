import { db } from '@/lib/db';

/**
 * Create a single notification for a user.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'info'
) {
  await db.notification.create({
    data: { userId, title, message, type },
  });
}

/**
 * Create notifications for multiple users at once (bulk insert).
 */
export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  type: string = 'info'
) {
  if (userIds.length === 0) return;

  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, title, message, type })),
  });
}

// ============================================================
// READ HELPERS (kept from original)
// ============================================================

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, isRead: false },
  });
}

export async function getNotifications(userId: string, limit = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  await db.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  await db.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
