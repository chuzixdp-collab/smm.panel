'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Loader2,
  Users,
  User,
  Search,
  Bell,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface UserOption {
  id: string;
  email: string;
  name?: string;
}

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'order', label: 'Order' },
  { value: 'payment', label: 'Payment' },
  { value: 'system', label: 'System' },
];

const typeBadgeStyles: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  order: 'bg-indigo-100 text-indigo-700',
  payment: 'bg-emerald-100 text-emerald-700',
  system: 'bg-slate-100 text-slate-700',
};

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.3 } },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { ease: 'easeOut' as const, duration: 0.4 } },
};

export default function NotificationsPage() {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form state
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [notifType, setNotifType] = useState('info');

  // Recent notifications
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.set('search', userSearch);
      const res = await fetch(`/api/admin/users?${params}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userSearch]);

  useEffect(() => {
    if (targetType === 'specific') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [fetchUsers, targetType]);

  const filteredUsers = userSearch
    ? users.filter((u) => u.email.toLowerCase().includes(userSearch.toLowerCase()) || (u.name || '').toLowerCase().includes(userSearch.toLowerCase()))
    : users;

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const payload: any = {
        title,
        message,
        type: notifType,
        targetAll: targetType === 'all',
      };
      if (targetType === 'specific' && selectedUserId) {
        payload.userId = selectedUserId;
      }

      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success('Notification sent successfully');
        setTitle('');
        setMessage('');
        setSelectedUserId('');
      } else {
        toast.error('Failed to send notification');
      }
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ ease: 'easeOut' as const, duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Send notifications to users</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Send Notification Form */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="size-5 text-indigo-600" />
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Target Selection */}
              <div className="space-y-3">
                <Label>Target Audience</Label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      value="all"
                      checked={targetType === 'all'}
                      onChange={() => setTargetType('all')}
                      className="accent-indigo-600"
                    />
                    <div className="flex items-center gap-2">
                      <Users className="size-4 text-slate-500" />
                      <span className="text-sm">All Users</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="target"
                      value="specific"
                      checked={targetType === 'specific'}
                      onChange={() => setTargetType('specific')}
                      className="accent-indigo-600"
                    />
                    <div className="flex items-center gap-2">
                      <User className="size-4 text-slate-500" />
                      <span className="text-sm">Specific User</span>
                    </div>
                  </label>
                </div>
              </div>

              {targetType === 'specific' && (
                <div className="space-y-2">
                  <Label>Select User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      placeholder="Search users by email..."
                      className="pl-9"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  {loading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.email}{u.name ? ` (${u.name})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={notifType} onValueChange={setNotifType}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim()}
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
