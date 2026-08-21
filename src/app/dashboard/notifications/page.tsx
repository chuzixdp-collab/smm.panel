'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500" />,
  success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  error: <XCircle className="h-5 w-5 text-red-500" />,
  order: <AlertCircle className="h-5 w-5 text-indigo-500" />,
  payment: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  system: <Info className="h-5 w-5 text-slate-500" />,
};

const typeBg: Record<string, string> = {
  info: 'bg-blue-50',
  success: 'bg-green-50',
  warning: 'bg-yellow-50',
  error: 'bg-red-50',
  order: 'bg-indigo-50',
  payment: 'bg-green-50',
  system: 'bg-slate-50',
};

function NotificationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.data?.notifications || json.data || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    const notif = notifications.find((n) => n.id === id);
    if (notif?.read) return;

    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
      }
    } catch {
      // silent
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You\'re all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="w-fit"
          >
            <CheckCheck className="h-4 w-4" />
            {markingAll ? 'Marking...' : 'Mark All as Read'}
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="border-slate-200">
          <CardContent className="p-6"><NotificationsSkeleton /></CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-full bg-slate-100 p-6">
            <BellOff className="h-10 w-10 text-slate-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No notifications</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            You don\'t have any notifications yet. We\'ll notify you about order updates, payments, and important announcements.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: 'easeOut' as const }}
          className="space-y-2"
        >
          {notifications.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const, delay: idx * 0.03 }}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${
                notif.read
                  ? 'border-slate-200 bg-white'
                  : 'border-indigo-100 bg-indigo-50/30'
              }`}
            >
              {/* Icon */}
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${
                  typeBg[notif.type] || 'bg-slate-50'
                }`}
              >
                {typeIcons[notif.type] || typeIcons.system}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${
                      notif.read ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'
                    }`}
                  >
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 flex-shrink-0 mt-1.5" />
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {timeAgo(notif.createdAt)}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
