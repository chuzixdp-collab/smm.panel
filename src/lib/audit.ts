import { db } from '@/lib/db';

/**
 * Log an admin action to the AuditLog table.
 *
 * @param adminId  — the admin user who performed the action
 * @param action   — a short descriptive slug, e.g. "user.suspend", "deposit.approve"
 * @param target   — optional identifier of the affected entity (user id, order id, …)
 * @param previousValue — optional JSON-stringified previous state
 * @param newValue — optional JSON-stringified new state
 * @param ipAddress — optional client IP
 */
export async function logAudit(
  adminId: string,
  action: string,
  target?: string,
  previousValue?: string,
  newValue?: string,
  ipAddress?: string
) {
  await db.auditLog.create({
    data: { adminId, action, target, previousValue, newValue, ipAddress },
  });
}
